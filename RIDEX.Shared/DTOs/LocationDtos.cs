using System.ComponentModel.DataAnnotations;
using RIDEX.Shared.Enums;

namespace RIDEX.Shared.DTOs;

public class LocationUpdateDto
{
    [Required]
    public Guid RideId { get; set; }

    public Guid UserId { get; set; }

    [Range(-90.0, 90.0)]
    public double Latitude { get; set; }

    [Range(-180.0, 180.0)]
    public double Longitude { get; set; }

    public double? Altitude { get; set; }

    [Range(0.0, 400.0)]
    public double SpeedKmh { get; set; }

    [Range(0.0, 360.0)]
    public double Heading { get; set; }

    public double AccuracyMeters { get; set; }

    [Range(0.0, 100.0)]
    public double? BatteryLevelPercent { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class RiderLiveStateDto
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public RideRole Role { get; set; }
    public RiderOnlineStatus OnlineStatus { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double? Altitude { get; set; }
    public double SpeedKmh { get; set; }
    public double Heading { get; set; }
    public double? BatteryLevelPercent { get; set; }
    public double DistanceFromLeaderKm { get; set; }
    public DateTime LastUpdatedAt { get; set; }
    public bool IsSeparated { get; set; }
}

public class LiveRideStateDto
{
    public Guid RideId { get; set; }
    public RideStatus Status { get; set; }
    public Guid LeaderId { get; set; }
    public double SeparationThresholdKm { get; set; }
    public List<RiderLiveStateDto> Riders { get; set; } = new();
    public List<string> ActiveAlerts { get; set; } = new();
    public DateTime LastUpdatedAt { get; set; }
}

public class HistoricalGpsPointDto
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double? Altitude { get; set; }
    public double SpeedKmh { get; set; }
    public double Heading { get; set; }
    public DateTime Timestamp { get; set; }
}
