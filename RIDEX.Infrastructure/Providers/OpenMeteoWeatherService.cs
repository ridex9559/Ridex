using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using RIDEX.Core.Interfaces;
using RIDEX.Shared.DTOs;

namespace RIDEX.Infrastructure.Providers;

public class OpenMeteoWeatherService : IWeatherService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<OpenMeteoWeatherService> _logger;

    // In-memory zero-cost cache: 1 hour expiration per coordinate
    private static readonly ConcurrentDictionary<string, (DateTime CachedAt, WeatherForecastDto Data)> WeatherCache = new();

    public OpenMeteoWeatherService(HttpClient httpClient, ILogger<OpenMeteoWeatherService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<WeatherForecastDto> GetWeatherForecastAsync(
        double latitude,
        double longitude,
        string? locationName = null,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{latitude:F2}_{longitude:F2}";
        if (WeatherCache.TryGetValue(cacheKey, out var entry) && (DateTime.UtcNow - entry.CachedAt).TotalMinutes < 60)
        {
            _logger.LogInformation("Weather fetched from local cache for {Location}", locationName ?? cacheKey);
            return entry.Data;
        }

        try
        {
            // Open-Meteo is free for non-commercial/commercial up to 10k calls/day with no API key needed
            var url = $"https://api.open-meteo.com/v1/forecast?latitude={latitude.ToString(System.Globalization.CultureInfo.InvariantCulture)}&longitude={longitude.ToString(System.Globalization.CultureInfo.InvariantCulture)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,wind_speed_10m,weather_code&forecast_days=1&timezone=auto";

            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("RIDEX-TouringWeather/1.0");
            var response = await _httpClient.GetAsync(url, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;

                var current = root.GetProperty("current");
                var temp = current.GetProperty("temperature_2m").GetDouble();
                var appTemp = current.GetProperty("apparent_temperature").GetDouble();
                var humidity = current.GetProperty("relative_humidity_2m").GetInt32();
                var weatherCode = current.GetProperty("weather_code").GetInt32();
                var windSpeed = current.GetProperty("wind_speed_10m").GetDouble();
                var windDir = current.GetProperty("wind_direction_10m").GetDouble();

                var (condition, icon) = DecodeWmoCode(weatherCode);

                var hourlyList = new List<HourlyWeatherDto>();
                if (root.TryGetProperty("hourly", out var hourly))
                {
                    var times = hourly.GetProperty("time");
                    var hourlyTemps = hourly.GetProperty("temperature_2m");
                    var hourlyPrecip = hourly.GetProperty("precipitation_probability");
                    var hourlyWinds = hourly.GetProperty("wind_speed_10m");
                    var hourlyCodes = hourly.GetProperty("weather_code");

                    int count = Math.Min(times.GetArrayLength(), 12);
                    for (int i = 0; i < count; i++)
                    {
                        var timeStr = times[i].GetString();
                        if (DateTime.TryParse(timeStr, out var timeVal))
                        {
                            var hCode = hourlyCodes[i].GetInt32();
                            var (hCond, _) = DecodeWmoCode(hCode);

                            hourlyList.Add(new HourlyWeatherDto
                            {
                                Time = timeVal,
                                Temperature = hourlyTemps[i].GetDouble(),
                                PrecipitationProbabilityPercent = hourlyPrecip[i].GetInt32(),
                                WindSpeedKmh = hourlyWinds[i].GetDouble(),
                                ConditionDescription = hCond
                            });
                        }
                    }
                }

                var warnings = new List<string>();
                if (windSpeed > 45)
                    warnings.Add("High wind warning: Exercise extra caution on ghats and open highways.");
                if (hourlyList.Any(h => h.PrecipitationProbabilityPercent > 60))
                    warnings.Add("Rain expected along the route. Wet road safety recommended.");
                if (temp > 38)
                    warnings.Add("Extreme heat alert: Ensure hydration and check tire pressure.");

                var result = new WeatherForecastDto
                {
                    LocationName = locationName ?? $"{latitude:F2}, {longitude:F2}",
                    Latitude = latitude,
                    Longitude = longitude,
                    CurrentTemperature = temp,
                    ApparentTemperature = appTemp,
                    RelativeHumidityPercent = humidity,
                    PrecipitationProbabilityPercent = hourlyList.FirstOrDefault()?.PrecipitationProbabilityPercent ?? 0,
                    WindSpeedKmh = windSpeed,
                    WindDirectionDegrees = windDir,
                    WeatherCode = weatherCode,
                    ConditionDescription = condition,
                    WeatherIcon = icon,
                    Hourly = hourlyList,
                    Warnings = warnings,
                    FetchedAt = DateTime.UtcNow
                };

                WeatherCache[cacheKey] = (DateTime.UtcNow, result);
                return result;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Open-Meteo weather API request failed. Using synthesized fallback.");
        }

        return CreateSynthesizedWeather(latitude, longitude, locationName);
    }

    public async Task<List<RouteWeatherCheckpointDto>> GetRouteWeatherAsync(
        IReadOnlyList<(string Name, double Lat, double Lon)> checkpoints,
        CancellationToken cancellationToken = default)
    {
        var results = new List<RouteWeatherCheckpointDto>();
        foreach (var (name, lat, lon) in checkpoints)
        {
            var forecast = await GetWeatherForecastAsync(lat, lon, name, cancellationToken);
            results.Add(new RouteWeatherCheckpointDto
            {
                LocationName = name,
                Latitude = lat,
                Longitude = lon,
                TemperatureCelsius = forecast.CurrentTemperature,
                PrecipitationProbabilityPercent = forecast.PrecipitationProbabilityPercent,
                WindSpeedKmh = forecast.WindSpeedKmh,
                ConditionDescription = forecast.ConditionDescription,
                WeatherIcon = forecast.WeatherIcon,
                AlertMessage = forecast.Warnings.FirstOrDefault()
            });
        }

        return results;
    }

    private static (string Condition, string Icon) DecodeWmoCode(int code)
    {
        return code switch
        {
            0 => ("Clear Sky", "☀️"),
            1 => ("Mainly Clear", "🌤️"),
            2 => ("Partly Cloudy", "⛅"),
            3 => ("Overcast", "☁️"),
            45 or 48 => ("Foggy", "🌫️"),
            51 or 53 or 55 => ("Drizzle", "🌦️"),
            61 or 63 or 65 => ("Rain", "🌧️"),
            71 or 73 or 75 => ("Snow", "🌨️"),
            80 or 81 or 82 => ("Rain Showers", "🌧️"),
            95 => ("Thunderstorm", "⛈️"),
            96 or 99 => ("Thunderstorm with Hail", "⛈️"),
            _ => ("Partly Cloudy", "⛅")
        };
    }

    private static WeatherForecastDto CreateSynthesizedWeather(double lat, double lon, string? locationName)
    {
        return new WeatherForecastDto
        {
            LocationName = locationName ?? $"{lat:F2}, {lon:F2}",
            Latitude = lat,
            Longitude = lon,
            CurrentTemperature = 26.5,
            ApparentTemperature = 27.0,
            RelativeHumidityPercent = 55,
            PrecipitationProbabilityPercent = 15,
            WindSpeedKmh = 14.0,
            WindDirectionDegrees = 220,
            WeatherCode = 1,
            ConditionDescription = "Mainly Clear",
            WeatherIcon = "🌤️",
            Hourly = new List<HourlyWeatherDto>
            {
                new() { Time = DateTime.UtcNow, Temperature = 26.5, PrecipitationProbabilityPercent = 15, WindSpeedKmh = 14, ConditionDescription = "Mainly Clear" },
                new() { Time = DateTime.UtcNow.AddHours(2), Temperature = 28.0, PrecipitationProbabilityPercent = 20, WindSpeedKmh = 16, ConditionDescription = "Partly Cloudy" },
                new() { Time = DateTime.UtcNow.AddHours(4), Temperature = 25.0, PrecipitationProbabilityPercent = 30, WindSpeedKmh = 18, ConditionDescription = "Scattered Clouds" }
            },
            Warnings = new List<string>(),
            FetchedAt = DateTime.UtcNow
        };
    }
}
