using Microsoft.EntityFrameworkCore;
using Travela.Api.Data;

namespace Travela.Api.Services;

// D6: tự động chuyển trạng thái theo ngày (chỉ từ Confirmed) + ẩn tour đã kết thúc.
// Chạy 1 lần lúc khởi động rồi lặp mỗi Lifecycle:IntervalMinutes (mặc định 30).
public class BookingLifecycleService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BookingLifecycleService> _logger;
    private readonly TimeSpan _interval;

    public BookingLifecycleService(
        IServiceScopeFactory scopeFactory,
        ILogger<BookingLifecycleService> logger,
        IConfiguration configuration)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        var minutes = configuration.GetValue<int?>("Lifecycle:IntervalMinutes") ?? 30;
        _interval = TimeSpan.FromMinutes(Math.Max(1, minutes));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunOnceAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Lifecycle job thất bại, thử lại sau.");
            }

            try { await Task.Delay(_interval, stoppingToken); }
            catch (TaskCanceledException) { break; }
        }
    }

    private async Task RunOnceAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TravelaDbContext>();
        var audit = scope.ServiceProvider.GetRequiredService<AuditLogService>();
        var now = DateTime.UtcNow;

        // 1) Tour Published đã qua EndDate -> Hidden.
        var endedTours = await db.Tours
            .Where(t => t.Status == "Published" && t.EndDate != null && t.EndDate < now)
            .ToListAsync(ct);
        foreach (var t in endedTours)
        {
            var old = t.Status;
            t.Status = "Hidden";
            audit.Add(null, "Tour.Update", "Tour", t.Id, old, "Hidden");
        }

        // 2) Booking Confirmed -> Ongoing (tới mốc khởi hành); Ongoing -> Completed (tới mốc kết thúc).
        var candidates = await db.Bookings
            .Include(b => b.Tour)
            .Where(b => b.Status == "Confirmed" || b.Status == "Ongoing")
            .ToListAsync(ct);
        var changed = 0;
        foreach (var b in candidates)
        {
            var startAt = b.DepartureDate ?? b.Tour!.StartDate;
            var endAt = b.Tour!.EndDate;

            if (b.Status == "Confirmed" && startAt.HasValue && startAt.Value <= now)
            {
                var old = b.Status;
                b.Status = "Ongoing";
                BookingStateMachine.AppendStep(b, "Ongoing", "system", "Tự động: tới ngày khởi hành", _logger);
                b.Version++;
                audit.Add(null, "Booking.Status", "Booking", b.Id, old, "Ongoing");
                changed++;
            }
            if (b.Status == "Ongoing" && endAt.HasValue && endAt.Value <= now)
            {
                var old = b.Status;
                b.Status = "Completed";
                BookingStateMachine.AppendStep(b, "Completed", "system", "Tự động: tour đã kết thúc", _logger);
                b.Version++;
                audit.Add(null, "Booking.Status", "Booking", b.Id, old, "Completed");
                changed++;
            }
        }

        if (endedTours.Count == 0 && changed == 0) return;

        try
        {
            await db.SaveChangesAsync(ct);
            _logger.LogInformation("Lifecycle: ẩn {Tours} tour, đổi {Bookings} trạng thái booking.", endedTours.Count, changed);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            // Có người vừa sửa cùng bản ghi -> bỏ vòng này, vòng sau xử lý lại.
            _logger.LogWarning(ex, "Lifecycle job gặp concurrency, bỏ qua vòng này.");
        }
    }
}
