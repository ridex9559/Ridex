using System.ComponentModel.DataAnnotations;
using RIDEX.Shared.Enums;

namespace RIDEX.Shared.DTOs;

public class ServiceRecordDto
{
    public Guid Id { get; set; }
    public Guid MotorcycleId { get; set; }
    public ServiceType ServiceType { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public double OdometerKm { get; set; }
    public decimal Cost { get; set; }
    public string? WorkshopName { get; set; }
    public DateTime ServiceDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateServiceRecordRequest
{
    [Required]
    public Guid MotorcycleId { get; set; }

    public ServiceType ServiceType { get; set; }

    [Required, MinLength(2), MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Range(0.0, 2000000.0)]
    public double OdometerKm { get; set; }

    [Range(0.0, 10000000.0)]
    public decimal Cost { get; set; }

    public string? WorkshopName { get; set; }

    public DateTime ServiceDate { get; set; } = DateTime.UtcNow;
}

public class ServiceReminderDto
{
    public Guid Id { get; set; }
    public Guid MotorcycleId { get; set; }
    public string MotorcycleName { get; set; } = string.Empty;
    public ServiceType ServiceType { get; set; }
    public string Title { get; set; } = string.Empty;
    public double? DueOdometerKm { get; set; }
    public double? RemainingKm { get; set; }
    public DateTime? DueDate { get; set; }
    public int? RemainingDays { get; set; }
    public bool IsOverdue { get; set; }
    public bool IsDismissed { get; set; }
}

public class CreateServiceReminderRequest
{
    [Required]
    public Guid MotorcycleId { get; set; }

    public ServiceType ServiceType { get; set; }

    [Required, MinLength(2), MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    [Range(0.0, 2000000.0)]
    public double? DueOdometerKm { get; set; }

    public DateTime? DueDate { get; set; }
}
