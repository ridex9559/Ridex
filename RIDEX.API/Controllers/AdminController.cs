using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RIDEX.Core.Interfaces;
using RIDEX.Infrastructure.Data;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.API.Controllers;

[Authorize(Roles = "Admin")]
public class AdminController : BaseApiController
{
    private readonly RideXDbContext _dbContext;
    private readonly ILiveRideStateStore _liveStateStore;
    private readonly ILogger<AdminController> _logger;
    private static readonly DateTime ServerStartTime = DateTime.UtcNow;

    public AdminController(
        RideXDbContext dbContext,
        ILiveRideStateStore liveStateStore,
        ILogger<AdminController> logger)
    {
        _dbContext = dbContext;
        _liveStateStore = liveStateStore;
        _logger = logger;
    }

    [HttpGet("stats")]
    [ProducesResponseType(typeof(AdminDashboardStatsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardStats()
    {
        var totalUsers = await _dbContext.Users.CountAsync(u => !u.IsDeleted);
        var totalRides = await _dbContext.Rides.CountAsync(r => !r.IsDeleted);
        var activeRides = await _dbContext.Rides.CountAsync(r => r.Status == RideStatus.InProgress);

        var today = DateTime.UtcNow.Date;
        var ridesToday = await _dbContext.Rides.CountAsync(r => r.CreatedAt >= today);

        var totalEmergencyAlerts = await _dbContext.EmergencyAlerts.CountAsync(a => a.Status == EmergencyStatus.Active);

        var routes = await _dbContext.Routes.AsNoTracking().Select(r => r.TotalDistanceKm).ToListAsync();
        var totalDistanceKm = routes.Sum();

        var activeRideIds = await _liveStateStore.GetActiveRideIdsAsync();
        int onlineRidersCount = 0;
        foreach (var id in activeRideIds)
        {
            var state = await _liveStateStore.GetRideStateAsync(id);
            if (state != null)
            {
                onlineRidersCount += state.Riders.Count(r => r.OnlineStatus == RiderOnlineStatus.Online);
            }
        }

        var stats = new AdminDashboardStatsDto
        {
            TotalUsers = totalUsers,
            TotalRides = totalRides,
            ActiveRides = activeRides > 0 ? activeRides : activeRideIds.Count,
            OnlineRiders = onlineRidersCount,
            RidesToday = ridesToday,
            TotalDistanceCoveredKm = Math.Round(totalDistanceKm, 1),
            TotalEmergencyAlerts = totalEmergencyAlerts,
            SystemHealth = new SystemHealthDto
            {
                Status = "Healthy",
                DatabaseProvider = _dbContext.Database.ProviderName?.Contains("Sqlite") == true ? "SQLite (Zero-Cost Local)" : "PostgreSQL/PostGIS",
                DatabaseConnected = true,
                RealtimeEngine = "SignalR (In-Memory Live Store)",
                ActiveSignalRConnections = onlineRidersCount,
                Uptime = DateTime.UtcNow - ServerStartTime,
                ServerTimeUtc = DateTime.UtcNow,
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"
            }
        };

        return Ok(stats);
    }

    [HttpGet("users")]
    [ProducesResponseType(typeof(List<AdminUserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var users = await _dbContext.Users
            .AsNoTracking()
            .Where(u => !u.IsDeleted)
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserDto
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                PhoneNumber = u.PhoneNumber,
                City = u.City,
                Role = u.Role,
                RidesCount = u.RideMemberships.Count,
                MotorcyclesCount = u.Motorcycles.Count,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("rides")]
    [ProducesResponseType(typeof(List<AdminRideOverviewDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRides([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var rides = await _dbContext.Rides
            .AsNoTracking()
            .Include(r => r.Owner)
            .Include(r => r.Route)
            .Include(r => r.Members)
            .Where(r => !r.IsDeleted)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new AdminRideOverviewDto
            {
                Id = r.Id,
                Title = r.Title,
                JoinCode = r.JoinCode,
                OwnerName = r.Owner.FullName,
                Status = r.Status,
                MemberCount = r.Members.Count,
                DistanceKm = r.Route != null ? r.Route.TotalDistanceKm : 0,
                ScheduledStartTime = r.ScheduledStartTime,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(rides);
    }
}
