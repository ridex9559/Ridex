using RIDEX.Mobile.Models;
using RIDEX.Shared.Algorithms;
using RIDEX.Shared.DTOs;

namespace RIDEX.Mobile.Services;

public interface ILocationTrackingService
{
    bool IsTracking { get; }
    Guid? CurrentRideId { get; }
    Task StartTrackingAsync(Guid rideId);
    Task StopTrackingAsync();
    Task ProcessLocationUpdateAsync(double lat, double lon, double speedKmh, double heading, double? altitude = null, double accuracy = 5.0);
    event Action<LocationUpdateDto>? OnLocationProcessed;
}

public class LocationTrackingService : ILocationTrackingService
{
    private readonly ISignalRClientService _signalRClient;
    private readonly ILocalDatabaseService _localDb;
    private readonly IConnectivityService _connectivity;

    private Guid? _currentRideId;
    private bool _isTracking;
    private DateTime _lastUpdateSentAt = DateTime.MinValue;
    private (double Lat, double Lon) _lastCoordinates = (0, 0);

    public bool IsTracking => _isTracking;
    public Guid? CurrentRideId => _currentRideId;
    public event Action<LocationUpdateDto>? OnLocationProcessed;

    public LocationTrackingService(
        ISignalRClientService signalRClient,
        ILocalDatabaseService localDb,
        IConnectivityService connectivity)
    {
        _signalRClient = signalRClient;
        _localDb = localDb;
        _connectivity = connectivity;
    }

    public Task StartTrackingAsync(Guid rideId)
    {
        _currentRideId = rideId;
        _isTracking = true;
        _lastUpdateSentAt = DateTime.MinValue;
        return Task.CompletedTask;
    }

    public Task StopTrackingAsync()
    {
        _isTracking = false;
        _currentRideId = null;
        return Task.CompletedTask;
    }

    public async Task ProcessLocationUpdateAsync(double lat, double lon, double speedKmh, double heading, double? altitude = null, double accuracy = 5.0)
    {
        if (!_isTracking || !_currentRideId.HasValue)
            return;

        var now = DateTime.UtcNow;
        var elapsed = (now - _lastUpdateSentAt).TotalSeconds;

        // Adaptive Tracking Interval based on speed:
        // Stationary (<5 km/h) -> 30s
        // Low (<30 km/h) -> 10s
        // Normal (30..70 km/h) -> 5s
        // High (>70 km/h) -> 3s
        double requiredInterval = speedKmh switch
        {
            < 5.0 => 30.0,
            < 30.0 => 10.0,
            < 70.0 => 5.0,
            _ => 3.0
        };

        var distanceMovedMeters = (_lastCoordinates.Lat != 0)
            ? GeoMath.HaversineDistanceMeters(_lastCoordinates.Lat, _lastCoordinates.Lon, lat, lon)
            : 100.0;

        // Send if required interval elapsed or distance moved > 25 meters
        if (elapsed >= requiredInterval || distanceMovedMeters >= 25.0)
        {
            _lastUpdateSentAt = now;
            _lastCoordinates = (lat, lon);

            var locationUpdate = new LocationUpdateDto
            {
                RideId = _currentRideId.Value,
                Latitude = lat,
                Longitude = lon,
                Altitude = altitude,
                SpeedKmh = speedKmh,
                Heading = heading,
                AccuracyMeters = accuracy,
                BatteryLevelPercent = 85.0,
                Timestamp = now
            };

            OnLocationProcessed?.Invoke(locationUpdate);

            // Transmit via SignalR if connected
            if (_signalRClient.IsConnected && _connectivity.IsOnline)
            {
                await _signalRClient.SendLocationAsync(locationUpdate);
            }
            else
            {
                // Store in offline SQLite GPS queue
                await _localDb.QueueGpsPointAsync(new LocalGpsQueueItem
                {
                    RideId = _currentRideId.Value,
                    Latitude = lat,
                    Longitude = lon,
                    Altitude = altitude,
                    SpeedKmh = speedKmh,
                    Heading = heading,
                    AccuracyMeters = accuracy,
                    BatteryLevelPercent = 85.0,
                    Timestamp = now,
                    IsSynced = false
                });
            }
        }
    }
}
