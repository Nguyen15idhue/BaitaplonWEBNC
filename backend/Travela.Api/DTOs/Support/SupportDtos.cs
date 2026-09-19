namespace Travela.Api.DTOs.Support;

public class SupportRequestDto
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? AdminNote { get; set; }
    public int? HandledBy { get; set; }
    public DateTime? HandledAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateSupportRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class UpdateSupportStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? AdminNote { get; set; }
}
