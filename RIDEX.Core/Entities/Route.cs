using RIDEX.Shared.Enums;

namespace RIDEX.Core.Entities;

public class Route : BaseEntity
{
    public Guid? RideId { get; set; }
    public Ride? Ride { get; set; }

    public string OriginName { get; set; } = string.Empty;
    public double OriginLatitude { get; set; }
    public double OriginLongitude { get; set; }

    public string DestinationName { get; set; } = string.Empty;
    public double DestinationLatitude { get; set; }
    public double DestinationLongitude { get; set; }

    public double TotalDistanceKm { get; set; }
    public double EstimatedDurationMinutes { get; set; }
    public string PolylineGeometry { get; set; } = string.Empty; // GeoJSON or Polyline representation
    public RoutePreference Preference { get; set; } = RoutePreference.Fastest;

    public string? InstructionsJson { get; set; }
    public string? WeatherSnapshotJson { get; set; }

    public ICollection<Waypoint> Waypoints { get; set; } = new List<Waypoint>();
}
