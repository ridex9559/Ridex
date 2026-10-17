using RIDEX.Infrastructure.Services;
using RIDEX.Shared.DTOs;

namespace RIDEX.Mobile.Services;

public interface IDemoSimulationService
{
    bool IsSimulating { get; }
    void StartSimulation(Guid rideId);
    void StopSimulation();
    event Action<LocationUpdateDto>? OnSimulatedPositionGenerated;
}

public class DemoSimulationService : IDemoSimulationService
{
    private readonly DemoLocationProvider _demoProvider;
    private readonly ILocationTrackingService _trackingService;
    private System.Timers.Timer? _timer;
    private int _currentTick = 0;
    private Guid _rideId;

    public bool IsSimulating => _timer?.Enabled ?? false;
    public event Action<LocationUpdateDto>? OnSimulatedPositionGenerated;

    public DemoSimulationService(DemoLocationProvider demoProvider, ILocationTrackingService trackingService)
    {
        _demoProvider = demoProvider;
        _trackingService = trackingService;
    }

    public void StartSimulation(Guid rideId)
    {
        _rideId = rideId;
        _currentTick = 0;
        _timer?.Dispose();

        _timer = new System.Timers.Timer(2000); // Emits every 2 seconds
        _timer.Elapsed += async (s, e) =>
        {
            _currentTick++;
            var leader = _demoProvider.GetSimulatedRiders()[0];
            var pos = _demoProvider.GetNextSimulatedPosition(_rideId, leader.UserId, _currentTick);

            OnSimulatedPositionGenerated?.Invoke(pos);
            await _trackingService.ProcessLocationUpdateAsync(pos.Latitude, pos.Longitude, pos.SpeedKmh, pos.Heading, pos.Altitude);
        };
        _timer.Start();
    }

    public void StopSimulation()
    {
        _timer?.Stop();
        _timer?.Dispose();
        _timer = null;
    }
}
