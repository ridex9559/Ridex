using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RIDEX.Core.Interfaces;
using RIDEX.Shared.DTOs;

namespace RIDEX.API.Controllers;

[AllowAnonymous]
public class WeatherController : BaseApiController
{
    private readonly IWeatherService _weatherService;
    private readonly ILogger<WeatherController> _logger;

    public WeatherController(IWeatherService weatherService, ILogger<WeatherController> logger)
    {
        _weatherService = weatherService;
        _logger = logger;
    }

    [HttpGet("forecast")]
    [ProducesResponseType(typeof(WeatherForecastDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetForecast([FromQuery] double latitude, [FromQuery] double longitude, [FromQuery] string? name)
    {
        var forecast = await _weatherService.GetWeatherForecastAsync(latitude, longitude, name);
        return Ok(forecast);
    }

    [HttpPost("route-checkpoints")]
    [ProducesResponseType(typeof(List<RouteWeatherCheckpointDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRouteCheckpointsWeather([FromBody] List<WaypointDto> checkpoints)
    {
        var points = checkpoints.Select(c => (c.Name, c.Latitude, c.Longitude)).ToList();
        var weather = await _weatherService.GetRouteWeatherAsync(points);
        return Ok(weather);
    }
}
