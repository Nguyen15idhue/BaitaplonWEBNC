using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Travela.Api.DTOs.Auth;
using Travela.Api.Services;

namespace Travela.Api.Controllers;

// Auth: register/login/refresh/logout public, me cần đăng nhập (Default Deny toàn cục).
[ApiController]
[Route("api/auth")]
public class AuthController : BaseApiController
{
    private readonly AuthService _auth;

    public AuthController(AuthService auth)
    {
        _auth = auth;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting("auth-register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var user = await _auth.RegisterAsync(req);
        return StatusCode(201, user);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth-login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        return Ok(await _auth.LoginAsync(req));
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest req)
    {
        return Ok(await _auth.RefreshAsync(req.RefreshToken));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest req)
    {
        await _auth.LogoutAsync(req.RefreshToken);
        return Ok(new { message = "Đã đăng xuất." });
    }

    // C4: đăng xuất mọi thiết bị.
    [HttpPost("logout-all")]
    public async Task<IActionResult> LogoutAll()
    {
        await _auth.LogoutAllAsync(CurrentUserId());
        return Ok(new { message = "Đã đăng xuất mọi thiết bị." });
    }

    // A6: đổi mật khẩu (verify cũ, thu hồi refresh khác).
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        return Ok(await _auth.ChangePasswordAsync(CurrentUserId(), req));
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        return Ok(await _auth.MeAsync(CurrentUserId()));
    }
}
