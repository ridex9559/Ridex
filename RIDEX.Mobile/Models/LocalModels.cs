using SQLite;
using RIDEX.Shared.Enums;

namespace RIDEX.Mobile.Models;

[Table("LocalUsers")]
public class LocalUser
{
    [PrimaryKey]
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? City { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string? RidingExperience { get; set; }
    public string Role { get; set; } = "User";
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? TokenExpiresAt { get; set; }
}

[Table("LocalMotorcycles")]
public class LocalMotorcycle
{
    [PrimaryKey]
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
}

[Table("LocalRides")]
public class LocalRide
{
    [PrimaryKey]
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string JoinCode { get; set; } = string.Empty;
    public int Status { get; set; } // RideStatus enum
    public DateTime ScheduledStartTime { get; set; }
    public DateTime? ActualStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }
    public int MaxRiders { get; set; }
    public double SeparationThresholdKm { get; set; }
    public Guid OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string? RouteJson { get; set; }
    public string? MembersJson { get; set; }
    public bool IsDownloadedOffline { get; set; }
}

[Table("LocalGpsQueue")]
public class LocalGpsQueueItem
{
    [PrimaryKey, AutoIncrement]
    public int LocalId { get; set; }
    [Indexed]
    public Guid RideId { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double? Altitude { get; set; }
    public double SpeedKmh { get; set; }
    public double Heading { get; set; }
    public double AccuracyMeters { get; set; }
    public double? BatteryLevelPercent { get; set; }
    public DateTime Timestamp { get; set; }
    [Indexed]
    public bool IsSynced { get; set; }
}

[Table("SyncQueue")]
public class SyncQueueItem
{
    [PrimaryKey]
    public Guid OperationId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public int OperationType { get; set; } // SyncOperationType
    public string PayloadJson { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int RetryCount { get; set; } = 0;
    public int Status { get; set; } = 0; // 0=Pending, 1=Syncing, 2=Synced, 3=Failed
}

[Table("LocalFuelLogs")]
public class LocalFuelLog
{
    [PrimaryKey]
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? MotorcycleId { get; set; }
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
    public bool IsSynced { get; set; }
}

[Table("LocalExpenses")]
public class LocalExpense
{
    [PrimaryKey]
    public Guid Id { get; set; }
    public Guid RideId { get; set; }
    public Guid PaidByUserId { get; set; }
    public string PaidByUserName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int Category { get; set; } // ExpenseCategory
    public string Currency { get; set; } = "INR";
    public string? Notes { get; set; }
    public DateTime IncurredAt { get; set; }
    public string? ParticipantsJson { get; set; }
    public bool IsSynced { get; set; }
}

[Table("LocalServiceReminders")]
public class LocalServiceReminder
{
    [PrimaryKey]
    public Guid Id { get; set; }
    public Guid MotorcycleId { get; set; }
    public string MotorcycleName { get; set; } = string.Empty;
    public int ServiceType { get; set; }
    public string Title { get; set; } = string.Empty;
    public double? DueOdometerKm { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsDismissed { get; set; }
}

[Table("LocalEmergencyContacts")]
public class LocalEmergencyContact
{
    [PrimaryKey]
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
}
