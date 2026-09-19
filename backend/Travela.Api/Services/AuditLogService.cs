using Microsoft.EntityFrameworkCore;
using Travela.Api.Data;
using Travela.Api.DTOs.Common;
using Travela.Api.Helpers;
using Travela.Api.Models;

namespace Travela.Api.Services;

// Ghi audit cho mọi đổi giá, đổi trạng thái, khóa/đổi role user (B2.5).
public class AuditLogService
{
    private readonly TravelaDbContext _db;
    private const int MaxValueLen = 4000; // N11: truncate để audit lỗi không làm nổ transaction chính.

    public AuditLogService(TravelaDbContext db)
    {
        _db = db;
    }

    private static string? Truncate(string? v)
        => v is null ? null : (v.Length <= MaxValueLen ? v : v[..MaxValueLen]);

    public async Task LogAsync(int? actorId, string action, string entityType, int entityId, string? oldValue = null, string? newValue = null)
    {
        Add(actorId, action, entityType, entityId, oldValue, newValue);
        await _db.SaveChangesAsync();
    }

    // H12: chỉ Add, không commit — caller commit cùng transaction với mutation chính.
    public void Add(int? actorId, string action, string entityType, int entityId, string? oldValue = null, string? newValue = null)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            ActorId = actorId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OldValue = Truncate(oldValue),
            NewValue = Truncate(newValue),
            CreatedAt = DateTime.UtcNow
        });
    }

    // B2: controller không query DbContext trực tiếp, trả DTO có actorUsername.
    public async Task<PagedResult<AuditLogDto>> ListAsync(
        string? entityType, int? entityId, string? action,
        DateTime? from, DateTime? to, int page, int pageSize)
    {
        (page, pageSize) = PaginationHelper.Normalize(page, pageSize);
        var q = _db.AuditLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(entityType)) q = q.Where(a => a.EntityType == entityType);
        if (entityId.HasValue) q = q.Where(a => a.EntityId == entityId.Value);
        if (!string.IsNullOrWhiteSpace(action)) q = q.Where(a => a.Action == action);
        if (from.HasValue) q = q.Where(a => a.CreatedAt >= from.Value);
        if (to.HasValue) q = q.Where(a => a.CreatedAt <= to.Value);
        var total = await q.CountAsync();
        var rows = await q.OrderByDescending(a => a.Id).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(a => new AuditLogDto
            {
                Id = a.Id, ActorId = a.ActorId,
                ActorUsername = a.Actor != null ? a.Actor.Username : "system",
                Action = a.Action, EntityType = a.EntityType, EntityId = a.EntityId,
                OldValue = a.OldValue, NewValue = a.NewValue, CreatedAt = a.CreatedAt
            }).ToListAsync();
        return PaginationHelper.ToPagedResult(rows, total, page, pageSize);
    }
}
