using RIDEX.Shared.Enums;

namespace RIDEX.Core.Entities;

public class RideMember : BaseEntity
{
    public Guid RideId { get; set; }
    public Ride Ride { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid? MotorcycleId { get; set; }
    public Motorcycle? Motorcycle { get; set; }

    public RideRole Role { get; set; } = RideRole.Member;
    public RiderOnlineStatus OnlineStatus { get; set; } = RiderOnlineStatus.Offline;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLocationUpdate { get; set; }

    public double? CurrentLatitude { get; set; }
    public double? CurrentLongitude { get; set; }
    public double? CurrentSpeedKmh { get; set; }
    public double? CurrentHeading { get; set; }
    public double? BatteryLevelPercent { get; set; }
}
