using System.ComponentModel.DataAnnotations;

namespace RIDEX.Shared.DTOs;

public class FuelLogDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? MotorcycleId { get; set; }
    public string? MotorcycleName { get; set; }
    public Guid? RideId { get; set; }
    public double Liters { get; set; }
    public decimal PricePerLiter { get; set; }
    public decimal TotalCost { get; set; }
    public double OdometerKm { get; set; }
    public string? FuelStationName { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public double? CalculatedMileageKmpl { get; set; }
    public DateTime LoggedAt { get; set; }
}

public class CreateFuelLogRequest
{
    public Guid? MotorcycleId { get; set; }
    public Guid? RideId { get; set; }

    [Range(0.1, 150.0)]
    public double Liters { get; set; }

    [Range(0.1, 500.0)]
    public decimal PricePerLiter { get; set; }

    [Range(0.0, 2000000.0)]
    public double OdometerKm { get; set; }

    public string? FuelStationName { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public DateTime LoggedAt { get; set; } = DateTime.UtcNow;
}

public class FuelEstimateDto
{
    public double DistanceKm { get; set; }
    public double MileageKmpl { get; set; }
    public double FuelRequiredLiters { get; set; }
    public decimal EstimatedFuelCost { get; set; }
    public double TankCapacityLiters { get; set; }
    public int RecommendedFuelStopsCount { get; set; }
    public double MaxRangeKm { get; set; }
}
