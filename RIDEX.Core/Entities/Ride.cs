using RIDEX.Shared.Enums;

namespace RIDEX.Core.Entities;

public class Ride : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string JoinCode { get; set; } = string.Empty;
    public RideStatus Status { get; set; } = RideStatus.Upcoming;
    public DateTime ScheduledStartTime { get; set; }
    public DateTime? ActualStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }
    public int MaxRiders { get; set; } = 20;
    public double SeparationThresholdKm { get; set; } = 2.0;

    public Guid OwnerId { get; set; }
    public User Owner { get; set; } = null!;

    public Guid? ActiveMotorcycleId { get; set; }
    public Motorcycle? ActiveMotorcycle { get; set; }

    public Route? Route { get; set; }

    public ICollection<RideMember> Members { get; set; } = new List<RideMember>();
    public ICollection<HistoricalGpsPoint> HistoricalGpsPoints { get; set; } = new List<HistoricalGpsPoint>();
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
    public ICollection<FuelLog> FuelLogs { get; set; } = new List<FuelLog>();
    public ICollection<EmergencyAlert> EmergencyAlerts { get; set; } = new List<EmergencyAlert>();
}
