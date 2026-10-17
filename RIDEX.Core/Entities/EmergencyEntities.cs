using RIDEX.Shared.Enums;

namespace RIDEX.Core.Entities;

public class EmergencyContact : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public bool IsPrimary { get; set; } = false;
}

public class EmergencyAlert : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid? RideId { get; set; }
    public Ride? Ride { get; set; }

    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double? Altitude { get; set; }
    public string Message { get; set; } = string.Empty;
    public EmergencyStatus Status { get; set; } = EmergencyStatus.Active;
    public DateTime TriggeredAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
}
