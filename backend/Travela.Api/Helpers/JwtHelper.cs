using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Travela.Api.Helpers;

// JWT access 15p (payload sub/username/role) + refresh raw 64 ký tự.
// Refresh chỉ lưu hash SHA256 trong DB, bản raw trả client 1 lần duy nhất.
public class JwtHelper
{
    public const int AccessMinutes = 15;
    public const int RefreshDays = 7;

    private readonly string _secret;

    public JwtHelper(IConfiguration config)
    {
        _secret = config["JWT_SECRET"]
            ?? config["Jwt:Secret"]
            ?? "dev-only-secret-change-me-min-32-chars!!";
    }

    public string CreateAccessToken(int userId, string username, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim("username", username),
            new Claim(ClaimTypes.Role, role),
        };
        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(AccessMinutes),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static string CreateRefreshRaw()
    {
        return Convert.ToHexString(RandomNumberGenerator.GetBytes(48));
    }

    public static string HashRefresh(string raw)
    {
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)));
    }
}
