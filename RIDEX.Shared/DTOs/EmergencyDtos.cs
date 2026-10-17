using System.ComponentModel.DataAnnotations;
using RIDEX.Shared.Enums;

namespace RIDEX.Shared.DTOs;

public class EmergencyContactDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
}

public class CreateEmergencyContactRequest
{
    [Required, MinLength(2), MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, Phone]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Relationship { get; set; } = string.Empty;

    public bool IsPrimary { get; set; }
}

public class SosTriggerRequest
{
    public Guid? RideId { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double? Altitude { get; set; }
    public string? Message { get; set; }
    public DateTime TriggeredAt { get; set; } = DateTime.UtcNow;
}

public class EmergencyAlertDto
{
    public Guid AlertId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserPhoneNumber { get; set; }
    public Guid? RideId { get; set; }
    public string? RideTitle { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double? Altitude { get; set; }
    public string Message { get; set; } = string.Empty;
    public EmergencyStatus Status { get; set; }
    public DateTime TriggeredAt { get; set; }
    public List<EmergencyContactDto> EmergencyContacts { get; set; } = new();
}
