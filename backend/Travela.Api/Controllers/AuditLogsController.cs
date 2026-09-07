using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Travela.Api.Data;
using Travela.Api.Helpers;

namespace Travela.Api.Controllers;

// AuditLogs: chỉ Admin tra cứu lịch sử đổi giá/đổi trạng thái/khóa user.
[ApiController]
[Route("api/audit-logs")]
[Authorize(Roles = "Admin")]
public class AuditLogsController : ControllerBase
{
    private readonly TravelaDbContext _db;

    public AuditLogsController(TravelaDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? entityType = null,
        [FromQuery] int? entityId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        (page, pageSize) = PaginationHelper.Normalize(page, pageSize);
        var q = _db.AuditLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(entityType)) q = q.Where(a => a.EntityType == entityType);
        if (entityId.HasValue) q = q.Where(a => a.EntityId == entityId.Value);
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(a => a.Id).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(PaginationHelper.ToPagedResult(items, total, page, pageSize));
    }
}
