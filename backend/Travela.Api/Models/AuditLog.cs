namespace Travela.Api.Models;

// audit_logs: ghi mọi đổi giá, đổi trạng thái booking, khóa/đổi role user.
public class AuditLog
{
    public int Id { get; set; }
    public int? ActorId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? Actor { get; set; }
}
