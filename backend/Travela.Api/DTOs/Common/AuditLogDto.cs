namespace Travela.Api.DTOs.Common;

public class AuditLogDto
{
    public int Id { get; set; }
    public int? ActorId { get; set; }
    public string ActorUsername { get; set; } = "system";
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime CreatedAt { get; set; }
}
