using RIDEX.Shared.Enums;

namespace RIDEX.Core.Entities;

public class ServiceRecord : BaseEntity
{
    public Guid MotorcycleId { get; set; }
    public Motorcycle Motorcycle { get; set; } = null!;

    public ServiceType ServiceType { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public double OdometerKm { get; set; }
    public decimal Cost { get; set; }
    public string? WorkshopName { get; set; }
    public DateTime ServiceDate { get; set; } = DateTime.UtcNow;
}

public class ServiceReminder : BaseEntity
{
    public Guid MotorcycleId { get; set; }
    public Motorcycle Motorcycle { get; set; } = null!;

    public ServiceType ServiceType { get; set; }
    public string Title { get; set; } = string.Empty;
    public double? DueOdometerKm { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsDismissed { get; set; } = false;
}
