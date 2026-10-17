using RIDEX.Shared.Enums;

namespace RIDEX.Core.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? City { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string? RidingExperience { get; set; }
    public UserRole Role { get; set; } = UserRole.User;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    public ICollection<Motorcycle> Motorcycles { get; set; } = new List<Motorcycle>();
    public ICollection<RideMember> RideMemberships { get; set; } = new List<RideMember>();
    public ICollection<Ride> OwnedRides { get; set; } = new List<Ride>();
    public ICollection<EmergencyContact> EmergencyContacts { get; set; } = new List<EmergencyContact>();
    public ICollection<FuelLog> FuelLogs { get; set; } = new List<FuelLog>();
}
