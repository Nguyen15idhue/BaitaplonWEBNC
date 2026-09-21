using System.Net;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Travela.Api.Data;
using Travela.Api.DTOs.Auth;
using Travela.Api.DTOs.Common;
using Travela.Api.DTOs.User;
using Travela.Api.Helpers;
using Travela.Api.Middleware;

namespace Travela.Api.Services;

// UserService: Admin quản lý user (list/create/update/delete + role/lock).
// Tự khóa/tự hạ quyền/tự xóa chính mình -> 400 SELF_ACTION_DENIED.
public class UserService
{
    private readonly TravelaDbContext _db;
    private readonly AuditLogService _audit;
    private static readonly Regex UsernameRe = new(@"^[a-zA-Z0-9._-]{3,100}$", RegexOptions.Compiled);
    private static readonly Regex EmailRe = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled);
    private static readonly string[] ValidRoles = ["Admin", "Customer"];
    private static readonly string[] ValidStatus = ["Active", "Locked"];

    public UserService(TravelaDbContext db, AuditLogService audit)
    {
        _db = db;
        _audit = audit;
    }

    private static UserDto ToDto(Models.User u) => new()
    {
        Id = u.Id, Username = u.Username, Email = u.Email, Role = u.Role, Status = u.Status
    };

    public async Task<PagedResult<UserDto>> ListAsync(int page, int pageSize, string? search, string? role = null, string? status = null)
    {
        (page, pageSize) = PaginationHelper.Normalize(page, pageSize);
        var q = _db.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(u => u.Username.Contains(search) || u.Email.Contains(search));
        // D5: filter quản trị theo role/status.
        if (!string.IsNullOrWhiteSpace(role)) q = q.Where(u => u.Role == role);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(u => u.Status == status);
        var total = await q.CountAsync();
        var items = await q.OrderBy(u => u.Id).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return PaginationHelper.ToPagedResult(items.Select(ToDto).ToList(), total, page, pageSize);
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest req, int actorId)
    {
        if (req is null)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Thiếu dữ liệu user.");
        var username = (req.Username ?? string.Empty).Trim();
        var email = (req.Email ?? string.Empty).Trim();
        ValidateUsernameEmail(username, email);
        ValidatePassword(req.Password);
        ValidateRoleStatus(req.Role, req.Status);

        if (await _db.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower()))
            throw new AppException(HttpStatusCode.Conflict, "DUPLICATE_USER", "Username đã tồn tại.");
        if (await _db.Users.AnyAsync(u => u.Email.ToLower() == email.ToLower()))
            throw new AppException(HttpStatusCode.Conflict, "DUPLICATE_USER", "Email đã tồn tại.");

        await using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var user = new Models.User
            {
                Username = username, Email = email,
                PasswordHash = PasswordHasher.Hash(req.Password),
                Role = req.Role, Status = req.Status, CreatedAt = DateTime.UtcNow
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync(); // lấy Id
            _audit.Add(actorId, "User.Create", "User", user.Id, null, $"{username}|{req.Role}");
            await _db.SaveChangesAsync();
            await tx.CommitAsync();
            return ToDto(user);
        }
        catch (DbUpdateException)
        {
            await tx.RollbackAsync();
            throw new AppException(HttpStatusCode.Conflict, "DUPLICATE_USER", "Username hoặc email đã tồn tại.");
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task<UserDto> UpdateAsync(int id, UpdateUserRequest req, int actorId)
    {
        if (req is null)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Thiếu dữ liệu user.");
        var email = (req.Email ?? string.Empty).Trim();
        if (!EmailRe.IsMatch(email) || email.Length > 200)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Email không đúng định dạng.");
        ValidateRoleStatus(req.Role, req.Status);
        if (!string.IsNullOrWhiteSpace(req.NewPassword)) ValidatePassword(req.NewPassword);

        var user = await _db.Users.FindAsync(id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy user.");

        // Tự bảo vệ: không tự hạ quyền / tự khóa chính mình.
        if (id == actorId && req.Role != user.Role)
            throw new AppException(HttpStatusCode.BadRequest, "SELF_ACTION_DENIED", "Không thể tự hạ quyền chính mình.");
        if (id == actorId && req.Status != "Active")
            throw new AppException(HttpStatusCode.BadRequest, "SELF_ACTION_DENIED", "Không thể tự khóa chính mình.");

        if (!string.Equals(email, user.Email, StringComparison.OrdinalIgnoreCase) &&
            await _db.Users.AnyAsync(u => u.Email.ToLower() == email.ToLower() && u.Id != id))
            throw new AppException(HttpStatusCode.Conflict, "DUPLICATE_USER", "Email đã tồn tại.");

        var old = $"{user.Email}|{user.Role}|{user.Status}";
        user.Email = email;
        user.Role = req.Role;
        user.Status = req.Status;
        if (!string.IsNullOrWhiteSpace(req.NewPassword))
        {
            user.PasswordHash = PasswordHasher.Hash(req.NewPassword);
            // Đổi mật khẩu -> thu hồi refresh đang active (buộc đăng nhập lại).
            var actives = await _db.RefreshTokens.Where(r => r.UserId == id && r.RevokedAt == null).ToListAsync();
            foreach (var r in actives) r.RevokedAt = DateTime.UtcNow;
        }
        _audit.Add(actorId, "User.Update", "User", id, old, $"{user.Email}|{user.Role}|{user.Status}");
        await _db.SaveChangesAsync();
        return ToDto(user);
    }

    public async Task<UserDto> UpdateRoleAsync(int id, string role, int actorId)
    {
        ValidateRoleStatus(role, null);
        if (id == actorId)
            throw new AppException(HttpStatusCode.BadRequest, "SELF_ACTION_DENIED", "Không thể tự hạ quyền chính mình.");

        var user = await _db.Users.FindAsync(id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy user.");
        var old = user.Role;
        user.Role = role;
        // Audit cùng 1 SaveChanges với mutation (không audit coi như chưa xong).
        _audit.Add(actorId, "User.Role", "User", id, old, role);
        await _db.SaveChangesAsync();
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
        _audit.Add(actorId, locked ? "User.Lock" : "User.Unlock", "User", id, old, user.Status);

        // Thu hồi mọi refresh đang active khi bị khóa — cùng 1 SaveChanges.
        if (locked)
        {
            var actives = await _db.RefreshTokens
                .Where(r => r.UserId == id && r.RevokedAt == null).ToListAsync();
            foreach (var r in actives) r.RevokedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        return ToDto(user);
    }

    // Xóa cứng: chặn nếu user đã có booking (FK Restrict). Các tham chiếu nullable
    // (support_requests, audit_logs) được gỡ về null; refresh_tokens/idempotency_keys xóa theo.
    public async Task DeleteAsync(int id, int actorId)
    {
        if (id == actorId)
            throw new AppException(HttpStatusCode.BadRequest, "SELF_ACTION_DENIED", "Không thể tự xóa chính mình.");
        await using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var user = await _db.Users.FindAsync(id)
                ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy user.");
            if (await _db.Bookings.AnyAsync(b => b.UserId == id))
                throw new AppException(HttpStatusCode.Conflict, "HAS_RELATIONS",
                    "User đã có đơn đặt tour, hãy khóa thay vì xóa.");

            await _db.SupportRequests.Where(s => s.UserId == id)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.UserId, (int?)null));
            await _db.SupportRequests.Where(s => s.HandledBy == id)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.HandledBy, (int?)null));
            await _db.AuditLogs.Where(a => a.ActorId == id)
                .ExecuteUpdateAsync(a => a.SetProperty(x => x.ActorId, (int?)null));
            await _db.RefreshTokens.Where(r => r.UserId == id).ExecuteDeleteAsync();
            await _db.IdempotencyKeys.Where(k => k.UserId == id).ExecuteDeleteAsync();

            var username = user.Username;
            _db.Users.Remove(user);
            _audit.Add(actorId, "User.Delete", "User", id, username, null);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    private static void ValidateUsernameEmail(string username, string email)
    {
        if (!UsernameRe.IsMatch(username))
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR",
                "Username 3-100 ký tự, chỉ gồm chữ/số và . _ -.");
        if (!EmailRe.IsMatch(email) || email.Length > 200)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Email không đúng định dạng.");
    }

    private static void ValidatePassword(string? password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < 8 || password.Length > 72)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Password 8-72 ký tự.");
    }

    private static void ValidateRoleStatus(string? role, string? status)
    {
        if (!ValidRoles.Contains(role))
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Role chỉ nhận Admin hoặc Customer.");
        if (status is not null && !ValidStatus.Contains(status))
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Status chỉ nhận Active hoặc Locked.");
    }
}
