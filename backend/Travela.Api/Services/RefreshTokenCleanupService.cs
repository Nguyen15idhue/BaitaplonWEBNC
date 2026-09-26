using Microsoft.EntityFrameworkCore;
using Travela.Api.Data;

namespace Travela.Api.Services;

// BE-03/M06: dọn refresh token hết hạn/đã thu hồi quá lâu (retention 30 ngày), chạy mỗi 24h.
public class RefreshTokenCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RefreshTokenCleanupService> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromHours(24);
    private static readonly TimeSpan Retention = TimeSpan.FromDays(30);

    public RefreshTokenCleanupService(IServiceScopeFactory scopeFactory, ILogger<RefreshTokenCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<TravelaDbContext>();
                var cutoff = DateTime.UtcNow - Retention;
                var removed = await db.RefreshTokens
                    .Where(r => r.ExpiresAt < cutoff || (r.RevokedAt != null && r.RevokedAt < cutoff))
                    .ExecuteDeleteAsync(stoppingToken);
                if (removed > 0)
                    _logger.LogInformation("Đã dọn {Count} refresh token cũ.", removed);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Dọn refresh token thất bại, thử lại sau.");
            }

            try { await Task.Delay(Interval, stoppingToken); }
            catch (TaskCanceledException) { break; }
        }
    }
}
