using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Travela.Api.DTOs.Auth;
using Travela.Api.Services;

namespace Travela.Api.Controllers;

// Auth: register/login/refresh/logout public, me cần đăng nhập (Default Deny toàn cục).
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;

    public AuthController(AuthService auth)
    {
        _auth = auth;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var user = await _auth.RegisterAsync(req);
        return StatusCode(201, user);
    }

    [HttpPost("login")]
    [AllowAnonymous]
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

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        return Ok(await _auth.MeAsync(CurrentUserId()));
    }

    private int CurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new Middleware.AppException(System.Net.HttpStatusCode.Unauthorized, "UNAUTHORIZED", "Phiên không hợp lệ.");
        return int.Parse(sub);
    }
}
