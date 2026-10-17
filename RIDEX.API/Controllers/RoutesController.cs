using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RIDEX.Core.Interfaces;
using RIDEX.Shared.DTOs;

namespace RIDEX.API.Controllers;

[Authorize]
public class RoutesController : BaseApiController
{
    private readonly IRoutingService _routingService;
    private readonly IGeocodingService _geocodingService;
    private readonly ILogger<RoutesController> _logger;

    public RoutesController(
        IRoutingService routingService,
        IGeocodingService geocodingService,
        ILogger<RoutesController> logger)
    {
        _routingService = routingService;
        _geocodingService = geocodingService;
        _logger = logger;
    }

    [AllowAnonymous]
    [HttpPost("plan")]
    [ProducesResponseType(typeof(RouteDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> PlanRoute([FromBody] RoutePlanRequest request)
    {
        var route = await _routingService.CalculateRouteAsync(request);
        return Ok(route);
    }

    [AllowAnonymous]
    [HttpGet("search")]
    [ProducesResponseType(typeof(List<WaypointDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchPlaces([FromQuery] string query)
    {
        var results = await _geocodingService.SearchLocationsAsync(query);
        return Ok(results);
    }

    [AllowAnonymous]
    [HttpGet("reverse-geocode")]
    [ProducesResponseType(typeof(WaypointDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ReverseGeocode([FromQuery] double latitude, [FromQuery] double longitude)
    {
        var result = await _geocodingService.ReverseGeocodeAsync(latitude, longitude);
        return Ok(result);
    }
}
