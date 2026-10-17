using RIDEX.Mobile.Models;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.Mobile.Services;

public interface IMobileSyncService
{
    bool IsSyncing { get; }
    Task<int> SyncPendingDataAsync();
    event Action<int, int>? OnSyncProgress;
}

public class MobileSyncService : IMobileSyncService
{
    private readonly ILocalDatabaseService _localDb;
    private readonly IApiClient _apiClient;
    private readonly IConnectivityService _connectivity;
    private bool _isSyncing;

    public bool IsSyncing => _isSyncing;
    public event Action<int, int>? OnSyncProgress;

    public MobileSyncService(
        ILocalDatabaseService localDb,
        IApiClient apiClient,
        IConnectivityService connectivity)
    {
        _localDb = localDb;
        _apiClient = apiClient;
        _connectivity = connectivity;
    }

    public async Task<int> SyncPendingDataAsync()
    {
        if (_isSyncing || !_connectivity.IsOnline)
            return 0;

        _isSyncing = true;
        _connectivity.SetState(NetworkState.Syncing);
        int totalSynced = 0;

        try
        {
            var pendingOps = await _localDb.GetPendingSyncOperationsAsync();
            var pendingGps = await _localDb.GetUnsyncedGpsPointsAsync(200);

            if (pendingOps.Count == 0 && pendingGps.Count == 0)
            {
                _isSyncing = false;
                _connectivity.SetState(NetworkState.Online);
                return 0;
            }

            var batchRequest = new SyncBatchRequest
            {
                DeviceId = Guid.NewGuid(),
                Operations = pendingOps.Select(o => new SyncOperationItemDto
                {
                    OperationId = o.OperationId,
                    EntityType = o.EntityType,
                    EntityId = o.EntityId,
                    OperationType = (SyncOperationType)o.OperationType,
                    PayloadJson = o.PayloadJson,
                    CreatedAt = o.CreatedAt,
                    RetryCount = o.RetryCount
                }).ToList(),
                QueuedGpsPoints = pendingGps.Select(g => new LocationUpdateDto
                {
                    RideId = g.RideId,
                    Latitude = g.Latitude,
                    Longitude = g.Longitude,
                    Altitude = g.Altitude,
                    SpeedKmh = g.SpeedKmh,
                    Heading = g.Heading,
                    AccuracyMeters = g.AccuracyMeters,
                    BatteryLevelPercent = g.BatteryLevelPercent,
                    Timestamp = g.Timestamp
                }).ToList()
            };

            var response = await _apiClient.ProcessSyncBatchAsync(batchRequest);
            if (response != null)
            {
                // Mark succeeded operations
                foreach (var opId in response.SucceededOperationIds)
                {
                    await _localDb.MarkSyncOperationCompletedAsync(opId);
                }

                // Handle retries on failures
                foreach (var failed in response.FailedOperations)
                {
                    await _localDb.IncrementSyncOperationRetryAsync(failed.OperationId);
                }

                // Mark GPS points as synced
                await _localDb.MarkGpsPointsSyncedAsync(pendingGps.Select(g => g.LocalId));

                totalSynced = response.SyncedOperationsCount + response.SyncedGpsPointsCount;
                OnSyncProgress?.Invoke(totalSynced, pendingOps.Count + pendingGps.Count);
            }
        }
        catch
        {
            _connectivity.SetState(NetworkState.Offline);
        }
        finally
        {
            _isSyncing = false;
            _connectivity.SetState(_connectivity.IsOnline ? NetworkState.Online : NetworkState.Offline);
        }

        return totalSynced;
    }
}
