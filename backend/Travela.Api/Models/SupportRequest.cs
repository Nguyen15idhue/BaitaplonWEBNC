namespace Travela.Api.Models;

// support_requests: yêu cầu hỗ trợ/lien hệ từ user (kể cả khách vãng lai).
// Trạng thái: New -> InProgress -> Resolved (cho phép New -> Resolved thẳng).
public class SupportRequest
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "New";
    public string? AdminNote { get; set; }
    public int? HandledBy { get; set; }
    public DateTime? HandledAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public User? Handler { get; set; }
}
