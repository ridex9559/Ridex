using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RIDEX.API.Hubs;
using RIDEX.Core.Interfaces;
using RIDEX.Infrastructure.Services;
using RIDEX.Shared.DTOs;

namespace RIDEX.API.Controllers;

[AllowAnonymous]
public class SimulationController : BaseApiController
{
    private readonly DemoLocationProvider _demoProvider;
    private readonly IHubContext<RideHub, IRideHubClient> _hubContext;
    private readonly ILiveRideStateStore _liveStateStore;
    private readonly ILogger<SimulationController> _logger;

    public SimulationController(
        DemoLocationProvider demoProvider,
        IHubContext<RideHub, IRideHubClient> hubContext,
        ILiveRideStateStore liveStateStore,
        ILogger<SimulationController> logger)
    {
        _demoProvider = demoProvider;
        _hubContext = hubContext;
        _liveStateStore = liveStateStore;
        _logger = logger;
    }

    [HttpGet("riders")]
    [ProducesResponseType(typeof(IReadOnlyList<SimulatedRiderProfile>), StatusCodes.Status200OK)]
    public IActionResult GetSimulatedRiders()
    {
        return Ok(_demoProvider.GetSimulatedRiders());
    }

    [HttpPost("step/{rideId:guid}")]
    [ProducesResponseType(typeof(List<RiderLiveStateDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> StepSimulation(Guid rideId, [FromQuery] int step = 1)
    {
        var riders = _demoProvider.GetSimulatedRiders();
        var leader = riders[0];
        var results = new List<RiderLiveStateDto>();

        foreach (var rider in riders)
        {
            var update = _demoProvider.GetNextSimulatedPosition(rideId, rider.UserId, step);
            var state = await _liveStateStore.UpdateRiderLocationAsync(update, 2.5, leader.UserId);
            if (state != null)
            {
                state.UserName = rider.FullName;
                results.Add(state);

                // Broadcast over SignalR to active ride group
                var groupName = $"Ride_{rideId}";
                await _hubContext.Clients.Group(groupName).LocationUpdated(state);

                if (state.IsSeparated)
                {
                    var alert = $"⚠️ Separation Warning: {rider.FullName} is {state.DistanceFromLeaderKm:F1} km behind the group leader.";
                    await _hubContext.Clients.Group(groupName).SeparationAlert(alert, rider.UserId, state.DistanceFromLeaderKm);
                }
            }
        }

        return Ok(results);
    }
}
