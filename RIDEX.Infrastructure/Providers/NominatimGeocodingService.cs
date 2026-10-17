using System.Text.Json;
using Microsoft.Extensions.Logging;
using RIDEX.Core.Interfaces;
using RIDEX.Shared.DTOs;

namespace RIDEX.Infrastructure.Providers;

public class NominatimGeocodingService : IGeocodingService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<NominatimGeocodingService> _logger;

    public NominatimGeocodingService(HttpClient httpClient, ILogger<NominatimGeocodingService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<List<WaypointDto>> SearchLocationsAsync(string query, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            return new List<WaypointDto>();

        try
        {
            var encodedQuery = Uri.EscapeDataString(query);
            var url = $"https://nominatim.openstreetmap.org/search?q={encodedQuery}&format=json&limit=5&addressdetails=1";

            _httpClient.DefaultRequestHeaders.UserAgent.Clear();
            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("RIDEX-MotorcycleTouringApp/1.0 (contact@ridex.local)");

            var response = await _httpClient.GetAsync(url, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                using var doc = JsonDocument.Parse(content);

                var results = new List<WaypointDto>();
                foreach (var item in doc.RootElement.EnumerateArray())
                {
                    var name = item.GetProperty("display_name").GetString() ?? query;
                    var shortName = name.Split(',').FirstOrDefault()?.Trim() ?? name;
                    var lat = double.Parse(item.GetProperty("lat").GetString()!, System.Globalization.CultureInfo.InvariantCulture);
                    var lon = double.Parse(item.GetProperty("lon").GetString()!, System.Globalization.CultureInfo.InvariantCulture);

                    results.Add(new WaypointDto
                    {
                        Id = Guid.NewGuid(),
                        Name = shortName,
                        Address = name,
                        Latitude = lat,
                        Longitude = lon
                    });
                }

                return results;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Nominatim geocoding failed for {Query}", query);
        }

        // Offline mock fallback for popular Indian motorcycle touring destinations
        return GetOfflineSearchFallback(query);
    }

    public async Task<WaypointDto?> ReverseGeocodeAsync(double latitude, double longitude, CancellationToken cancellationToken = default)
    {
        try
        {
            var url = $"https://nominatim.openstreetmap.org/reverse?lat={latitude.ToString(System.Globalization.CultureInfo.InvariantCulture)}&lon={longitude.ToString(System.Globalization.CultureInfo.InvariantCulture)}&format=json";

            _httpClient.DefaultRequestHeaders.UserAgent.Clear();
            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("RIDEX-MotorcycleTouringApp/1.0 (contact@ridex.local)");

            var response = await _httpClient.GetAsync(url, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;
                var displayName = root.GetProperty("display_name").GetString() ?? $"{latitude:F3}, {longitude:F3}";
                var shortName = displayName.Split(',').FirstOrDefault()?.Trim() ?? displayName;

                return new WaypointDto
                {
                    Id = Guid.NewGuid(),
                    Name = shortName,
                    Address = displayName,
                    Latitude = latitude,
                    Longitude = longitude
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Nominatim reverse geocode failed for ({Lat}, {Lon})", latitude, longitude);
        }

        return new WaypointDto
        {
            Id = Guid.NewGuid(),
            Name = $"Waypoint ({latitude:F3}, {longitude:F3})",
            Address = $"Coordinates: {latitude:F4}, {longitude:F4}",
            Latitude = latitude,
            Longitude = longitude
        };
    }

    private static List<WaypointDto> GetOfflineSearchFallback(string query)
    {
        var preset = new List<WaypointDto>
        {
            new() { Id = Guid.NewGuid(), Name = "Nashik", Address = "Nashik, Maharashtra, India", Latitude = 19.9975, Longitude = 73.7898 },
            new() { Id = Guid.NewGuid(), Name = "Pune", Address = "Pune, Maharashtra, India", Latitude = 18.5204, Longitude = 73.8567 },
            new() { Id = Guid.NewGuid(), Name = "Bhandardara", Address = "Bhandardara Lake & Ghat, Maharashtra, India", Latitude = 19.5447, Longitude = 73.7663 },
            new() { Id = Guid.NewGuid(), Name = "Malshej Ghat", Address = "Malshej Ghat Mountain Pass, Maharashtra, India", Latitude = 19.3400, Longitude = 73.7740 },
            new() { Id = Guid.NewGuid(), Name = "Lonavala", Address = "Lonavala, Maharashtra, India", Latitude = 18.7557, Longitude = 73.4091 },
            new() { Id = Guid.NewGuid(), Name = "Trimbakeshwar", Address = "Trimbakeshwar, Nashik, Maharashtra, India", Latitude = 19.9328, Longitude = 73.5307 },
            new() { Id = Guid.NewGuid(), Name = "Mahabaleshwar", Address = "Mahabaleshwar Hill Station, Maharashtra, India", Latitude = 17.9237, Longitude = 73.6586 },
            new() { Id = Guid.NewGuid(), Name = "Goa (Panaji)", Address = "Panaji, Goa, India", Latitude = 15.4909, Longitude = 73.8278 },
            new() { Id = Guid.NewGuid(), Name = "Leh Ladakh", Address = "Leh, Ladakh, India", Latitude = 34.1526, Longitude = 77.5771 },
            new() { Id = Guid.NewGuid(), Name = "Spiti Valley (Kaza)", Address = "Kaza, Spiti Valley, Himachal Pradesh, India", Latitude = 32.2276, Longitude = 78.0710 }
        };

        return preset
            .Where(p => p.Name.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                        p.Address!.Contains(query, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }
}
