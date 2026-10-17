using System.ComponentModel.DataAnnotations;
using RIDEX.Shared.Enums;

namespace RIDEX.Shared.DTOs;

public class WaypointDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int Order { get; set; }
    public string? Address { get; set; }
    public bool IsFuelStop { get; set; }
}

public class RouteDto
{
    public Guid Id { get; set; }
    public string OriginName { get; set; } = string.Empty;
    public double OriginLatitude { get; set; }
    public double OriginLongitude { get; set; }

    public string DestinationName { get; set; } = string.Empty;
    public double DestinationLatitude { get; set; }
    public double DestinationLongitude { get; set; }

    public double TotalDistanceKm { get; set; }
    public double EstimatedDurationMinutes { get; set; }
    public string PolylineGeometry { get; set; } = string.Empty; // Encoded or GeoJSON coordinates string
    public RoutePreference Preference { get; set; }

    public List<WaypointDto> Waypoints { get; set; } = new();
    public List<RouteInstructionDto> Instructions { get; set; } = new();
    public List<RouteWeatherCheckpointDto> WeatherCheckpoints { get; set; } = new();
    public FuelEstimateDto? FuelEstimate { get; set; }
}

public class RoutePlanRequest
{
    [Required]
    public string OriginName { get; set; } = string.Empty;
    public double OriginLatitude { get; set; }
    public double OriginLongitude { get; set; }

    [Required]
    public string DestinationName { get; set; } = string.Empty;
    public double DestinationLatitude { get; set; }
    public double DestinationLongitude { get; set; }

    public RoutePreference Preference { get; set; } = RoutePreference.Fastest;

    public List<WaypointDto> Waypoints { get; set; } = new();

    public double? MotorcycleMileageKmpl { get; set; }
    public double? FuelTankCapacityLiters { get; set; }
    public decimal? FuelPricePerLiter { get; set; }
}

public class RouteInstructionDto
{
    public string Text { get; set; } = string.Empty;
    public double DistanceMeters { get; set; }
    public double DurationSeconds { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class RouteWeatherCheckpointDto
{
    public string LocationName { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double TemperatureCelsius { get; set; }
    public int PrecipitationProbabilityPercent { get; set; }
    public double WindSpeedKmh { get; set; }
    public string ConditionDescription { get; set; } = string.Empty;
    public string WeatherIcon { get; set; } = string.Empty;
    public string? AlertMessage { get; set; }
}
