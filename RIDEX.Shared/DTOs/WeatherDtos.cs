namespace RIDEX.Shared.DTOs;

public class WeatherForecastDto
{
    public string LocationName { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double CurrentTemperature { get; set; }
    public double ApparentTemperature { get; set; }
    public int RelativeHumidityPercent { get; set; }
    public int PrecipitationProbabilityPercent { get; set; }
    public double WindSpeedKmh { get; set; }
    public double WindDirectionDegrees { get; set; }
    public int WeatherCode { get; set; }
    public string ConditionDescription { get; set; } = string.Empty;
    public string WeatherIcon { get; set; } = string.Empty;
    public List<HourlyWeatherDto> Hourly { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public DateTime FetchedAt { get; set; }
}

public class HourlyWeatherDto
{
    public DateTime Time { get; set; }
    public double Temperature { get; set; }
    public int PrecipitationProbabilityPercent { get; set; }
    public double WindSpeedKmh { get; set; }
    public string ConditionDescription { get; set; } = string.Empty;
}
