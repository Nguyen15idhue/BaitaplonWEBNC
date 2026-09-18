using Microsoft.AspNetCore.Mvc;
using Travela.Api.Services;

namespace Travela.Api.Controllers;

// Checkouts: chỉ tra cứu (own hoặc Admin), không tạo lẻ.
[ApiController]
[Route("api/checkouts")]
public class CheckoutsController : BaseApiController
{
    private readonly CheckoutService _checkouts;

    public CheckoutsController(CheckoutService checkouts)
    {
        _checkouts = checkouts;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Detail(int id)
    {
        return Ok(await _checkouts.GetAsync(id, CurrentUserId(), IsAdmin()));
    }
}
