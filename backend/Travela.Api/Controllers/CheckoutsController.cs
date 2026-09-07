using Microsoft.AspNetCore.Mvc;
using Travela.Api.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;

namespace Travela.Api.Controllers;

// Checkouts: chỉ tra cứu (own hoặc Admin), không tạo lẻ.
[ApiController]
[Route("api/checkouts")]
public class CheckoutsController : ControllerBase
{
    private readonly CheckoutService _checkouts;

    public CheckoutsController(CheckoutService checkouts)
    {
        _checkouts = checkouts;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Detail(int id)
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new Middleware.AppException(HttpStatusCode.Unauthorized, "UNAUTHORIZED", "Phiên không hợp lệ.");
        return Ok(await _checkouts.GetAsync(id, int.Parse(sub), User.IsInRole("Admin")));
    }
}
