using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Travela.Api.Controllers;

// Placeholder M1 cho FE đấu nối. B3 sẽ thay bằng TourService + EF + phân trang/filter thật.
[ApiController]
[Route("api/tours")]
public class ToursController : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public IActionResult Get([FromQuery] int page = 1, [FromQuery] int pageSize = 12)
    {
        return Ok(new
        {
            items = Array.Empty<object>(),
            page,
            pageSize,
            total = 0
        });
    }
}
