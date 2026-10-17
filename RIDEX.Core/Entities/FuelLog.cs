namespace RIDEX.Core.Entities;

public class FuelLog : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid? MotorcycleId { get; set; }
    public Motorcycle? Motorcycle { get; set; }

    public Guid? RideId { get; set; }
    public Ride? Ride { get; set; }

    public double Liters { get; set; }
    public decimal PricePerLiter { get; set; }
    public decimal TotalCost { get; set; }
    public double OdometerKm { get; set; }
    public string? FuelStationName { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public double? CalculatedMileageKmpl { get; set; }
    public DateTime LoggedAt { get; set; } = DateTime.UtcNow;
}
