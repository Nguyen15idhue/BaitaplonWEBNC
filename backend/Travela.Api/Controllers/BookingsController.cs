using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Travela.Api.DTOs.Booking;
using Travela.Api.Services;

namespace Travela.Api.Controllers;

// Bookings: Customer tạo + xem/hủy đơn của mình, Admin xem tất cả + chuyển trạng thái.
[ApiController]
[Route("api/bookings")]
public class BookingsController : ControllerBase
{
    private readonly BookingService _bookings;

    public BookingsController(BookingService bookings)
    {
        _bookings = bookings;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequest req)
    {
        var created = await _bookings.CreateAsync(req, CurrentUserId(), CurrentUsername());
        return StatusCode(201, created);
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 12)
    {
        return Ok(await _bookings.ListAsync(CurrentUserId(), IsAdmin(), status, page, pageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Detail(int id)
    {
        return Ok(await _bookings.GetAsync(id, CurrentUserId(), IsAdmin()));
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest req)
    {
        return Ok(await _bookings.UpdateStatusAsync(id, req.Status, req.Note, CurrentUserId(), CurrentUsername(), IsAdmin()));
    }

    [HttpPut("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        return Ok(await _bookings.CancelAsync(id, CurrentUserId(), CurrentUsername()));
    }

    private bool IsAdmin() => User.IsInRole("Admin");

    private int CurrentUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new Middleware.AppException(HttpStatusCode.Unauthorized, "UNAUTHORIZED", "Phiên không hợp lệ.");
        return int.Parse(sub);
    }

    private string CurrentUsername()
    {
        return User.FindFirstValue("username") ?? $"user{CurrentUserId()}";
    }
}
