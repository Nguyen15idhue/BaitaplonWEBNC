using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Travela.Api.Middleware;

namespace Travela.Api.Controllers;

// Base dùng chung (C6): parse sub an toàn, xóa 6 bản copy CurrentUserId.
// Token lạ (sub không phải số) -> 401 thay vì 500.
public abstract class BaseApiController : ControllerBase
{
    protected bool IsAdmin() => User.IsInRole("Admin");

    protected int CurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(sub) || !int.TryParse(sub, out var id))
            throw new AppException(HttpStatusCode.Unauthorized, "UNAUTHORIZED", "Phiên không hợp lệ.");
        return id;
    }

    protected string CurrentUsername()
    {
        return User.FindFirstValue("username") ?? $"user{CurrentUserId()}";
    }
}
