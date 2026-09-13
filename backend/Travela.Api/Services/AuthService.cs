using System.Net;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Travela.Api.Data;
using Travela.Api.DTOs.Auth;
using Travela.Api.Helpers;
using Travela.Api.Middleware;
using Travela.Api.Models;

namespace Travela.Api.Services;

// AuthService: register/login/refresh xoay vòng/logout/me. Refresh lưu hash, raw trả 1 lần.
public class AuthService
{
    private readonly TravelaDbContext _db;
    private readonly JwtHelper _jwt;

    public AuthService(TravelaDbContext db, JwtHelper jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    private static UserDto ToDto(User u) => new()
    {
        Id = u.Id, Username = u.Username, Email = u.Email, Role = u.Role, Status = u.Status
    };

    public async Task<UserDto> RegisterAsync(RegisterRequest req)
    {
        if (req is null)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Thiếu dữ liệu đăng ký.");
        var username = (req.Username ?? string.Empty).Trim();
        var email = (req.Email ?? string.Empty).Trim();
        // C1: validate email/username rõ ràng.
        if (!Regex.IsMatch(username, @"^[a-zA-Z0-9._-]{3,100}$"))
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR",
                "Username 3-100 ký tự, chỉ gồm chữ/số và . _ -.");
        if (!Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$") || email.Length > 200)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Email không đúng định dạng.");
        // C2: 8-72 ký tự (BCrypt giới hạn 72 byte), tránh cắt ngầm.
        if (string.IsNullOrEmpty(req.Password) || req.Password.Length < 8 || req.Password.Length > 72)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR",
                "Password 8-72 ký tự, nên có cả chữ và số.");

