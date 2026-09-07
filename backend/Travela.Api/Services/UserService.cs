using System.Net;
using Microsoft.EntityFrameworkCore;
using Travela.Api.Data;
using Travela.Api.DTOs.Auth;
using Travela.Api.DTOs.Common;
using Travela.Api.DTOs.User;
using Travela.Api.Helpers;
using Travela.Api.Middleware;

namespace Travela.Api.Services;

// UserService: Admin quản lý user. Tự khóa/tự hạ quyền chính mình -> 400 SELF_ACTION_DENIED.
public class UserService
{
    private readonly TravelaDbContext _db;
    private readonly AuditLogService _audit;

    public UserService(TravelaDbContext db, AuditLogService audit)
    {
        _db = db;
        _audit = audit;
    }

    private static UserDto ToDto(Models.User u) => new()
    {
        Id = u.Id, Username = u.Username, Email = u.Email, Role = u.Role, Status = u.Status
    };

    public async Task<PagedResult<UserDto>> ListAsync(int page, int pageSize, string? search)
    {
        (page, pageSize) = PaginationHelper.Normalize(page, pageSize);
        var q = _db.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(u => u.Username.Contains(search) || u.Email.Contains(search));
        var total = await q.CountAsync();
        var items = await q.OrderBy(u => u.Id).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return PaginationHelper.ToPagedResult(items.Select(ToDto).ToList(), total, page, pageSize);
    }

    public async Task<UserDto> UpdateRoleAsync(int id, string role, int actorId)
    {
        if (role != "Admin" && role != "Customer")
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Role chỉ nhận Admin hoặc Customer.");
        if (id == actorId)
            throw new AppException(HttpStatusCode.BadRequest, "SELF_ACTION_DENIED", "Không thể tự hạ quyền chính mình.");

        var user = await _db.Users.FindAsync(id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy user.");
        var old = user.Role;
        user.Role = role;
        await _db.SaveChangesAsync();
        await _audit.LogAsync(actorId, "User.Role", "User", id, old, role);
        return ToDto(user);
    }

    public async Task<UserDto> UpdateLockAsync(int id, bool locked, int actorId)
    {
        if (id == actorId)
            throw new AppException(HttpStatusCode.BadRequest, "SELF_ACTION_DENIED", "Không thể tự khóa chính mình.");

        var user = await _db.Users.FindAsync(id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy user.");
        var old = user.Status;
        user.Status = locked ? "Locked" : "Active";
        await _db.SaveChangesAsync();
        await _audit.LogAsync(actorId, locked ? "User.Lock" : "User.Unlock", "User", id, old, user.Status);

        // Thu hồi mọi refresh đang active khi bị khóa.
        if (locked)
        {
            var actives = await _db.RefreshTokens
                .Where(r => r.UserId == id && r.RevokedAt == null).ToListAsync();
            foreach (var r in actives) r.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
        return ToDto(user);
    }
}
