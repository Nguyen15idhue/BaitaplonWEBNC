using Travela.Api.Data;
using Travela.Api.Models;

namespace Travela.Api.Services;

// Ghi audit cho mọi đổi giá, đổi trạng thái, khóa/đổi role user (B2.5).
public class AuditLogService
{
    private readonly TravelaDbContext _db;

    public AuditLogService(TravelaDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(int? actorId, string action, string entityType, int entityId, string? oldValue = null, string? newValue = null)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            ActorId = actorId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OldValue = oldValue,
            NewValue = newValue,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }
}
