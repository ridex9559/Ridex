using System.ComponentModel.DataAnnotations;

namespace RIDEX.Shared.DTOs;

public class MotorcycleDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty;
    public double FuelTankCapacityLiters { get; set; }
    public double AverageMileageKmpl { get; set; }
    public double CurrentOdometerKm { get; set; }
    public DateTime? InsuranceExpiry { get; set; }
    public DateTime? PucExpiry { get; set; }
    public bool IsPrimary { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateMotorcycleRequest
{
    [Required, MaxLength(50)]
    public string Brand { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Model { get; set; } = string.Empty;

    [Range(1900, 2100)]
    public int Year { get; set; }

    [Required, MaxLength(20)]
    public string RegistrationNumber { get; set; } = string.Empty;

    [Range(1.0, 100.0)]
    public double FuelTankCapacityLiters { get; set; }

    [Range(1.0, 150.0)]
    public double AverageMileageKmpl { get; set; }

    [Range(0.0, 2000000.0)]
    public double CurrentOdometerKm { get; set; }

    public DateTime? InsuranceExpiry { get; set; }
    public DateTime? PucExpiry { get; set; }
    public bool IsPrimary { get; set; }
    public string? ImageUrl { get; set; }
}

public class UpdateMotorcycleRequest
{
    [Required, MaxLength(50)]
    public string Brand { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Model { get; set; } = string.Empty;

    [Range(1900, 2100)]
    public int Year { get; set; }

    [Required, MaxLength(20)]
    public string RegistrationNumber { get; set; } = string.Empty;

    [Range(1.0, 100.0)]
    public double FuelTankCapacityLiters { get; set; }

    [Range(1.0, 150.0)]
    public double AverageMileageKmpl { get; set; }

    [Range(0.0, 2000000.0)]
    public double CurrentOdometerKm { get; set; }

    public DateTime? InsuranceExpiry { get; set; }
    public DateTime? PucExpiry { get; set; }
    public bool IsPrimary { get; set; }
    public string? ImageUrl { get; set; }
}
