using System.ComponentModel.DataAnnotations;
using RIDEX.Shared.Enums;

namespace RIDEX.Shared.DTOs;

public class RegisterRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required, MinLength(2), MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Phone]
    public string? PhoneNumber { get; set; }

    public string? City { get; set; }

    public string? RidingExperience { get; set; } // e.g. "5 years touring", "Beginner", "Adventure Veteran"
}

public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserProfileDto User { get; set; } = null!;
}

public class RefreshTokenRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? City { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string? RidingExperience { get; set; }
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateProfileRequest
{
    [Required, MinLength(2), MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Phone]
    public string? PhoneNumber { get; set; }

    public string? City { get; set; }

    public string? ProfilePictureUrl { get; set; }

    public string? RidingExperience { get; set; }
}
