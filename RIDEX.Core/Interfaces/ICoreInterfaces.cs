using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.Core.Interfaces;

public interface ILiveRideStateStore
{
    Task<LiveRideStateDto?> GetRideStateAsync(Guid rideId);
    Task<RiderLiveStateDto?> UpdateRiderLocationAsync(LocationUpdateDto update, double separationThresholdKm, Guid leaderId);
    Task<bool> SetRiderOnlineStatusAsync(Guid rideId, Guid userId, RiderOnlineStatus status);
    Task<bool> RemoveRideStateAsync(Guid rideId);
    Task<List<Guid>> GetActiveRideIdsAsync();
    Task<List<HistoricalGpsPointDto>> DrainPendingHistoricalPointsAsync(Guid rideId);
}

public interface ISyncEngine
{
    Task<SyncBatchResponse> ProcessSyncBatchAsync(Guid userId, SyncBatchRequest batch, CancellationToken cancellationToken = default);
}

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
}

public interface ITokenService
{
    string GenerateAccessToken(Entities.User user);
    string GenerateRefreshToken();
    System.Security.Claims.ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}
