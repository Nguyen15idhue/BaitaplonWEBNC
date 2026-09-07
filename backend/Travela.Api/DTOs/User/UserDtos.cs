namespace Travela.Api.DTOs.User;

public class UpdateRoleRequest
{
    public string Role { get; set; } = string.Empty;
}

public class UpdateLockRequest
{
    public bool Locked { get; set; }
}
