using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RIDEX.Core.Entities;
using RIDEX.Core.Interfaces;
using RIDEX.Infrastructure.Data;
using RIDEX.Shared.Algorithms;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.API.Controllers;

[Authorize]
public class RidesController : BaseApiController
{
    private readonly RideXDbContext _dbContext;
    private readonly ILiveRideStateStore _liveStateStore;
    private readonly IRoutingService _routingService;
    private readonly ILogger<RidesController> _logger;

    public RidesController(
        RideXDbContext dbContext,
        ILiveRideStateStore liveStateStore,
        IRoutingService routingService,
        ILogger<RidesController> logger)
    {
        _dbContext = dbContext;
        _liveStateStore = liveStateStore;
        _routingService = routingService;
        _logger = logger;
    }

    [AllowAnonymous]
    [HttpGet]
    [ProducesResponseType(typeof(List<RideDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserRides()
    {
        var rides = await _dbContext.Rides
            .AsNoTracking()
            .Include(r => r.Owner)
            .Include(r => r.Route)
                .ThenInclude(rt => rt!.Waypoints)
            .Include(r => r.Members)
                .ThenInclude(m => m.User)
            .Where(r => !r.IsDeleted)
            .OrderByDescending(r => r.ScheduledStartTime)
            .ToListAsync();

        return Ok(rides.Select(MapToRideDto).ToList());
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(RideDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var ride = await _dbContext.Rides
            .AsNoTracking()
            .Include(r => r.Owner)
            .Include(r => r.Route)
                .ThenInclude(rt => rt!.Waypoints)
            .Include(r => r.Members)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);

        if (ride == null)
            return NotFound(new { message = "Ride not found." });

        return Ok(MapToRideDto(ride));
    }

    [AllowAnonymous]
    [HttpPost]
    [ProducesResponseType(typeof(RideDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateRideRequest request)
    {
        // 1. Generate unique readable Join Code
        string joinCode;
        do
        {
            joinCode = JoinCodeGenerator.Generate();
        } while (await _dbContext.Rides.AnyAsync(r => r.JoinCode == joinCode));

        Guid? validMotorcycleId = null;
        if (request.MotorcycleId.HasValue && await _dbContext.Motorcycles.AnyAsync(m => m.Id == request.MotorcycleId.Value))
        {
            validMotorcycleId = request.MotorcycleId.Value;
        }

        var ride = new Ride
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description,
            JoinCode = joinCode,
            Status = RideStatus.Upcoming,
            ScheduledStartTime = request.ScheduledStartTime,
            MaxRiders = request.MaxRiders,
            SeparationThresholdKm = request.SeparationThresholdKm,
            OwnerId = CurrentUserId,
            ActiveMotorcycleId = validMotorcycleId,
            CreatedAt = DateTime.UtcNow
        };

        // 2. Add creator as Owner in RideMembers
        var ownerMember = new RideMember
        {
            Id = Guid.NewGuid(),
            RideId = ride.Id,
            UserId = CurrentUserId,
            MotorcycleId = validMotorcycleId,
            Role = RideRole.Owner,
            OnlineStatus = RiderOnlineStatus.Online,
            JoinedAt = DateTime.UtcNow
        };
        ride.Members.Add(ownerMember);

        // 3. Process Route Plan if provided
        if (request.RoutePlan != null)
        {
            var routeResult = await _routingService.CalculateRouteAsync(request.RoutePlan);
            var route = new RIDEX.Core.Entities.Route
            {
                Id = Guid.NewGuid(),
                RideId = ride.Id,
                OriginName = request.RoutePlan.OriginName,
                OriginLatitude = request.RoutePlan.OriginLatitude,
                OriginLongitude = request.RoutePlan.OriginLongitude,
                DestinationName = request.RoutePlan.DestinationName,
                DestinationLatitude = request.RoutePlan.DestinationLatitude,
                DestinationLongitude = request.RoutePlan.DestinationLongitude,
                TotalDistanceKm = routeResult.TotalDistanceKm,
                EstimatedDurationMinutes = routeResult.EstimatedDurationMinutes,
                PolylineGeometry = routeResult.PolylineGeometry,
                Preference = request.RoutePlan.Preference,
                InstructionsJson = JsonSerializer.Serialize(routeResult.Instructions)
            };

            foreach (var wp in request.RoutePlan.Waypoints)
            {
                route.Waypoints.Add(new Waypoint
                {
                    Id = Guid.NewGuid(),
                    RouteId = route.Id,
                    Name = wp.Name,
                    Latitude = wp.Latitude,
                    Longitude = wp.Longitude,
                    Order = wp.Order,
                    Address = wp.Address,
                    IsFuelStop = wp.IsFuelStop
                });
            }

            ride.Route = route;
        }

        _dbContext.Rides.Add(ride);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = ride.Id }, MapToRideDto(ride));
    }

    [AllowAnonymous]
    [HttpPost("join")]
    [ProducesResponseType(typeof(RideDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> JoinRide([FromBody] JoinRideRequest request)
    {
        var cleanCode = request.JoinCode.Trim().ToUpperInvariant();
        var ride = await _dbContext.Rides
            .Include(r => r.Members)
            .Include(r => r.Owner)
            .Include(r => r.Route)
                .ThenInclude(rt => rt!.Waypoints)
            .FirstOrDefaultAsync(r => r.JoinCode == cleanCode && !r.IsDeleted);

        if (ride == null)
            return NotFound(new { message = "Invalid join code. Ride does not exist." });

        if (ride.Status == RideStatus.Completed || ride.Status == RideStatus.Cancelled)
            return BadRequest(new { message = "This ride has already finished or been cancelled." });

        if (ride.Members.Any(m => m.UserId == CurrentUserId))
            return Ok(MapToRideDto(ride)); // Already joined

        if (ride.Members.Count >= ride.MaxRiders)
            return BadRequest(new { message = "This group ride has reached its maximum rider capacity." });

        var member = new RideMember
        {
            Id = Guid.NewGuid(),
            RideId = ride.Id,
            UserId = CurrentUserId,
            MotorcycleId = request.MotorcycleId,
            Role = RideRole.Member,
            OnlineStatus = RiderOnlineStatus.Online,
            JoinedAt = DateTime.UtcNow
        };

        _dbContext.RideMembers.Add(member);
        await _dbContext.SaveChangesAsync();

        return Ok(MapToRideDto(ride));
    }

    [HttpGet("{id:guid}/live-state")]
    [ProducesResponseType(typeof(LiveRideStateDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLiveState(Guid id)
    {
        var state = await _liveStateStore.GetRideStateAsync(id);
        if (state != null)
            return Ok(state);

        var ride = await _dbContext.Rides
            .Include(r => r.Members)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (ride == null)
            return NotFound(new { message = "Ride not found." });

        var fallbackState = new LiveRideStateDto
        {
            RideId = ride.Id,
            LeaderId = ride.OwnerId,
            Status = ride.Status,
            SeparationThresholdKm = ride.SeparationThresholdKm,
            Riders = ride.Members.Select(m => new RiderLiveStateDto
            {
                UserId = m.UserId,
                UserName = m.User.FullName,
                Role = m.Role,
                OnlineStatus = m.OnlineStatus,
                Latitude = m.CurrentLatitude ?? 19.9975,
                Longitude = m.CurrentLongitude ?? 73.7898,
                SpeedKmh = m.CurrentSpeedKmh ?? 0,
                Heading = m.CurrentHeading ?? 0,
                LastUpdatedAt = m.LastLocationUpdate ?? DateTime.UtcNow
            }).ToList(),
            LastUpdatedAt = DateTime.UtcNow
        };

        return Ok(fallbackState);
    }

    [HttpGet("{id:guid}/replay")]
    [ProducesResponseType(typeof(List<CoordinatePoint>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReplayHistory(Guid id, [FromQuery] double epsilonMeters = 10.0)
    {
        var rawPoints = await _dbContext.HistoricalGpsPoints
            .AsNoTracking()
            .Where(p => p.RideId == id)
            .OrderBy(p => p.Timestamp)
            .Select(p => new CoordinatePoint(p.Latitude, p.Longitude, p.Altitude, p.Timestamp, p.SpeedKmh))
            .ToListAsync();

        if (rawPoints.Count == 0)
        {
            // Synthesize replay track from route if active ride has no recorded GPS points
            var route = await _dbContext.Routes.FirstOrDefaultAsync(r => r.RideId == id);
            if (route != null)
            {
                return Ok(new List<CoordinatePoint>
                {
                    new(route.OriginLatitude, route.OriginLongitude, 600, DateTime.UtcNow.AddHours(-4), 55),
                    new(route.DestinationLatitude, route.DestinationLongitude, 550, DateTime.UtcNow, 60)
                });
            }
        }

        var simplified = DouglasPeuckerReducer.Simplify(rawPoints, epsilonMeters);
        return Ok(simplified);
    }

    private static RideDto MapToRideDto(Ride r)
    {
        return new RideDto
        {
            Id = r.Id,
            Title = r.Title,
            Description = r.Description,
            JoinCode = r.JoinCode,
            Status = r.Status,
            ScheduledStartTime = r.ScheduledStartTime,
            ActualStartTime = r.ActualStartTime,
            ActualEndTime = r.ActualEndTime,
            MaxRiders = r.MaxRiders,
            SeparationThresholdKm = r.SeparationThresholdKm,
            OwnerId = r.OwnerId,
            OwnerName = r.Owner?.FullName ?? string.Empty,
            ActiveMotorcycleId = r.ActiveMotorcycleId,
            Route = r.Route != null ? new RouteDto
            {
                Id = r.Route.Id,
                OriginName = r.Route.OriginName,
                OriginLatitude = r.Route.OriginLatitude,
                OriginLongitude = r.Route.OriginLongitude,
                DestinationName = r.Route.DestinationName,
                DestinationLatitude = r.Route.DestinationLatitude,
                DestinationLongitude = r.Route.DestinationLongitude,
                TotalDistanceKm = r.Route.TotalDistanceKm,
                EstimatedDurationMinutes = r.Route.EstimatedDurationMinutes,
                PolylineGeometry = r.Route.PolylineGeometry,
                Preference = r.Route.Preference,
                Waypoints = r.Route.Waypoints.Select(w => new WaypointDto
                {
                    Id = w.Id,
                    Name = w.Name,
                    Latitude = w.Latitude,
                    Longitude = w.Longitude,
                    Order = w.Order,
                    Address = w.Address,
                    IsFuelStop = w.IsFuelStop
                }).OrderBy(w => w.Order).ToList()
            } : null,
            Members = r.Members.Select(m => new RideMemberDto
            {
                Id = m.Id,
                RideId = m.RideId,
                UserId = m.UserId,
                UserName = m.User?.FullName ?? string.Empty,
                ProfilePictureUrl = m.User?.ProfilePictureUrl,
                Role = m.Role,
                OnlineStatus = m.OnlineStatus,
                JoinedAt = m.JoinedAt,
                CurrentLatitude = m.CurrentLatitude,
                CurrentLongitude = m.CurrentLongitude,
                CurrentSpeedKmh = m.CurrentSpeedKmh,
                BatteryLevelPercent = m.BatteryLevelPercent
            }).ToList(),
            CreatedAt = r.CreatedAt
        };
    }
}
