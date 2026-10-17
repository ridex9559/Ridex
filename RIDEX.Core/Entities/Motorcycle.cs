namespace RIDEX.Core.Entities;

public class Motorcycle : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty;
    public double FuelTankCapacityLiters { get; set; }
    public double AverageMileageKmpl { get; set; }
    public double CurrentOdometerKm { get; set; }
    public DateTime? InsuranceExpiry { get; set; }
    public DateTime? PucExpiry { get; set; }
    public bool IsPrimary { get; set; } = false;
    public string? ImageUrl { get; set; }

    public ICollection<FuelLog> FuelLogs { get; set; } = new List<FuelLog>();
    public ICollection<ServiceRecord> ServiceRecords { get; set; } = new List<ServiceRecord>();
    public ICollection<ServiceReminder> ServiceReminders { get; set; } = new List<ServiceReminder>();
}
