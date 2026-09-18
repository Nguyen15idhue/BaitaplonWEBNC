using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Travela.Api.Services;

namespace Travela.Api.Controllers;

// Stats admin: COUNT/SUM ở DB cho Dashboard (C07/A5).
[ApiController]
[Route("api/admin/stats")]
[Authorize(Roles = "Admin")]
public class AdminStatsController : BaseApiController
{
    private readonly AdminStatsService _stats;

    public AdminStatsController(AdminStatsService stats)
    {
        _stats = stats;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        return Ok(await _stats.GetAsync());
    }
}
