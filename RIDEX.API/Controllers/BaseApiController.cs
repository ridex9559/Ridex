using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace RIDEX.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected Guid CurrentUserId
    {
        get
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(claim, out var id) && id != Guid.Empty)
                return id;

            // Default development / demo rider ID (Aryan Deshmukh)
            return Guid.Parse("11111111-1111-1111-1111-111111111111");
        }
    }

    protected string CurrentUserEmail => User.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty;
    protected string CurrentUserName => User.FindFirst(ClaimTypes.Name)?.Value ?? string.Empty;
    protected bool IsAdmin => User.IsInRole("Admin");
}
