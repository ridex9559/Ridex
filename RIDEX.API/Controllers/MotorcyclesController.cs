using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RIDEX.Core.Entities;
using RIDEX.Infrastructure.Data;
using RIDEX.Shared.DTOs;

namespace RIDEX.API.Controllers;

[Authorize]
public class MotorcyclesController : BaseApiController
{
    private readonly RideXDbContext _dbContext;
    private readonly ILogger<MotorcyclesController> _logger;

    public MotorcyclesController(RideXDbContext dbContext, ILogger<MotorcyclesController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<MotorcycleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserMotorcycles()
    {
        var bikes = await _dbContext.Motorcycles
            .AsNoTracking()
            .Where(m => m.UserId == CurrentUserId && !m.IsDeleted)
            .OrderByDescending(m => m.IsPrimary)
            .ThenByDescending(m => m.CreatedAt)
            .Select(m => MapToDto(m))
            .ToListAsync();

        return Ok(bikes);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(MotorcycleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var bike = await _dbContext.Motorcycles
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == id && m.UserId == CurrentUserId && !m.IsDeleted);

        if (bike == null)
            return NotFound(new { message = "Motorcycle not found." });

        return Ok(MapToDto(bike));
    }

    [HttpPost]
    [ProducesResponseType(typeof(MotorcycleDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateMotorcycleRequest request)
    {
        var hasBikes = await _dbContext.Motorcycles.AnyAsync(m => m.UserId == CurrentUserId && !m.IsDeleted);

        var bike = new Motorcycle
        {
            Id = Guid.NewGuid(),
            UserId = CurrentUserId,
            Brand = request.Brand.Trim(),
            Model = request.Model.Trim(),
            Year = request.Year,
            RegistrationNumber = request.RegistrationNumber.ToUpper().Trim(),
            FuelTankCapacityLiters = request.FuelTankCapacityLiters,
            AverageMileageKmpl = request.AverageMileageKmpl,
            CurrentOdometerKm = request.CurrentOdometerKm,
            InsuranceExpiry = request.InsuranceExpiry,
            PucExpiry = request.PucExpiry,
            IsPrimary = request.IsPrimary || !hasBikes,
            ImageUrl = request.ImageUrl,
            CreatedAt = DateTime.UtcNow
        };

        if (bike.IsPrimary)
        {
            var otherBikes = await _dbContext.Motorcycles.Where(m => m.UserId == CurrentUserId).ToListAsync();
            foreach (var b in otherBikes)
            {
                b.IsPrimary = false;
            }
        }

        _dbContext.Motorcycles.Add(bike);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = bike.Id }, MapToDto(bike));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(MotorcycleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMotorcycleRequest request)
    {
        var bike = await _dbContext.Motorcycles.FirstOrDefaultAsync(m => m.Id == id && m.UserId == CurrentUserId && !m.IsDeleted);
        if (bike == null)
            return NotFound(new { message = "Motorcycle not found." });

        bike.Brand = request.Brand.Trim();
        bike.Model = request.Model.Trim();
        bike.Year = request.Year;
        bike.RegistrationNumber = request.RegistrationNumber.ToUpper().Trim();
        bike.FuelTankCapacityLiters = request.FuelTankCapacityLiters;
        bike.AverageMileageKmpl = request.AverageMileageKmpl;
        bike.CurrentOdometerKm = request.CurrentOdometerKm;
        bike.InsuranceExpiry = request.InsuranceExpiry;
        bike.PucExpiry = request.PucExpiry;
        bike.ImageUrl = request.ImageUrl;
        bike.UpdatedAt = DateTime.UtcNow;

        if (request.IsPrimary && !bike.IsPrimary)
        {
            var otherBikes = await _dbContext.Motorcycles.Where(m => m.UserId == CurrentUserId && m.Id != id).ToListAsync();
            foreach (var b in otherBikes)
            {
                b.IsPrimary = false;
            }
            bike.IsPrimary = true;
        }

        await _dbContext.SaveChangesAsync();
        return Ok(MapToDto(bike));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var bike = await _dbContext.Motorcycles.FirstOrDefaultAsync(m => m.Id == id && m.UserId == CurrentUserId);
        if (bike == null)
            return NotFound(new { message = "Motorcycle not found." });

        bike.IsDeleted = true;
        bike.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{id:guid}/reminders")]
    [ProducesResponseType(typeof(List<ServiceReminderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReminders(Guid id)
    {
        var bike = await _dbContext.Motorcycles
            .Include(m => m.ServiceReminders)
            .FirstOrDefaultAsync(m => m.Id == id && m.UserId == CurrentUserId && !m.IsDeleted);

        if (bike == null)
            return NotFound(new { message = "Motorcycle not found." });

        var reminders = bike.ServiceReminders
            .Where(r => !r.IsDeleted && !r.IsDismissed)
            .Select(r =>
            {
                double? remainingKm = r.DueOdometerKm.HasValue ? r.DueOdometerKm.Value - bike.CurrentOdometerKm : null;
                int? remainingDays = r.DueDate.HasValue ? (int)(r.DueDate.Value.Date - DateTime.UtcNow.Date).TotalDays : null;
                bool isOverdue = (remainingKm.HasValue && remainingKm.Value <= 0) || (remainingDays.HasValue && remainingDays.Value <= 0);

                return new ServiceReminderDto
                {
                    Id = r.Id,
                    MotorcycleId = bike.Id,
                    MotorcycleName = $"{bike.Brand} {bike.Model}",
                    ServiceType = r.ServiceType,
                    Title = r.Title,
                    DueOdometerKm = r.DueOdometerKm,
                    RemainingKm = remainingKm,
                    DueDate = r.DueDate,
                    RemainingDays = remainingDays,
                    IsOverdue = isOverdue,
                    IsDismissed = r.IsDismissed
                };
            })
            .OrderBy(r => r.RemainingKm ?? 999999)
            .ToList();

        return Ok(reminders);
    }

    [HttpPost("{id:guid}/reminders")]
    [ProducesResponseType(typeof(ServiceReminderDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateReminder(Guid id, [FromBody] CreateServiceReminderRequest request)
    {
        var bike = await _dbContext.Motorcycles.FirstOrDefaultAsync(m => m.Id == id && m.UserId == CurrentUserId && !m.IsDeleted);
        if (bike == null)
            return NotFound(new { message = "Motorcycle not found." });

        var reminder = new ServiceReminder
        {
            Id = Guid.NewGuid(),
            MotorcycleId = id,
            ServiceType = request.ServiceType,
            Title = request.Title.Trim(),
            DueOdometerKm = request.DueOdometerKm,
            DueDate = request.DueDate,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.ServiceReminders.Add(reminder);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetReminders), new { id = bike.Id }, new ServiceReminderDto
        {
            Id = reminder.Id,
            MotorcycleId = bike.Id,
            MotorcycleName = $"{bike.Brand} {bike.Model}",
            ServiceType = reminder.ServiceType,
            Title = reminder.Title,
            DueOdometerKm = reminder.DueOdometerKm,
            RemainingKm = reminder.DueOdometerKm.HasValue ? reminder.DueOdometerKm.Value - bike.CurrentOdometerKm : null,
            DueDate = reminder.DueDate
        });
    }

    [HttpPost("{id:guid}/service-records")]
    [ProducesResponseType(typeof(ServiceRecordDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateServiceRecord(Guid id, [FromBody] CreateServiceRecordRequest request)
    {
        var bike = await _dbContext.Motorcycles.FirstOrDefaultAsync(m => m.Id == id && m.UserId == CurrentUserId && !m.IsDeleted);
        if (bike == null)
            return NotFound(new { message = "Motorcycle not found." });

        var record = new ServiceRecord
        {
            Id = Guid.NewGuid(),
            MotorcycleId = id,
            ServiceType = request.ServiceType,
            Title = request.Title.Trim(),
            Description = request.Description,
            OdometerKm = request.OdometerKm > 0 ? request.OdometerKm : bike.CurrentOdometerKm,
            Cost = request.Cost,
            WorkshopName = request.WorkshopName,
            ServiceDate = request.ServiceDate,
            CreatedAt = DateTime.UtcNow
        };

        // Update bike odometer if service odometer is higher
        if (record.OdometerKm > bike.CurrentOdometerKm)
        {
            bike.CurrentOdometerKm = record.OdometerKm;
        }

        _dbContext.ServiceRecords.Add(record);
        await _dbContext.SaveChangesAsync();

        return Ok(new ServiceRecordDto
        {
            Id = record.Id,
            MotorcycleId = record.MotorcycleId,
            ServiceType = record.ServiceType,
            Title = record.Title,
            Description = record.Description,
            OdometerKm = record.OdometerKm,
            Cost = record.Cost,
            WorkshopName = record.WorkshopName,
            ServiceDate = record.ServiceDate,
            CreatedAt = record.CreatedAt
        });
    }

    private static MotorcycleDto MapToDto(Motorcycle m)
    {
        return new MotorcycleDto
        {
            Id = m.Id,
            UserId = m.UserId,
            Brand = m.Brand,
            Model = m.Model,
            Year = m.Year,
            RegistrationNumber = m.RegistrationNumber,
            FuelTankCapacityLiters = m.FuelTankCapacityLiters,
            AverageMileageKmpl = m.AverageMileageKmpl,
            CurrentOdometerKm = m.CurrentOdometerKm,
            InsuranceExpiry = m.InsuranceExpiry,
            PucExpiry = m.PucExpiry,
            IsPrimary = m.IsPrimary,
            ImageUrl = m.ImageUrl,
            CreatedAt = m.CreatedAt
        };
    }
}
