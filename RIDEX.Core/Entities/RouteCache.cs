namespace RIDEX.Core.Entities;

public class RouteCache : BaseEntity
{
    public string CacheKey { get; set; } = string.Empty; // Hash of origin, destination, waypoints, preference
    public string OriginName { get; set; } = string.Empty;
    public string DestinationName { get; set; } = string.Empty;
    public double DistanceKm { get; set; }
    public double DurationMinutes { get; set; }
    public string PolylineGeometry { get; set; } = string.Empty;
    public string? InstructionsJson { get; set; }
    public DateTime ExpiresAt { get; set; }
}
