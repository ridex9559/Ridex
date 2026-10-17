using RIDEX.Shared.Enums;

namespace RIDEX.Shared.DTOs;

public class SyncBatchRequest
{
    public Guid DeviceId { get; set; }
    public List<SyncOperationItemDto> Operations { get; set; } = new();
    public List<LocationUpdateDto> QueuedGpsPoints { get; set; } = new();
}

public class SyncOperationItemDto
{
    public Guid OperationId { get; set; }
    public string EntityType { get; set; } = string.Empty; // "Expense", "FuelLog", "ServiceRecord", etc.
    public Guid EntityId { get; set; }
    public SyncOperationType OperationType { get; set; }
    public string PayloadJson { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int RetryCount { get; set; }
}

public class SyncBatchResponse
{
    public bool Success { get; set; }
    public int SyncedOperationsCount { get; set; }
    public int SyncedGpsPointsCount { get; set; }
    public List<Guid> SucceededOperationIds { get; set; } = new();
    public List<SyncErrorDto> FailedOperations { get; set; } = new();
    public DateTime SyncedAt { get; set; } = DateTime.UtcNow;
}

public class SyncErrorDto
{
    public Guid OperationId { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
    public bool IsFatal { get; set; }
}
