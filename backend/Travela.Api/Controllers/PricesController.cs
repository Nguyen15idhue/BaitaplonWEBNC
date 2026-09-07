using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Travela.Api.DTOs.Tour;
using Travela.Api.Services;

namespace Travela.Api.Controllers;

// Prices: đọc public theo tour, ghi Admin. Mọi đổi giá ghi audit trong Service.
[ApiController]
public class PricesController : ControllerBase
{
    private readonly TourService _tours;

    public PricesController(TourService tours)
    {
        _tours = tours;
    }

    [HttpGet("api/tours/{tourId:int}/prices")]
    [AllowAnonymous]
    public async Task<IActionResult> ListByTour(int tourId)
    {
        return Ok(await _tours.ListPricesAsync(tourId));
    }

    [HttpPost("api/tours/{tourId:int}/prices")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(int tourId, [FromBody] CreatePriceRequest req)
    {
        return StatusCode(201, await _tours.CreatePriceAsync(tourId, req, CurrentUserId()));
    }

    [HttpPut("api/prices/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePriceRequest req)
    {
        return Ok(await _tours.UpdatePriceAsync(id, req, CurrentUserId()));
    }

    [HttpDelete("api/prices/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await _tours.DeletePriceAsync(id, CurrentUserId());
        return Ok(new { message = "Đã xóa giá." });
    }

    private int CurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new Middleware.AppException(System.Net.HttpStatusCode.Unauthorized, "UNAUTHORIZED", "Phiên không hợp lệ.");
        return int.Parse(sub);
    }
}