        var unameLower = username.ToLower();
        var emailLower = email.ToLower();
        var exists = await _db.Users.AnyAsync(u =>
            u.Username.ToLower() == unameLower || u.Email.ToLower() == emailLower);
        if (exists)
            throw new AppException(HttpStatusCode.Conflict, "DUPLICATE_USER", "Username hoặc email đã tồn tại.");

        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = PasswordHasher.Hash(req.Password),
            Role = "Customer",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        _db.Users.Add(user);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // N02: race check-then-insert -> unique DB chặn, trả 409 thay vì 500.
            throw new AppException(HttpStatusCode.Conflict, "DUPLICATE_USER", "Username hoặc email đã tồn tại.");
        }
        return ToDto(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req)
    {
        if (req is null || string.IsNullOrWhiteSpace(req.UsernameOrEmail) || string.IsNullOrEmpty(req.Password))
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Thiếu tài khoản hoặc mật khẩu.");
        var key = req.UsernameOrEmail.Trim();
        var keyLower = key.ToLower();
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Username.ToLower() == keyLower || u.Email.ToLower() == keyLower);
        if (user is null || !PasswordHasher.Verify(req.Password, user.PasswordHash))
            throw new AppException(HttpStatusCode.Unauthorized, "INVALID_CREDENTIALS", "Sai tài khoản hoặc mật khẩu.");
        if (user.Status == "Locked")
            throw new AppException(HttpStatusCode.Unauthorized, "ACCOUNT_LOCKED", "Tài khoản đã bị khóa, liên hệ admin.");

        return await IssueTokensAsync(user);
    }

    public async Task<AuthResponse> RefreshAsync(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            throw new AppException(HttpStatusCode.Unauthorized, "INVALID_REFRESH", "Refresh token không hợp lệ.");
        var hash = JwtHelper.HashRefresh(raw.Trim());
        // C03: atomic compare-and-set — thu hồi token cũ trước trong cùng transaction,
        // request thứ 2 cùng token sẽ thấy RevokedAt != null và bị 401. Timeout 15s (C03).
        _db.Database.SetCommandTimeout(15);
        await using var tx = await _db.Database.BeginTransactionAsync();
        var rolledBack = false;
        try
        {
            var now = DateTime.UtcNow;
            // ExecuteUpdate atomic: chỉ 1 request thắng (affected==1), còn lại 401.
            // Dùng LINQ để EF tự map tên cột, tránh SQL viết tay lệch case.
            var affected = await _db.RefreshTokens
                .Where(r => r.TokenHash == hash && r.RevokedAt == null && r.ExpiresAt > now)
                .ExecuteUpdateAsync(s => s.SetProperty(r => r.RevokedAt, now));
            if (affected == 0)
            {
                // Token lạ hoặc đã dùng/hết hạn: rollback trước rồi mới thu hồi cả chuỗi,
                // nếu không revoke sẽ bị rollback theo (mất tác dụng chống reuse).
                var owner = await _db.RefreshTokens.AsNoTracking()
                    .Where(r => r.TokenHash == hash).Select(r => r.UserId).FirstOrDefaultAsync();
                await tx.RollbackAsync();
                rolledBack = true;
                if (owner != 0)
                    await RevokeChainAsync(owner);
                throw new AppException(HttpStatusCode.Unauthorized, "INVALID_REFRESH", "Refresh token không hợp lệ.");
            }

            var userId = await _db.RefreshTokens.AsNoTracking()
                .Where(r => r.TokenHash == hash).Select(r => r.UserId).FirstOrDefaultAsync();
            var user = await _db.Users.FindAsync(userId)
                ?? throw new AppException(HttpStatusCode.Unauthorized, "INVALID_REFRESH", "Refresh token không hợp lệ.");
            if (user.Status == "Locked")
                throw new AppException(HttpStatusCode.Unauthorized, "ACCOUNT_LOCKED", "Tài khoản đã bị khóa.");

            var next = await IssueTokensAsync(user);
            // Ghi liên kết chuỗi thay thế.
            var oldRow = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == hash);
            if (oldRow is not null) oldRow.ReplacedBy = JwtHelper.HashRefresh(next.RefreshToken);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();
            return next;
        }
        catch
        {
            if (!rolledBack)
                await tx.RollbackAsync();
            throw;
        }
        finally
        {
            _db.Database.SetCommandTimeout(null);
        }
    }

    public async Task LogoutAsync(string raw)
    {
        var hash = JwtHelper.HashRefresh(raw);
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == hash);
        if (stored is not null && stored.RevokedAt is null)
        {
            stored.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    // C4/M06: đăng xuất mọi thiết bị + dọn token cũ (giữ retention ở job).
    public async Task LogoutAllAsync(int userId)
    {
        await RevokeChainAsync(userId);
    }

    // A6: đổi mật khẩu — verify cũ, rule như register, thu hồi refresh khác (1 transaction).
    public async Task<UserDto> ChangePasswordAsync(int userId, ChangePasswordRequest req)
    {
        if (req is null)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Thiếu dữ liệu đổi mật khẩu.");
        var user = await _db.Users.FindAsync(userId)
            ?? throw new AppException(HttpStatusCode.Unauthorized, "UNAUTHORIZED", "Phiên không hợp lệ.");
        if (!PasswordHasher.Verify(req.OldPassword, user.PasswordHash))
            throw new AppException(HttpStatusCode.BadRequest, "INVALID_PASSWORD", "Mật khẩu cũ không đúng.");
        if (string.IsNullOrEmpty(req.NewPassword) || req.NewPassword.Length < 8 || req.NewPassword.Length > 72)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Mật khẩu mới 8-72 ký tự.");
        await using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            user.PasswordHash = PasswordHasher.Hash(req.NewPassword);
            await _db.SaveChangesAsync();
            await RevokeChainAsync(userId);
            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
        return ToDto(user);
    }

    public async Task<UserDto> MeAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new AppException(HttpStatusCode.Unauthorized, "UNAUTHORIZED", "Phiên không hợp lệ.");
        if (user.Status == "Locked") // C02: token cũ của user bị khóa phải 401 ngay.
            throw new AppException(HttpStatusCode.Unauthorized, "ACCOUNT_LOCKED", "Tài khoản đã bị khóa.");
        return ToDto(user);
    }

    private async Task<AuthResponse> IssueTokensAsync(User user)
    {
        var raw = JwtHelper.CreateRefreshRaw();
        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = JwtHelper.HashRefresh(raw),
            ExpiresAt = DateTime.UtcNow.AddDays(JwtHelper.RefreshDays),
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        return new AuthResponse
        {
            AccessToken = _jwt.CreateAccessToken(user.Id, user.Username, user.Role),
            RefreshToken = raw,
            User = ToDto(user)
        };
    }

    private async Task RevokeChainAsync(int userId)
    {
        var actives = await _db.RefreshTokens
            .Where(r => r.UserId == userId && r.RevokedAt == null).ToListAsync();
        foreach (var r in actives) r.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }
}
