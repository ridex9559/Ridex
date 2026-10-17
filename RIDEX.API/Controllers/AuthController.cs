using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RIDEX.Core.Entities;
using RIDEX.Core.Interfaces;
using RIDEX.Infrastructure.Data;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;

namespace RIDEX.API.Controllers;

public class AuthController : BaseApiController
{
    private readonly RideXDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        RideXDbContext dbContext,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        ILogger<AuthController> logger)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _logger = logger;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var existing = await _dbContext.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (existing)
        {
            return BadRequest(new { message = "An account with this email address already exists." });
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.ToLower().Trim(),
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            PhoneNumber = request.PhoneNumber,
            City = request.City,
            RidingExperience = request.RidingExperience ?? "Motorcycle Enthusiast",
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow
        };

        var refreshToken = _tokenService.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        var token = _tokenService.GenerateAccessToken(user);

        return Ok(new AuthResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            User = MapToUserProfileDto(user)
        });
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var token = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);
        await _dbContext.SaveChangesAsync();

        return Ok(new AuthResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            User = MapToUserProfileDto(user)
        });
    }

    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var principal = _tokenService.GetPrincipalFromExpiredToken(request.Token);
        if (principal == null)
        {
            return BadRequest(new { message = "Invalid access token or refresh token." });
        }

        var email = principal.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user == null || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            return BadRequest(new { message = "Invalid or expired refresh token." });
        }

        var newAccessToken = _tokenService.GenerateAccessToken(user);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);
        await _dbContext.SaveChangesAsync();

        return Ok(new AuthResponse
        {
            Token = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            User = MapToUserProfileDto(user)
        });
    }

    [Authorize]
    [HttpGet("profile")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProfile()
    {
        var user = await _dbContext.Users.FindAsync(CurrentUserId);
        if (user == null)
            return NotFound(new { message = "User not found." });

        return Ok(MapToUserProfileDto(user));
    }

    [Authorize]
    [HttpPut("profile")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var user = await _dbContext.Users.FindAsync(CurrentUserId);
        if (user == null)
            return NotFound(new { message = "User not found." });

        user.FullName = request.FullName;
        user.PhoneNumber = request.PhoneNumber;
        user.City = request.City;
        user.ProfilePictureUrl = request.ProfilePictureUrl;
        user.RidingExperience = request.RidingExperience;
        user.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return Ok(MapToUserProfileDto(user));
    }

    private static UserProfileDto MapToUserProfileDto(User user)
    {
        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            City = user.City,
            ProfilePictureUrl = user.ProfilePictureUrl,
            RidingExperience = user.RidingExperience,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }
}
