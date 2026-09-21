namespace Travela.Api.DTOs.User;

public class CreateUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "Customer";
    public string Status { get; set; } = "Active";
}

public class UpdateUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Customer";
    public string Status { get; set; } = "Active";
    // Để trống nếu không đổi mật khẩu.
    public string? NewPassword { get; set; }
}

public class UpdateRoleRequest
{
    public string Role { get; set; } = string.Empty;
}

public class UpdateLockRequest
{
    public bool Locked { get; set; }
}
