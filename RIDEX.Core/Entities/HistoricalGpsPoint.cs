namespace RIDEX.Core.Entities;

public class HistoricalGpsPoint : BaseEntity
{
    public Guid RideId { get; set; }
    public Ride Ride { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double? Altitude { get; set; }
    public double SpeedKmh { get; set; }
    public double Heading { get; set; }
    public double AccuracyMeters { get; set; }
    public DateTime Timestamp { get; set; }
}
