using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RIDEX.Core.Entities;
using RIDEX.Infrastructure.Data;
using RIDEX.Shared.DTOs;

namespace RIDEX.API.Controllers;

[AllowAnonymous]
public class FuelLogsController : BaseApiController
{
    private readonly RideXDbContext _dbContext;
    private readonly ILogger<FuelLogsController> _logger;

    public FuelLogsController(RideXDbContext dbContext, ILogger<FuelLogsController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<FuelLogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserFuelLogs([FromQuery] Guid? motorcycleId)
    {
        var query = _dbContext.FuelLogs
            .AsNoTracking()
            .Include(f => f.Motorcycle)
            .Where(f => f.UserId == CurrentUserId && !f.IsDeleted);

        if (motorcycleId.HasValue)
        {
            query = query.Where(f => f.MotorcycleId == motorcycleId.Value);
        }

        var logs = await query
            .OrderByDescending(f => f.LoggedAt)
            .Select(f => MapToDto(f))
            .ToListAsync();

        return Ok(logs);
    }

    [HttpGet("ride/{rideId:guid}")]
    [ProducesResponseType(typeof(List<FuelLogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRideFuelLogs(Guid rideId)
    {
        var logs = await _dbContext.FuelLogs
            .AsNoTracking()
            .Include(f => f.Motorcycle)
            .Where(f => f.RideId == rideId && !f.IsDeleted)
            .OrderByDescending(f => f.LoggedAt)
            .Select(f => MapToDto(f))
            .ToListAsync();

        return Ok(logs);
    }

    [HttpPost]
    [ProducesResponseType(typeof(FuelLogDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateFuelLogRequest request)
    {
        // 1. Calculate mileage against previous log if odometer increases
        double? calculatedMileage = null;
        if (request.MotorcycleId.HasValue && request.OdometerKm > 0)
        {
            var previousLog = await _dbContext.FuelLogs
                .Where(f => f.MotorcycleId == request.MotorcycleId.Value && f.OdometerKm < request.OdometerKm && !f.IsDeleted)
                .OrderByDescending(f => f.OdometerKm)
                .FirstOrDefaultAsync();

            if (previousLog != null && request.Liters > 0)
            {
                var distanceDelta = request.OdometerKm - previousLog.OdometerKm;
                calculatedMileage = Math.Round(distanceDelta / request.Liters, 1);
            }

            // Update bike's current odometer
            var bike = await _dbContext.Motorcycles.FindAsync(request.MotorcycleId.Value);
            if (bike != null && request.OdometerKm > bike.CurrentOdometerKm)
            {
                bike.CurrentOdometerKm = request.OdometerKm;
                if (calculatedMileage.HasValue && calculatedMileage.Value > 5 && calculatedMileage.Value < 80)
                {
                    // Smooth running average mileage
                    bike.AverageMileageKmpl = Math.Round((bike.AverageMileageKmpl * 0.7) + (calculatedMileage.Value * 0.3), 1);
                }
            }
        }

        var fuelLog = new FuelLog
        {
            Id = Guid.NewGuid(),
            UserId = CurrentUserId,
            MotorcycleId = request.MotorcycleId,
            RideId = request.RideId,
            Liters = request.Liters,
            PricePerLiter = request.PricePerLiter,
            TotalCost = Math.Round((decimal)request.Liters * request.PricePerLiter, 2),
            OdometerKm = request.OdometerKm,
            FuelStationName = request.FuelStationName,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            CalculatedMileageKmpl = calculatedMileage,
            LoggedAt = request.LoggedAt,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.FuelLogs.Add(fuelLog);
        await _dbContext.SaveChangesAsync();

        var created = await _dbContext.FuelLogs
            .Include(f => f.Motorcycle)
            .FirstAsync(f => f.Id == fuelLog.Id);

        return CreatedAtAction(nameof(GetUserFuelLogs), new { id = fuelLog.Id }, MapToDto(created));
    }

    private static FuelLogDto MapToDto(FuelLog f)
    {
        return new FuelLogDto
        {
            Id = f.Id,
            UserId = f.UserId,
            MotorcycleId = f.MotorcycleId,
            MotorcycleName = f.Motorcycle != null ? $"{f.Motorcycle.Brand} {f.Motorcycle.Model}" : null,
            RideId = f.RideId,
            Liters = f.Liters,
            PricePerLiter = f.PricePerLiter,
            TotalCost = f.TotalCost,
            OdometerKm = f.OdometerKm,
            FuelStationName = f.FuelStationName,
            Latitude = f.Latitude,
            Longitude = f.Longitude,
            CalculatedMileageKmpl = f.CalculatedMileageKmpl,
            LoggedAt = f.LoggedAt
        };
    }
}
