using RIDEX.Shared.Algorithms;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.Infrastructure.Services;

public class SimulatedRiderProfile
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string MotorcycleModel { get; set; } = string.Empty;
    public double SpeedVariationFactor { get; set; } = 1.0;
    public double DelayOffsetKm { get; set; } = 0.0;
    public int CurrentIndex { get; set; } = 0;
    public bool SimulateSeparation { get; set; } = false;
}

/// <summary>
/// Simulates realistic multi-rider motorcycle movement along touring routes for demo and development mode.
/// </summary>
public class DemoLocationProvider
{
    private static readonly List<(double Lat, double Lon, string WaypointName)> ScenicGhatsRoute = new()
    {
        (19.9975, 73.7898, "Nashik City Centre"),
        (19.9650, 73.6800, "Gangapur Road Outskirts"),
        (19.9328, 73.5307, "Trimbakeshwar Shiva Foothills"),
        (19.8200, 73.5800, "Vaitarna Valley Overlook"),
        (19.6800, 73.6600, "Igatpuri Mountain Pass"),
        (19.5447, 73.7663, "Bhandardara Arthur Lake & Ghats"),
        (19.4500, 73.7200, "Harishchandragad Base"),
        (19.3400, 73.7740, "Malshej Ghat Waterfall Corridor"),
        (19.2200, 73.8500, "Junnar Valley Highway"),
        (19.0000, 73.8800, "Manchar Bypass"),
        (18.7800, 73.8700, "Rajgurunagar Express Road"),
        (18.6200, 73.8200, "Bhosari Pune Entry"),
        (18.5204, 73.8567, "Pune Shivaji Nagar")
    };

    private readonly List<SimulatedRiderProfile> _simulatedRiders = new()
    {
        new SimulatedRiderProfile
        {
            UserId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            FullName = "Aryan Deshmukh (Leader)",
            MotorcycleModel = "Royal Enfield Himalayan 450",
            SpeedVariationFactor = 1.0,
            DelayOffsetKm = 0.0
        },
        new SimulatedRiderProfile
        {
            UserId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            FullName = "Vikram Patil",
            MotorcycleModel = "KTM 390 Adventure",
            SpeedVariationFactor = 0.96,
            DelayOffsetKm = 0.3
        },
        new SimulatedRiderProfile
        {
            UserId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            FullName = "Neha Sharma",
            MotorcycleModel = "BMW G310 GS",
            SpeedVariationFactor = 0.92,
            DelayOffsetKm = 0.8
        },
        new SimulatedRiderProfile
        {
            UserId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            FullName = "Rohan Mehta (Sweeper)",
            MotorcycleModel = "Triumph Scrambler 400X",
            SpeedVariationFactor = 0.85,
            DelayOffsetKm = 2.4, // Tests separation alert
            SimulateSeparation = true
        }
    };

    public IReadOnlyList<SimulatedRiderProfile> GetSimulatedRiders() => _simulatedRiders;

    public LocationUpdateDto GetNextSimulatedPosition(Guid rideId, Guid userId, int tickStep)
    {
        var rider = _simulatedRiders.FirstOrDefault(r => r.UserId == userId) ?? _simulatedRiders[0];
        var totalPoints = ScenicGhatsRoute.Count;

        // Smooth interpolation along the route points
        double rawIndex = (tickStep * 0.15 * rider.SpeedVariationFactor) % (totalPoints - 1);
        int baseIndex = (int)Math.Floor(rawIndex);
        double fraction = rawIndex - baseIndex;

        var p1 = ScenicGhatsRoute[baseIndex];
        var p2 = ScenicGhatsRoute[Math.Min(baseIndex + 1, totalPoints - 1)];

        var lat = p1.Lat + (p2.Lat - p1.Lat) * fraction;
        var lon = p1.Lon + (p2.Lon - p1.Lon) * fraction;

        var bearing = GeoMath.CalculateBearing(p1.Lat, p1.Lon, p2.Lat, p2.Lon);
        var baseSpeed = 55.0 + Math.Sin(tickStep * 0.2) * 15.0; // 40..70 km/h realistic touring speed

        return new LocationUpdateDto
        {
            RideId = rideId,
            UserId = rider.UserId,
            Latitude = Math.Round(lat, 6),
            Longitude = Math.Round(lon, 6),
            Altitude = 650 + Math.Sin(tickStep * 0.1) * 200, // Ghats elevation ~650m - 850m
            SpeedKmh = Math.Round(baseSpeed * rider.SpeedVariationFactor, 1),
            Heading = Math.Round(bearing, 1),
            AccuracyMeters = 3.5,
            BatteryLevelPercent = Math.Max(20, 95 - (tickStep * 0.1)),
            Timestamp = DateTime.UtcNow
        };
    }
}
