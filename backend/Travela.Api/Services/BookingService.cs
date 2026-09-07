using System.Data;
using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Travela.Api.Data;
using Travela.Api.DTOs.Booking;
using Travela.Api.DTOs.Common;
using Travela.Api.Helpers;
using Travela.Api.Middleware;
using Travela.Api.Models;

namespace Travela.Api.Services;

// BookingService: tạo booking + checkout trong 1 transaction Serializable (chống oversell),
// state machine tracking, amount do server tính. Mock payment luôn Paid ở V1.
public class BookingService
{
    private readonly TravelaDbContext _db;
    private readonly AuditLogService _audit;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    private static readonly Dictionary<string, string[]> Transitions = new()
    {
        ["PendingPayment"] = ["Paid", "Cancelled"],
        ["Paid"] = ["Confirmed", "Cancelled"],
        ["Confirmed"] = ["Ongoing", "Cancelled"],
        ["Ongoing"] = ["Completed", "Cancelled"],
        ["Completed"] = [],
        ["Cancelled"] = [],
    };

    public BookingService(TravelaDbContext db, AuditLogService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<BookingDto> CreateAsync(CreateBookingRequest req, int userId, string username)
    {
        if (req.Quantity <= 0)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Số lượng phải lớn hơn 0.");
        if (req.PaymentMethod is not ("Mock" or "Card" or "Transfer"))
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Phương thức thanh toán không hợp lệ.");

        // Retry khi deadlock (MySQL 1213/1205) dưới tải đồng thời: đọc lại số chỗ rồi thử lại.
        // Kẻ thua sau retry sẽ thấy hết chỗ và nhận 409, không bao giờ 500.
        // Lưu ý: EF bọc DbUpdateException trong InvalidOperationException nên phải bóc inner.
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                return await TryCreateAsync(req, userId, username);
            }
            catch (Exception ex) when (IsDeadlock(ex) && attempt < 3)
            {
                _db.ChangeTracker.Clear();
                await Task.Delay(50 * attempt);
            }
        }
    }

    private static bool IsDeadlock(Exception ex)
    {
        for (var e = ex; e is not null; e = e.InnerException)
        {
            if (e is MySqlConnector.MySqlException mysql && (mysql.Number == 1213 || mysql.Number == 1205))
                return true;
        }
        return false;
    }

    private async Task<BookingDto> TryCreateAsync(CreateBookingRequest req, int userId, string username)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            var tour = await _db.Tours.Include(t => t.Prices).FirstOrDefaultAsync(t => t.Id == req.TourId)
                ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy tour.");
            if (tour.Status != "Published")
                throw new AppException(HttpStatusCode.BadRequest, "TOUR_NOT_AVAILABLE", "Tour chưa mở bán.");

            var booked = await _db.Bookings
                .Where(b => b.TourId == req.TourId && b.Status != "Cancelled" && b.Status != "Completed")
                .SumAsync(b => (int?)b.Quantity) ?? 0;
            if (tour.MaxSeats - booked < req.Quantity)
                throw new AppException(HttpStatusCode.Conflict, "NOT_ENOUGH_SEATS", "Tour đã hết chỗ.");

            var priceFrom = EffectiveMin(tour.Prices, DateTime.UtcNow);
            var now = DateTime.UtcNow;
            var booking = new Booking
            {
                UserId = userId, TourId = tour.Id, BookingDate = now, Quantity = req.Quantity,
                Status = "PendingPayment", CreatedAt = now,
                TrackingTrace = JsonSerializer.Serialize(
                    new List<TrackingStepDto> { new() { Status = "PendingPayment", At = now, By = username, Note = "Tạo đơn" } }, JsonOpts)
            };
            _db.Bookings.Add(booking);
            await _db.SaveChangesAsync();

            var checkout = new Checkout
            {
                BookingId = booking.Id, PaymentMethod = req.PaymentMethod,
                Amount = priceFrom * req.Quantity, Status = "Pending",
                TransactionRef = $"MOCK-{booking.Id}-{Guid.NewGuid():N}"[..20], CreatedAt = now
            };
            _db.Checkouts.Add(checkout);
            await _db.SaveChangesAsync();

            // Mock payment V1: luôn thành công -> cả 2 sang Paid trong cùng transaction.
            booking.Status = "Paid";
            checkout.Status = "Paid";
            booking.TrackingTrace = JsonSerializer.Serialize(
                new List<TrackingStepDto>
                {
                    new() { Status = "PendingPayment", At = now, By = username, Note = "Tạo đơn" },
                    new() { Status = "Paid", At = now, By = "system", Note = "Thanh toán mock thành công" },
                }, JsonOpts);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            await _audit.LogAsync(userId, "Booking.Create", "Booking", booking.Id, null, $"Tour:{tour.Id}x{req.Quantity}");
            return await GetAsync(booking.Id, userId, isAdmin: false, bypassOwner: true);
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task<PagedResult<BookingDto>> ListAsync(int userId, bool isAdmin, string? status, int page, int pageSize)
    {
        (page, pageSize) = PaginationHelper.Normalize(page, pageSize);
        var q = _db.Bookings.AsNoTracking()
            .Include(b => b.Tour).Include(b => b.User).Include(b => b.Checkout).AsQueryable();
        if (!isAdmin) q = q.Where(b => b.UserId == userId);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(b => b.Status == status);
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(b => b.Id).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return PaginationHelper.ToPagedResult(items.Select(ToDto).ToList(), total, page, pageSize);
    }

    public async Task<BookingDto> GetAsync(int id, int userId, bool isAdmin, bool bypassOwner = false)
    {
        var b = await _db.Bookings.AsNoTracking()
            .Include(x => x.Tour).Include(x => x.User).Include(x => x.Checkout)
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy booking.");
        if (!bypassOwner && !isAdmin && b.UserId != userId)
            throw new AppException(HttpStatusCode.Forbidden, "FORBIDDEN", "Bạn không có quyền xem đơn này.");
        return ToDto(b);
    }

    public async Task<BookingDto> UpdateStatusAsync(int id, string status, string note, int actorId, string actorName, bool isAdmin)
    {
        var b = await _db.Bookings.Include(x => x.Tour).Include(x => x.User).Include(x => x.Checkout)
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy booking.");

        // Sai thứ tự báo 400 trước, kể cả customer (đúng checklist B4).
        if (!Transitions.TryGetValue(b.Status, out var allowed) || !allowed.Contains(status))
            throw new AppException(HttpStatusCode.BadRequest, "INVALID_STATUS_TRANSITION",
                $"Không thể chuyển từ {b.Status} sang {status}.");

        // Customer chỉ được cancel đơn của chính mình.
        if (!isAdmin)
        {
            if (b.UserId != actorId)
                throw new AppException(HttpStatusCode.Forbidden, "FORBIDDEN", "Bạn không có quyền sửa đơn này.");
            if (status != "Cancelled")
                throw new AppException(HttpStatusCode.Forbidden, "FORBIDDEN", "Bạn chỉ được hủy đơn của mình.");
        }

        var old = b.Status;
        b.Status = status;
        var steps = JsonSerializer.Deserialize<List<TrackingStepDto>>(b.TrackingTrace, JsonOpts) ?? new();
        steps.Add(new TrackingStepDto { Status = status, At = DateTime.UtcNow, By = actorName, Note = note ?? string.Empty });
        b.TrackingTrace = JsonSerializer.Serialize(steps, JsonOpts);
        await _db.SaveChangesAsync();
        await _audit.LogAsync(actorId, "Booking.Status", "Booking", id, old, status);
        return await GetAsync(id, actorId, isAdmin, bypassOwner: true);
    }

    public async Task<BookingDto> CancelAsync(int id, int userId, string username)
    {
        var b = await _db.Bookings.FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy booking.");
        if (b.UserId != userId)
            throw new AppException(HttpStatusCode.Forbidden, "FORBIDDEN", "Bạn không có quyền hủy đơn này.");
        if (b.Status is "Completed" or "Cancelled")
            throw new AppException(HttpStatusCode.BadRequest, "INVALID_STATUS_TRANSITION", "Đơn đã kết thúc, không thể hủy.");
        return await UpdateStatusAsync(id, "Cancelled", "Khách hủy", userId, username, isAdmin: false);
    }

    private static decimal EffectiveMin(ICollection<Price> prices, DateTime now)
    {
        var effective = prices.Where(p => p.EffectiveDate <= now)
            .GroupBy(p => p.SourceName)
            .Select(g => g.OrderByDescending(p => p.EffectiveDate).First())
            .ToList();
        return effective.Count == 0 ? 0 : effective.Min(p => p.PriceValue);
    }

    private static BookingDto ToDto(Booking b)
    {
        var steps = new List<TrackingStepDto>();
        try { steps = JsonSerializer.Deserialize<List<TrackingStepDto>>(b.TrackingTrace, JsonOpts) ?? new(); } catch { }
        return new BookingDto
        {
            Id = b.Id, TourId = b.TourId, TourName = b.Tour?.TourName ?? string.Empty,
            UserId = b.UserId, Username = b.User?.Username ?? string.Empty,
            Quantity = b.Quantity, Status = b.Status, BookingDate = b.BookingDate,
            Tracking = steps,
            Checkout = b.Checkout is null ? null : new CheckoutDto
            {
                Id = b.Checkout.Id, Amount = b.Checkout.Amount, Status = b.Checkout.Status,
                PaymentMethod = b.Checkout.PaymentMethod, TransactionRef = b.Checkout.TransactionRef
            }
        };
    }
}
