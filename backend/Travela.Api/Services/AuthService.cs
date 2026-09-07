using System.Net;
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
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Thiếu username, email hoặc password.");
        if (req.Password.Length < 6)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Password tối thiểu 6 ký tự.");

        var exists = await _db.Users.AnyAsync(u => u.Username == req.Username || u.Email == req.Email);
        if (exists)
            throw new AppException(HttpStatusCode.Conflict, "DUPLICATE_USER", "Username hoặc email đã tồn tại.");

        var user = new User
        {
            Username = req.Username.Trim(),
            Email = req.Email.Trim(),
            PasswordHash = PasswordHasher.Hash(req.Password),
            Role = "Customer",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return ToDto(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Username == req.UsernameOrEmail || u.Email == req.UsernameOrEmail);
        if (user is null || !PasswordHasher.Verify(req.Password, user.PasswordHash))
            throw new AppException(HttpStatusCode.Unauthorized, "INVALID_CREDENTIALS", "Sai tài khoản hoặc mật khẩu.");
        if (user.Status == "Locked")
            throw new AppException(HttpStatusCode.Unauthorized, "INVALID_CREDENTIALS", "Tài khoản đã bị khóa.");

        return await IssueTokensAsync(user);
    }

    public async Task<AuthResponse> RefreshAsync(string raw)
    {
        var hash = JwtHelper.HashRefresh(raw);
        var stored = await _db.RefreshTokens.Include(r => r.User)
            .FirstOrDefaultAsync(r => r.TokenHash == hash);

        // Token lạ hoặc đã thu hồi: thu hồi cả chuỗi để chống reuse.
        if (stored is null || stored.RevokedAt is not null)
        {
            if (stored is not null)
                await RevokeChainAsync(stored.UserId);
            throw new AppException(HttpStatusCode.Unauthorized, "INVALID_REFRESH", "Refresh token không hợp lệ.");
        }
        if (stored.ExpiresAt <= DateTime.UtcNow)
            throw new AppException(HttpStatusCode.Unauthorized, "INVALID_REFRESH", "Refresh token đã hết hạn.");
        if (stored.User is null || stored.User.Status == "Locked")
            throw new AppException(HttpStatusCode.Unauthorized, "INVALID_CREDENTIALS", "Tài khoản đã bị khóa.");

        // Xoay vòng: thu hồi cũ, cấp cặp mới.
        var next = await IssueTokensAsync(stored.User);
        stored.RevokedAt = DateTime.UtcNow;
        stored.ReplacedBy = JwtHelper.HashRefresh(next.RefreshToken);
        await _db.SaveChangesAsync();
        return next;
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

    public async Task<UserDto> MeAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new AppException(HttpStatusCode.Unauthorized, "UNAUTHORIZED", "Phiên không hợp lệ.");
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
