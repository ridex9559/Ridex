using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RIDEX.Core.Entities;
using RIDEX.Infrastructure.Data;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.API.Controllers;

[Authorize]
public class EmergencyController : BaseApiController
{
    private readonly RideXDbContext _dbContext;
    private readonly ILogger<EmergencyController> _logger;

    public EmergencyController(RideXDbContext dbContext, ILogger<EmergencyController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    [HttpGet("contacts")]
    [ProducesResponseType(typeof(List<EmergencyContactDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetContacts()
    {
        var contacts = await _dbContext.EmergencyContacts
            .AsNoTracking()
            .Where(c => c.UserId == CurrentUserId && !c.IsDeleted)
            .OrderByDescending(c => c.IsPrimary)
            .Select(c => new EmergencyContactDto
            {
                Id = c.Id,
                UserId = c.UserId,
                Name = c.Name,
                PhoneNumber = c.PhoneNumber,
                Relationship = c.Relationship,
                IsPrimary = c.IsPrimary
            })
            .ToListAsync();

        return Ok(contacts);
    }

    [HttpPost("contacts")]
    [ProducesResponseType(typeof(EmergencyContactDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateContact([FromBody] CreateEmergencyContactRequest request)
    {
        var count = await _dbContext.EmergencyContacts.CountAsync(c => c.UserId == CurrentUserId && !c.IsDeleted);

        var contact = new EmergencyContact
        {
            Id = Guid.NewGuid(),
            UserId = CurrentUserId,
            Name = request.Name.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            Relationship = request.Relationship.Trim(),
            IsPrimary = request.IsPrimary || count == 0,
            CreatedAt = DateTime.UtcNow
        };

        if (contact.IsPrimary)
        {
            var others = await _dbContext.EmergencyContacts.Where(c => c.UserId == CurrentUserId).ToListAsync();
            foreach (var o in others)
                o.IsPrimary = false;
        }

        _dbContext.EmergencyContacts.Add(contact);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetContacts), new { id = contact.Id }, new EmergencyContactDto
        {
            Id = contact.Id,
            UserId = contact.UserId,
            Name = contact.Name,
            PhoneNumber = contact.PhoneNumber,
            Relationship = contact.Relationship,
            IsPrimary = contact.IsPrimary
        });
    }

    [HttpDelete("contacts/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteContact(Guid id)
    {
        var contact = await _dbContext.EmergencyContacts.FirstOrDefaultAsync(c => c.Id == id && c.UserId == CurrentUserId);
        if (contact == null)
            return NotFound(new { message = "Contact not found." });

        contact.IsDeleted = true;
        contact.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("sos")]
    [ProducesResponseType(typeof(EmergencyAlertDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> TriggerSos([FromBody] SosTriggerRequest request)
    {
        var user = await _dbContext.Users
            .Include(u => u.EmergencyContacts)
            .FirstOrDefaultAsync(u => u.Id == CurrentUserId);

        if (user == null)
            return Unauthorized();

        var alert = new EmergencyAlert
        {
            Id = Guid.NewGuid(),
            UserId = CurrentUserId,
            RideId = request.RideId,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Altitude = request.Altitude,
            Message = request.Message ?? $"Emergency SOS from {user.FullName} at ({request.Latitude:F4}, {request.Longitude:F4})",
            Status = EmergencyStatus.Active,
            TriggeredAt = DateTime.UtcNow
        };

        _dbContext.EmergencyAlerts.Add(alert);
        await _dbContext.SaveChangesAsync();

        var alertDto = new EmergencyAlertDto
        {
            AlertId = alert.Id,
            UserId = user.Id,
            UserName = user.FullName,
            UserPhoneNumber = user.PhoneNumber,
            RideId = request.RideId,
            Latitude = alert.Latitude,
            Longitude = alert.Longitude,
            Altitude = alert.Altitude,
            Message = alert.Message,
            Status = alert.Status,
            TriggeredAt = alert.TriggeredAt,
            EmergencyContacts = user.EmergencyContacts.Where(c => !c.IsDeleted).Select(c => new EmergencyContactDto
            {
                Id = c.Id,
                UserId = c.UserId,
                Name = c.Name,
                PhoneNumber = c.PhoneNumber,
                Relationship = c.Relationship,
                IsPrimary = c.IsPrimary
            }).ToList()
        };

        return Ok(alertDto);
    }
}
