using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RIDEX.Core.Entities;
using RIDEX.Core.Interfaces;
using RIDEX.Infrastructure.Data;
using RIDEX.Shared.Algorithms;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.Infrastructure.Providers;

public class OSRMRoutingService : IRoutingService
{
    private readonly HttpClient _httpClient;
    private readonly RideXDbContext _dbContext;
    private readonly ILogger<OSRMRoutingService> _logger;

    public OSRMRoutingService(
        HttpClient httpClient,
        RideXDbContext dbContext,
        ILogger<OSRMRoutingService> logger)
    {
        _httpClient = httpClient;
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<RouteDto> CalculateRouteAsync(RoutePlanRequest request, CancellationToken cancellationToken = default)
    {
        var cacheKey = ComputeCacheKey(request);

        // 1. Check SQLite/Database Route Cache
        var cachedRoute = await _dbContext.RouteCaches
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.CacheKey == cacheKey && c.ExpiresAt > DateTime.UtcNow, cancellationToken);

        if (cachedRoute != null)
        {
            _logger.LogInformation("Route retrieved from zero-cost local cache: {CacheKey}", cacheKey);
            return BuildRouteDtoFromCache(cachedRoute, request);
        }

        // 2. Build coordinates sequence: Origin -> Waypoints -> Destination
        var coordList = new List<(double Lat, double Lon)>
        {
            (request.OriginLatitude, request.OriginLongitude)
        };

        foreach (var wp in request.Waypoints.OrderBy(w => w.Order))
        {
            coordList.Add((wp.Latitude, wp.Longitude));
        }

        coordList.Add((request.DestinationLatitude, request.DestinationLongitude));

        try
        {
            // Format for OSRM: lon,lat;lon,lat;...
            var coordsString = string.Join(";", coordList.Select(c => $"{c.Lon.ToString(System.Globalization.CultureInfo.InvariantCulture)},{c.Lat.ToString(System.Globalization.CultureInfo.InvariantCulture)}"));
            var url = $"https://router.project-osrm.org/route/v1/driving/{coordsString}?overview=full&geometries=geojson&steps=true";

            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("RIDEX-MotorcycleTouring/1.0 (contact@ridex.local)");
            var response = await _httpClient.GetAsync(url, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;

                if (root.TryGetProperty("routes", out var routes) && routes.GetArrayLength() > 0)
                {
                    var primaryRoute = routes[0];
                    var distanceMeters = primaryRoute.GetProperty("distance").GetDouble();
                    var durationSeconds = primaryRoute.GetProperty("duration").GetDouble();
                    var distanceKm = distanceMeters / 1000.0;
                    var durationMinutes = durationSeconds / 60.0;

                    var geometry = primaryRoute.GetProperty("geometry");
                    var polylineGeoJson = geometry.GetRawText();

                    var instructions = new List<RouteInstructionDto>();
                    if (primaryRoute.TryGetProperty("legs", out var legs))
                    {
                        foreach (var leg in legs.EnumerateArray())
                        {
                            if (leg.TryGetProperty("steps", out var steps))
                            {
                                foreach (var step in steps.EnumerateArray())
                                {
                                    var maneuver = step.GetProperty("maneuver");
                                    var stepLoc = maneuver.GetProperty("location");
                                    var lon = stepLoc[0].GetDouble();
                                    var lat = stepLoc[1].GetDouble();
                                    var text = step.GetProperty("name").GetString();
                                    var stepDist = step.GetProperty("distance").GetDouble();
                                    var stepDur = step.GetProperty("duration").GetDouble();

                                    instructions.Add(new RouteInstructionDto
                                    {
                                        Text = string.IsNullOrWhiteSpace(text) ? "Continue straight" : $"Turn on {text}",
                                        DistanceMeters = stepDist,
                                        DurationSeconds = stepDur,
                                        Latitude = lat,
                                        Longitude = lon
                                    });
                                }
                            }
                        }
                    }

                    // Save to zero-cost cache safely
                    var cacheEntry = new RouteCache
                    {
                        CacheKey = cacheKey,
                        OriginName = request.OriginName,
                        DestinationName = request.DestinationName,
                        DistanceKm = distanceKm,
                        DurationMinutes = durationMinutes,
                        PolylineGeometry = polylineGeoJson,
                        InstructionsJson = JsonSerializer.Serialize(instructions),
                        ExpiresAt = DateTime.UtcNow.AddDays(7)
                    };

                    try
                    {
                        var existing = await _dbContext.RouteCaches.FirstOrDefaultAsync(c => c.CacheKey == cacheKey, cancellationToken);
                        if (existing == null)
                        {
                            _dbContext.RouteCaches.Add(cacheEntry);
                            await _dbContext.SaveChangesAsync(cancellationToken);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogDebug(ex, "Cache entry already stored for key {CacheKey}", cacheKey);
                    }

                    return AssembleRouteResponse(cacheEntry, request, instructions);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "OSRM API request failed or rate-limited. Falling back to local offline route synthesis.");
        }

        // 3. Fallback: Synthesize offline route path with Haversine metrics
        return SynthesizeOfflineRoute(request);
    }

    private static string ComputeCacheKey(RoutePlanRequest req)
    {
        var raw = $"{req.OriginLatitude:F4},{req.OriginLongitude:F4}|{req.DestinationLatitude:F4},{req.DestinationLongitude:F4}|{req.Preference}|{req.Waypoints.Count}";
        using var sha = SHA256.Create();
        var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(hash);
    }

    private RouteDto BuildRouteDtoFromCache(RouteCache cached, RoutePlanRequest request)
    {
        var instructions = string.IsNullOrEmpty(cached.InstructionsJson)
            ? new List<RouteInstructionDto>()
            : JsonSerializer.Deserialize<List<RouteInstructionDto>>(cached.InstructionsJson) ?? new();

        return AssembleRouteResponse(cached, request, instructions);
    }

    private RouteDto AssembleRouteResponse(RouteCache cached, RoutePlanRequest req, List<RouteInstructionDto> instructions)
    {
        var routeDto = new RouteDto
        {
            Id = cached.Id,
            OriginName = req.OriginName,
            OriginLatitude = req.OriginLatitude,
            OriginLongitude = req.OriginLongitude,
            DestinationName = req.DestinationName,
            DestinationLatitude = req.DestinationLatitude,
            DestinationLongitude = req.DestinationLongitude,
            TotalDistanceKm = cached.DistanceKm,
            EstimatedDurationMinutes = cached.DurationMinutes,
            PolylineGeometry = cached.PolylineGeometry,
            Preference = req.Preference,
            Waypoints = req.Waypoints,
            Instructions = instructions
        };

        // Calculate fuel estimation
        var mileage = req.MotorcycleMileageKmpl ?? 24.0;
        var tankCapacity = req.FuelTankCapacityLiters ?? 17.0;
        var fuelPrice = req.FuelPricePerLiter ?? 105.0m;

        var fuelRequired = cached.DistanceKm / mileage;
        var estimatedCost = (decimal)fuelRequired * fuelPrice;
        var maxRange = mileage * tankCapacity;
        var recommendedStops = (int)Math.Max(0, Math.Floor(cached.DistanceKm / (maxRange * 0.75)));

        routeDto.FuelEstimate = new FuelEstimateDto
        {
            DistanceKm = cached.DistanceKm,
            MileageKmpl = mileage,
            FuelRequiredLiters = Math.Round(fuelRequired, 2),
            EstimatedFuelCost = Math.Round(estimatedCost, 2),
            TankCapacityLiters = tankCapacity,
            MaxRangeKm = Math.Round(maxRange, 1),
            RecommendedFuelStopsCount = recommendedStops
        };

        return routeDto;
    }

    private RouteDto SynthesizeOfflineRoute(RoutePlanRequest req)
    {
        var allPoints = new List<(double Lat, double Lon)>
        {
            (req.OriginLatitude, req.OriginLongitude)
        };
        allPoints.AddRange(req.Waypoints.OrderBy(w => w.Order).Select(w => (w.Latitude, w.Longitude)));
        allPoints.Add((req.DestinationLatitude, req.DestinationLongitude));

        double totalDistance = 0;
        var geoJsonCoordinates = new List<double[]>();

        for (int i = 0; i < allPoints.Count - 1; i++)
        {
            var p1 = allPoints[i];
            var p2 = allPoints[i + 1];
            totalDistance += GeoMath.HaversineDistanceKm(p1.Lat, p1.Lon, p2.Lat, p2.Lon);

            // Interpolate points for smooth offline visual polyline
            int segments = 10;
            for (int s = 0; s < segments; s++)
            {
                var factor = (double)s / segments;
                var lat = p1.Lat + (p2.Lat - p1.Lat) * factor;
                var lon = p1.Lon + (p2.Lon - p1.Lon) * factor;
                geoJsonCoordinates.Add(new[] { lon, lat });
            }
        }

        var last = allPoints.Last();
        geoJsonCoordinates.Add(new[] { last.Lon, last.Lat });

        // Adjust estimated distance with a typical road curvature factor (1.25x)
        var roadDistanceKm = totalDistance * 1.25;
        var durationMinutes = (roadDistanceKm / 45.0) * 60.0; // Average touring speed ~45 km/h in ghats/highways

        var polylineGeoJson = JsonSerializer.Serialize(new
        {
            type = "LineString",
            coordinates = geoJsonCoordinates
        });

        var cacheEntry = new RouteCache
        {
            Id = Guid.NewGuid(),
            CacheKey = ComputeCacheKey(req),
            OriginName = req.OriginName,
            DestinationName = req.DestinationName,
            DistanceKm = Math.Round(roadDistanceKm, 1),
            DurationMinutes = Math.Round(durationMinutes, 0),
            PolylineGeometry = polylineGeoJson,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        var instructions = new List<RouteInstructionDto>
        {
            new() { Text = $"Depart from {req.OriginName}", DistanceMeters = 0, Latitude = req.OriginLatitude, Longitude = req.OriginLongitude }
        };

        foreach (var wp in req.Waypoints.OrderBy(w => w.Order))
        {
            instructions.Add(new() { Text = $"Waypoint: {wp.Name}", Latitude = wp.Latitude, Longitude = wp.Longitude });
        }

        instructions.Add(new() { Text = $"Arrive at {req.DestinationName}", Latitude = req.DestinationLatitude, Longitude = req.DestinationLongitude });

        return AssembleRouteResponse(cacheEntry, req, instructions);
    }
}
