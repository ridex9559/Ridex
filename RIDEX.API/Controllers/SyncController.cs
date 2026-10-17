using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RIDEX.Core.Interfaces;
using RIDEX.Shared.DTOs;

namespace RIDEX.API.Controllers;

[Authorize]
public class SyncController : BaseApiController
{
    private readonly ISyncEngine _syncEngine;
    private readonly ILogger<SyncController> _logger;

    public SyncController(ISyncEngine syncEngine, ILogger<SyncController> logger)
    {
        _syncEngine = syncEngine;
        _logger = logger;
    }

    [HttpPost("batch")]
    [ProducesResponseType(typeof(SyncBatchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ProcessBatch([FromBody] SyncBatchRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Invalid sync batch." });

        _logger.LogInformation("Processing offline sync batch for user {UserId} with {OpCount} operations and {GpsCount} GPS points",
            CurrentUserId, request.Operations.Count, request.QueuedGpsPoints.Count);

        var result = await _syncEngine.ProcessSyncBatchAsync(CurrentUserId, request);
        return Ok(result);
    }
}
