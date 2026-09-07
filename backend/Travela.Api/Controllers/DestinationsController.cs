using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Travela.Api.DTOs.Destination;
using Travela.Api.Services;

namespace Travela.Api.Controllers;

// Destinations: đọc public, ghi Admin.
[ApiController]
[Route("api/destinations")]
public class DestinationsController : ControllerBase
{
    private readonly DestinationService _destinations;

    public DestinationsController(DestinationService destinations)
    {
        _destinations = destinations;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> List([FromQuery] string? search = null)
    {
        return Ok(await _destinations.ListAsync(search));
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> Detail(int id)
    {
        return Ok(await _destinations.GetAsync(id));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateDestinationRequest req)
    {
        return StatusCode(201, await _destinations.CreateAsync(req));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateDestinationRequest req)
    {
        return Ok(await _destinations.UpdateAsync(id, req));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await _destinations.DeleteAsync(id);
        return Ok(new { message = "Đã xóa điểm đến." });
    }
}
