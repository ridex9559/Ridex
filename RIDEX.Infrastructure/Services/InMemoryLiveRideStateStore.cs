using System.Collections.Concurrent;
using RIDEX.Core.Interfaces;
using RIDEX.Shared.Algorithms;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.Infrastructure.Services;

public class InMemoryLiveRideStateStore : ILiveRideStateStore
{
    private class ActiveRideContainer
    {
        public Guid RideId { get; set; }
        public Guid LeaderId { get; set; }
        public RideStatus Status { get; set; } = RideStatus.InProgress;
        public double SeparationThresholdKm { get; set; } = 2.0;
        public ConcurrentDictionary<Guid, RiderLiveStateDto> Riders { get; } = new();
        public ConcurrentQueue<HistoricalGpsPointDto> HistoricalPointBuffer { get; } = new();
        public ConcurrentDictionary<Guid, DateTime> LastSeparationAlertSentAt { get; } = new();
        public List<string> ActiveAlerts { get; set; } = new();
    }

    private readonly ConcurrentDictionary<Guid, ActiveRideContainer> _rides = new();

    public Task<LiveRideStateDto?> GetRideStateAsync(Guid rideId)
    {
        if (!_rides.TryGetValue(rideId, out var container))
            return Task.FromResult<LiveRideStateDto?>(null);

        var state = new LiveRideStateDto
        {
            RideId = container.RideId,
            LeaderId = container.LeaderId,
            Status = container.Status,
            SeparationThresholdKm = container.SeparationThresholdKm,
            Riders = container.Riders.Values.ToList(),
            ActiveAlerts = container.ActiveAlerts.ToList(),
            LastUpdatedAt = DateTime.UtcNow
        };

        return Task.FromResult<LiveRideStateDto?>(state);
    }

    public Task<RiderLiveStateDto?> UpdateRiderLocationAsync(LocationUpdateDto update, double separationThresholdKm, Guid leaderId)
    {
        var container = _rides.GetOrAdd(update.RideId, id => new ActiveRideContainer
        {
            RideId = id,
            LeaderId = leaderId,
            SeparationThresholdKm = separationThresholdKm
        });

        // Add to historical point buffer for periodic batch persistence
        container.HistoricalPointBuffer.Enqueue(new HistoricalGpsPointDto
        {
            Latitude = update.Latitude,
            Longitude = update.Longitude,
            Altitude = update.Altitude,
            SpeedKmh = update.SpeedKmh,
            Heading = update.Heading,
            Timestamp = update.Timestamp
        });

        // Compute distance from leader
        double distanceFromLeader = 0.0;
        if (container.Riders.TryGetValue(container.LeaderId, out var leaderState) && update.UserId != container.LeaderId)
        {
            distanceFromLeader = GeoMath.HaversineDistanceKm(
                update.Latitude, update.Longitude,
                leaderState.Latitude, leaderState.Longitude);
        }

        var isSeparated = distanceFromLeader > container.SeparationThresholdKm;

        // Manage cooldown separation alerts
        if (isSeparated)
        {
            var now = DateTime.UtcNow;
            if (!container.LastSeparationAlertSentAt.TryGetValue(update.UserId, out var lastSent) || (now - lastSent).TotalMinutes >= 5)
            {
                container.LastSeparationAlertSentAt[update.UserId] = now;
                var alertMsg = $"⚠️ Separation Alert: Rider is {distanceFromLeader:F1} km away from group (threshold: {container.SeparationThresholdKm} km).";
                container.ActiveAlerts.Add(alertMsg);
                if (container.ActiveAlerts.Count > 10)
                    container.ActiveAlerts.RemoveAt(0);
            }
        }

        var riderState = container.Riders.AddOrUpdate(
            update.UserId,
            id => new RiderLiveStateDto
            {
                UserId = id,
                Role = (id == container.LeaderId) ? RideRole.Owner : RideRole.Member,
                OnlineStatus = RiderOnlineStatus.Online,
                Latitude = update.Latitude,
                Longitude = update.Longitude,
                Altitude = update.Altitude,
                SpeedKmh = update.SpeedKmh,
                Heading = update.Heading,
                BatteryLevelPercent = update.BatteryLevelPercent,
                DistanceFromLeaderKm = Math.Round(distanceFromLeader, 2),
                LastUpdatedAt = DateTime.UtcNow,
                IsSeparated = isSeparated
            },
            (id, existing) =>
            {
                existing.Latitude = update.Latitude;
                existing.Longitude = update.Longitude;
                existing.Altitude = update.Altitude;
                existing.SpeedKmh = update.SpeedKmh;
                existing.Heading = update.Heading;
                existing.BatteryLevelPercent = update.BatteryLevelPercent;
                existing.DistanceFromLeaderKm = Math.Round(distanceFromLeader, 2);
                existing.LastUpdatedAt = DateTime.UtcNow;
                existing.OnlineStatus = RiderOnlineStatus.Online;
                existing.IsSeparated = isSeparated;
                return existing;
            });

        return Task.FromResult<RiderLiveStateDto?>(riderState);
    }

    public Task<bool> SetRiderOnlineStatusAsync(Guid rideId, Guid userId, RiderOnlineStatus status)
    {
        if (_rides.TryGetValue(rideId, out var container) && container.Riders.TryGetValue(userId, out var rider))
        {
            rider.OnlineStatus = status;
            rider.LastUpdatedAt = DateTime.UtcNow;
            return Task.FromResult(true);
        }

        return Task.FromResult(false);
    }

    public Task<bool> RemoveRideStateAsync(Guid rideId)
    {
        var removed = _rides.TryRemove(rideId, out _);
        return Task.FromResult(removed);
    }

    public Task<List<Guid>> GetActiveRideIdsAsync()
    {
        return Task.FromResult(_rides.Keys.ToList());
    }

    public Task<List<HistoricalGpsPointDto>> DrainPendingHistoricalPointsAsync(Guid rideId)
    {
        var result = new List<HistoricalGpsPointDto>();
        if (_rides.TryGetValue(rideId, out var container))
        {
            while (container.HistoricalPointBuffer.TryDequeue(out var point))
            {
                result.Add(point);
            }
        }

        return Task.FromResult(result);
    }
}
