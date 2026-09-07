using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Travela.Api.DTOs.Tour;
using Travela.Api.Services;

namespace Travela.Api.Controllers;

// Tours: đọc public (chỉ Published), ghi Admin. B3 thay thế placeholder B0.
[ApiController]
[Route("api/tours")]
public class ToursController : ControllerBase
{
    private readonly TourService _tours;

    public ToursController(TourService tours)
    {
        _tours = tours;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> List(
        [FromQuery] string? search = null,
        [FromQuery] int? destinationId = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] string? sort = null)
    {
        return Ok(await _tours.ListAsync(search, destinationId, minPrice, maxPrice, page, pageSize, sort, publicOnly: true));
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> Detail(int id)
    {
        // Admin xem được cả Draft/Hidden để quản trị; còn lại chỉ Published.
        var admin = User.Identity?.IsAuthenticated == true && User.IsInRole("Admin");
        return Ok(await _tours.GetDetailAsync(id, publicOnly: !admin));
    }

    // F3 cần: Admin xem tất cả trạng thái để quản trị (public vẫn chỉ Published).
    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ListAll(
        [FromQuery] string? search = null,
        [FromQuery] int? destinationId = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] string? sort = null,
        [FromQuery] string? status = null)
    {
        return Ok(await _tours.ListAsync(search, destinationId, minPrice, maxPrice, page, pageSize, sort, publicOnly: false, status));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateTourRequest req)
    {
        var created = await _tours.CreateAsync(req, CurrentUserId());
        return StatusCode(201, created);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTourRequest req)
    {
        return Ok(await _tours.UpdateAsync(id, req, CurrentUserId()));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        return Ok(await _tours.DeleteAsync(id, CurrentUserId()));
    }

    private int CurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new Middleware.AppException(System.Net.HttpStatusCode.Unauthorized, "UNAUTHORIZED", "Phiên không hợp lệ.");
        return int.Parse(sub);
    }
}
