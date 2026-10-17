using RIDEX.Shared.Enums;

namespace RIDEX.Shared.DTOs;

public class AdminDashboardStatsDto
{
    public int TotalUsers { get; set; }
    public int TotalRides { get; set; }
    public int ActiveRides { get; set; }
    public int OnlineRiders { get; set; }
    public int RidesToday { get; set; }
    public double TotalDistanceCoveredKm { get; set; }
    public int TotalEmergencyAlerts { get; set; }
    public SystemHealthDto SystemHealth { get; set; } = new();
}

public class SystemHealthDto
{
    public string Status { get; set; } = "Healthy";
    public string DatabaseProvider { get; set; } = "PostgreSQL";
    public bool DatabaseConnected { get; set; } = true;
    public string RealtimeEngine { get; set; } = "SignalR (In-Memory Live Store)";
    public int ActiveSignalRConnections { get; set; }
    public TimeSpan Uptime { get; set; }
    public DateTime ServerTimeUtc { get; set; } = DateTime.UtcNow;
    public string Environment { get; set; } = "Development";
}

public class AdminUserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? City { get; set; }
    public UserRole Role { get; set; }
    public int RidesCount { get; set; }
    public int MotorcyclesCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminRideOverviewDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string JoinCode { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public RideStatus Status { get; set; }
    public int MemberCount { get; set; }
    public double DistanceKm { get; set; }
    public DateTime ScheduledStartTime { get; set; }
    public DateTime CreatedAt { get; set; }
}
