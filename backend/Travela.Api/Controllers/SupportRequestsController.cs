using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Travela.Api.DTOs.Support;
using Travela.Api.Services;

namespace Travela.Api.Controllers;

// SupportRequests: gửi yêu cầu public (kể cả khách vãng lai), admin tiếp nhận/xử lý.
[ApiController]
[Route("api/support-requests")]
public class SupportRequestsController : BaseApiController
{
    private readonly SupportService _support;

    public SupportRequestsController(SupportService support)
    {
        _support = support;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateSupportRequest req)
    {
        return StatusCode(201, await _support.CreateAsync(req, TryUserId()));
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> List(
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        return Ok(await _support.ListAsync(status, search, page, pageSize));
    }

    [HttpGet("mine")]
    [Authorize]
    public async Task<IActionResult> Mine([FromQuery] int page = 1, [FromQuery] int pageSize = 12)
    {
        return Ok(await _support.MineAsync(CurrentUserId(), page, pageSize));
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Get(int id)
    {
        return Ok(await _support.GetAsync(id));
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateSupportStatusRequest req)
    {
        return Ok(await _support.UpdateStatusAsync(id, req, CurrentUserId()));
    }

    // User đăng nhập thì gắn UserId, khách vãng lai thì null (không 401).
    private int? TryUserId()
    {
        if (User.Identity?.IsAuthenticated != true) return null;
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(sub, out var id) ? id : null;
    }
}
