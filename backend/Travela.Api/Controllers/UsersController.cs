using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Travela.Api.DTOs.User;
using Travela.Api.Services;

namespace Travela.Api.Controllers;

// Users: chỉ Admin. Tự khóa/tự hạ quyền chính mình -> 400 (Service ném SELF_ACTION_DENIED).
[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : BaseApiController
{
    private readonly UserService _users;

    public UsersController(UserService users)
    {
        _users = users;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 12,
        [FromQuery] string? search = null, [FromQuery] string? role = null,
        [FromQuery] string? status = null)
    {
        return Ok(await _users.ListAsync(page, pageSize, search, role, status));
    }

    [HttpPut("{id:int}/role")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateRoleRequest req)
    {
        return Ok(await _users.UpdateRoleAsync(id, req.Role, CurrentUserId()));
    }

    [HttpPut("{id:int}/lock")]
    public async Task<IActionResult> UpdateLock(int id, [FromBody] UpdateLockRequest req)
    {
        return Ok(await _users.UpdateLockAsync(id, req.Locked, CurrentUserId()));
    }
}
