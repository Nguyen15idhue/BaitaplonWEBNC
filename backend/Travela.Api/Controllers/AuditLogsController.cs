using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Travela.Api.Services;

namespace Travela.Api.Controllers;

// AuditLogs: chỉ Admin tra cứu lịch sử đổi giá/đổi trạng thái/khóa user.
[ApiController]
[Route("api/audit-logs")]
[Authorize(Roles = "Admin")]
public class AuditLogsController : BaseApiController
{
    private readonly AuditLogService _audit;

    public AuditLogsController(AuditLogService audit)
    {
        _audit = audit;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? entityType = null,
        [FromQuery] int? entityId = null,
        [FromQuery] string? action = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        return Ok(await _audit.ListAsync(entityType, entityId, action, from, to, page, pageSize));
    }
}
