using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Travela.Api.DTOs.Booking;
using Travela.Api.Services;

namespace Travela.Api.Controllers;

// Bookings: Customer tạo + xem/hủy đơn của mình, Admin xem tất cả + chuyển trạng thái.
[ApiController]
[Route("api/bookings")]
public class BookingsController : BaseApiController
{
    private readonly BookingService _bookings;

    public BookingsController(BookingService bookings)
    {
        _bookings = bookings;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateBookingRequest req,
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey)
    {
        var created = await _bookings.CreateAsync(req, CurrentUserId(), CurrentUsername(), idempotencyKey);
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

    // A2: thanh toán bổ sung cho đơn PendingPayment kẹt.
    [HttpPost("{id:int}/pay")]
    public async Task<IActionResult> Pay(int id)
    {
        return Ok(await _bookings.PayAsync(id, CurrentUserId(), CurrentUsername(), IsAdmin()));
    }

    // B5: /status chỉ Admin; customer hủy qua /cancel.
    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest req)
    {
        return Ok(await _bookings.UpdateStatusAsync(id, req.Status, req.Note, CurrentUserId(), CurrentUsername(), IsAdmin()));
    }

    [HttpPut("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        return Ok(await _bookings.CancelAsync(id, CurrentUserId(), CurrentUsername()));
    }
}
