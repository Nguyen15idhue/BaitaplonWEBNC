using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Travela.Api.DTOs.Tour;
using Travela.Api.Services;

namespace Travela.Api.Controllers;

// Images: chỉ Admin thêm/xóa (tối đa 10 ảnh/tour, URL http/https).
[ApiController]
public class ImagesController : BaseApiController
{
    private readonly TourService _tours;

    public ImagesController(TourService tours)
    {
        _tours = tours;
    }

    [HttpPost("api/tours/{tourId:int}/images")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(int tourId, [FromBody] CreateImageRequest req)
    {
        return StatusCode(201, await _tours.CreateImageAsync(tourId, req, CurrentUserId()));
    }

    [HttpDelete("api/images/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await _tours.DeleteImageAsync(id, CurrentUserId());
        return Ok(new { message = "Đã xóa ảnh." });
    }
}
