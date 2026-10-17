using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RIDEX.Core.Entities;
using RIDEX.Core.Interfaces;
using RIDEX.Infrastructure.Data;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.Infrastructure.Services;

public class SyncEngine : ISyncEngine
{
    private readonly RideXDbContext _dbContext;
    private readonly ILogger<SyncEngine> _logger;

    public SyncEngine(RideXDbContext dbContext, ILogger<SyncEngine> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<SyncBatchResponse> ProcessSyncBatchAsync(
        Guid userId,
        SyncBatchRequest batch,
        CancellationToken cancellationToken = default)
    {
        var response = new SyncBatchResponse();

        // 1. Process Queued Offline GPS Points
        if (batch.QueuedGpsPoints.Count > 0)
        {
            var pointsToAdd = new List<HistoricalGpsPoint>();
            foreach (var p in batch.QueuedGpsPoints)
            {
                pointsToAdd.Add(new HistoricalGpsPoint
                {
                    Id = Guid.NewGuid(),
                    RideId = p.RideId,
                    UserId = userId,
                    Latitude = p.Latitude,
                    Longitude = p.Longitude,
                    Altitude = p.Altitude,
                    SpeedKmh = p.SpeedKmh,
                    Heading = p.Heading,
                    AccuracyMeters = p.AccuracyMeters,
                    Timestamp = p.Timestamp,
                    CreatedAt = DateTime.UtcNow
                });
            }

            try
            {
                await _dbContext.HistoricalGpsPoints.AddRangeAsync(pointsToAdd, cancellationToken);
                response.SyncedGpsPointsCount = pointsToAdd.Count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing offline GPS points for user {UserId}", userId);
            }
        }

        // 2. Process Sync Operations (FuelLogs, Expenses, Maintenance, etc.)
        foreach (var op in batch.Operations)
        {
            try
            {
                await ProcessSingleOperationAsync(userId, op, cancellationToken);
                response.SucceededOperationIds.Add(op.OperationId);
                response.SyncedOperationsCount++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to sync operation {OpId} of type {Type}", op.OperationId, op.EntityType);
                response.FailedOperations.Add(new SyncErrorDto
                {
                    OperationId = op.OperationId,
                    ErrorMessage = ex.Message,
                    IsFatal = false
                });
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        response.Success = response.FailedOperations.Count == 0;
        return response;
    }

    private async Task ProcessSingleOperationAsync(Guid userId, SyncOperationItemDto op, CancellationToken cancellationToken)
    {
        switch (op.EntityType.ToLowerInvariant())
        {
            case "fuellog":
                var fuelReq = JsonSerializer.Deserialize<CreateFuelLogRequest>(op.PayloadJson);
                if (fuelReq != null)
                {
                    // Check if already synced (idempotent)
                    var exists = await _dbContext.FuelLogs.AnyAsync(f => f.Id == op.EntityId, cancellationToken);
                    if (!exists)
                    {
                        var log = new FuelLog
                        {
                            Id = op.EntityId,
                            UserId = userId,
                            MotorcycleId = fuelReq.MotorcycleId,
                            RideId = fuelReq.RideId,
                            Liters = fuelReq.Liters,
                            PricePerLiter = fuelReq.PricePerLiter,
                            TotalCost = (decimal)fuelReq.Liters * fuelReq.PricePerLiter,
                            OdometerKm = fuelReq.OdometerKm,
                            FuelStationName = fuelReq.FuelStationName,
                            Latitude = fuelReq.Latitude,
                            Longitude = fuelReq.Longitude,
                            LoggedAt = fuelReq.LoggedAt
                        };
                        _dbContext.FuelLogs.Add(log);
                    }
                }
                break;

            case "expense":
                var expReq = JsonSerializer.Deserialize<CreateExpenseRequest>(op.PayloadJson);
                if (expReq != null)
                {
                    var exists = await _dbContext.Expenses.AnyAsync(e => e.Id == op.EntityId, cancellationToken);
                    if (!exists)
                    {
                        var expense = new Expense
                        {
                            Id = op.EntityId,
                            RideId = expReq.RideId,
                            PaidByUserId = userId,
                            Title = expReq.Title,
                            Amount = expReq.Amount,
                            Category = expReq.Category,
                            Currency = expReq.Currency,
                            Notes = expReq.Notes,
                            IncurredAt = expReq.IncurredAt
                        };

                        // Determine participants
                        var rideMembers = await _dbContext.RideMembers
                            .Where(m => m.RideId == expReq.RideId)
                            .Select(m => m.UserId)
                            .ToListAsync(cancellationToken);

                        var participants = (expReq.SplitAmongUserIds != null && expReq.SplitAmongUserIds.Count > 0)
                            ? expReq.SplitAmongUserIds
                            : rideMembers;

                        if (participants.Count > 0)
                        {
                            var share = expReq.Amount / participants.Count;
                            foreach (var pUserId in participants)
                            {
                                expense.Participants.Add(new ExpenseParticipant
                                {
                                    Id = Guid.NewGuid(),
                                    UserId = pUserId,
                                    ShareAmount = Math.Round(share, 2),
                                    HasSettled = pUserId == userId // Payer is already settled
                                });
                            }
                        }

                        _dbContext.Expenses.Add(expense);
                    }
                }
                break;

            case "servicerecord":
                var srvReq = JsonSerializer.Deserialize<CreateServiceRecordRequest>(op.PayloadJson);
                if (srvReq != null)
                {
                    var exists = await _dbContext.ServiceRecords.AnyAsync(s => s.Id == op.EntityId, cancellationToken);
                    if (!exists)
                    {
                        _dbContext.ServiceRecords.Add(new ServiceRecord
                        {
                            Id = op.EntityId,
                            MotorcycleId = srvReq.MotorcycleId,
                            ServiceType = srvReq.ServiceType,
                            Title = srvReq.Title,
                            Description = srvReq.Description,
                            OdometerKm = srvReq.OdometerKm,
                            Cost = srvReq.Cost,
                            WorkshopName = srvReq.WorkshopName,
                            ServiceDate = srvReq.ServiceDate
                        });
                    }
                }
                break;

            default:
                _logger.LogWarning("Unknown entity type for offline sync: {EntityType}", op.EntityType);
                break;
        }
    }
}
