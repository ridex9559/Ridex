using System.ComponentModel.DataAnnotations;
using RIDEX.Shared.Enums;

namespace RIDEX.Shared.DTOs;

public class RideDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string JoinCode { get; set; } = string.Empty;
    public RideStatus Status { get; set; }
    public DateTime ScheduledStartTime { get; set; }
    public DateTime? ActualStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }
    public int MaxRiders { get; set; }
    public double SeparationThresholdKm { get; set; }
    public Guid OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public Guid? ActiveMotorcycleId { get; set; }
    public RouteDto? Route { get; set; }
    public List<RideMemberDto> Members { get; set; } = new();
    public RideSummaryDto? Summary { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RideMemberDto
{
    public Guid Id { get; set; }
    public Guid RideId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public RideRole Role { get; set; }
    public RiderOnlineStatus OnlineStatus { get; set; }
    public DateTime JoinedAt { get; set; }
    public DateTime? LastLocationUpdate { get; set; }
    public double? CurrentLatitude { get; set; }
    public double? CurrentLongitude { get; set; }
    public double? CurrentSpeedKmh { get; set; }
    public double? DistanceFromLeaderKm { get; set; }
    public double? BatteryLevelPercent { get; set; }
}

public class CreateRideRequest
{
    [Required, MinLength(3), MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTime ScheduledStartTime { get; set; } = DateTime.UtcNow.AddHours(1);

    [Range(1, 100)]
    public int MaxRiders { get; set; } = 20;

    [Range(0.5, 50.0)]
    public double SeparationThresholdKm { get; set; } = 2.0;

    public Guid? MotorcycleId { get; set; }

    public RoutePlanRequest? RoutePlan { get; set; }
}

public class UpdateRideRequest
{
    [Required, MinLength(3), MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }
    public DateTime ScheduledStartTime { get; set; }

    [Range(1, 100)]
    public int MaxRiders { get; set; }

    [Range(0.5, 50.0)]
    public double SeparationThresholdKm { get; set; }
}

public class JoinRideRequest
{
    [Required]
    public string JoinCode { get; set; } = string.Empty;

    public Guid? MotorcycleId { get; set; }
}

public class RideSummaryDto
{
    public Guid Id { get; set; }
    public Guid RideId { get; set; }
    public double TotalDistanceKm { get; set; }
    public TimeSpan TotalDuration { get; set; }
    public TimeSpan MovingTime { get; set; }
    public TimeSpan StoppedTime { get; set; }
    public double AverageSpeedKmh { get; set; }
    public double MaxSpeedKmh { get; set; }
    public double EstimatedFuelLiters { get; set; }
    public decimal EstimatedFuelCost { get; set; }
    public int TotalRidersCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
