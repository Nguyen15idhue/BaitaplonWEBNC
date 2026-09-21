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
// state machine tracking, amount do server tính. V1 chỉ nhận Mock (C04).
public class BookingService
{
    private readonly TravelaDbContext _db;
    private readonly AuditLogService _audit;
    private readonly ILogger<BookingService> _logger;

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

    public BookingService(TravelaDbContext db, AuditLogService audit, ILogger<BookingService> logger)
    {
        _db = db;
        _audit = audit;
        _logger = logger;
    }

    public async Task<BookingDto> CreateAsync(CreateBookingRequest req, int userId, string username, string? idempotencyKey = null)
    {
        if (req is null)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Thiếu dữ liệu đặt tour.");
        // Số lượng kiểm tra theo breakdown (hoặc Quantity legacy) trong TryCreateAsync.
        // C04: V1 chỉ Mock, chặn Card/Transfer tạo Paid giả.
        if (req.PaymentMethod != "Mock")
            throw new AppException(HttpStatusCode.UnprocessableEntity, "UNSUPPORTED_PAYMENT_METHOD",
                "V1 chỉ hỗ trợ thanh toán Mock.");
        // H08: key optional, chuẩn hóa để lookup ổn định. Dài quá -> 400, không cắt ngầm.
        var trimmedKey = string.IsNullOrWhiteSpace(idempotencyKey) ? null : idempotencyKey.Trim();
        if (trimmedKey is not null && trimmedKey.Length > 200)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Idempotency-Key tối đa 200 ký tự.");
        var key = trimmedKey;

        for (var attempt = 1; ; attempt++)
        {
            try
            {
                return await TryCreateAsync(req, userId, username, key);
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

    private static bool IsDuplicate(Exception ex)
    {
        for (var e = ex; e is not null; e = e.InnerException)
        {
            if (e is MySqlConnector.MySqlException mysql && mysql.Number == 1062)
                return true;
        }
        return false;
    }

    private async Task<BookingDto> TryCreateAsync(CreateBookingRequest req, int userId, string username, string? idemKey)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            // H08: key đã dùng -> trả booking cũ, không tạo duplicate.
            if (idemKey is not null)
            {
                var dup = await _db.IdempotencyKeys.AsNoTracking()
                    .FirstOrDefaultAsync(k => k.UserId == userId && k.Key == idemKey);
                if (dup is not null)
                {
                    await tx.RollbackAsync();
                    return await GetAsync(dup.BookingId, userId, isAdmin: false, bypassOwner: true);
                }
            }

            var tour = await _db.Tours.Include(t => t.Prices).FirstOrDefaultAsync(t => t.Id == req.TourId)
                ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy tour.");
            if (tour.Status != "Published")
                throw new AppException(HttpStatusCode.BadRequest, "TOUR_NOT_AVAILABLE", "Tour chưa mở bán.");
            // A4: tour đã qua EndDate thì không đặt được.
            if (tour.EndDate.HasValue && tour.EndDate.Value < DateTime.UtcNow)
                throw new AppException(HttpStatusCode.BadRequest, "TOUR_ENDED", "Tour đã kết thúc, không thể đặt.");

            // C06/A1: tour không có giá hiệu lực -> 422, không tạo checkout 0đ.
            var priceFrom = PricingHelper.EffectiveMin(tour.Prices, DateTime.UtcNow);
            if (priceFrom <= 0)
                throw new AppException(HttpStatusCode.UnprocessableEntity, "PRICE_NOT_AVAILABLE",
                    "Tour chưa có giá bán, vui lòng liên hệ.");

            // F2 redesign: tính chỗ và tiền từ breakdown loại khách; fallback Quantity legacy.
            var adultQty = Math.Max(0, req.AdultQty);
            var childQty = Math.Max(0, req.ChildQty);
            var supplementQty = Math.Max(0, req.SupplementQty);
            var seatQty = adultQty + childQty;
            var useBreakdown = seatQty > 0;
            if (!useBreakdown) seatQty = req.Quantity;
            if (seatQty <= 0)
                throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Số lượng hành khách phải lớn hơn 0.");

            // M01/A4 chốt lifetime capacity: Completed vẫn chiếm chỗ, chỉ trừ Cancelled.
            var booked = await _db.Bookings
                .Where(b => b.TourId == req.TourId && b.Status != "Cancelled")
                .SumAsync(b => (int?)b.Quantity) ?? 0;
            if (tour.MaxSeats - booked < seatQty)
                throw new AppException(HttpStatusCode.Conflict, "NOT_ENOUGH_SEATS", "Tour đã hết chỗ.");

            // Server tính tiền từ giá hiệu lực theo từng nguồn (không nhận giá từ client).
            decimal amount;
            if (useBreakdown)
            {
                var adultPrice = PricingHelper.EffectiveForSource(tour.Prices, DateTime.UtcNow, "Người lớn");
                if (adultPrice <= 0) adultPrice = priceFrom;
                var childPrice = PricingHelper.EffectiveForSource(tour.Prices, DateTime.UtcNow, "Trẻ em");
                if (childPrice <= 0) childPrice = adultPrice;
                var supplementPrice = PricingHelper.EffectiveForSource(tour.Prices, DateTime.UtcNow, "Phụ thu", "Phụ thu phòng");
                amount = adultPrice * adultQty + childPrice * childQty + supplementPrice * supplementQty;
            }
            else
            {
                amount = priceFrom * seatQty;
            }
            if (amount <= 0)
                throw new AppException(HttpStatusCode.UnprocessableEntity, "PRICE_NOT_AVAILABLE",
                    "Tour chưa có giá bán, vui lòng liên hệ.");

            var now = DateTime.UtcNow;
            var booking = new Booking
            {
                UserId = userId, TourId = tour.Id, BookingDate = now, Quantity = seatQty,
                Status = "PendingPayment", CreatedAt = now,
                ContactName = Norm(req.ContactName), ContactEmail = Norm(req.ContactEmail),
                ContactPhone = Norm(req.ContactPhone), Note = Norm(req.Note),
                TrackingTrace = JsonSerializer.Serialize(
                    new List<TrackingStepDto> { new() { Status = "PendingPayment", At = now, By = username, Note = "Tạo đơn" } }, JsonOpts)
            };
            _db.Bookings.Add(booking);
            await _db.SaveChangesAsync();

            var checkout = new Checkout
            {
                BookingId = booking.Id, PaymentMethod = req.PaymentMethod,
                Amount = amount, Status = "Pending",
                // N06: giữ full ref (không cắt 20 ký tự), entropy đủ, format thống nhất.
                TransactionRef = $"MOCK-{booking.Id}-{Guid.NewGuid():N}", CreatedAt = now
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
            if (idemKey is not null)
                _db.IdempotencyKeys.Add(new IdempotencyKey
                {
                    UserId = userId, Key = idemKey, BookingId = booking.Id, CreatedAt = now
                });
            // H12: audit cùng transaction.
            _audit.Add(userId, "Booking.Create", "Booking", booking.Id, null, $"Tour:{tour.Id}x{req.Quantity}");
            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (idemKey is not null && IsDuplicate(ex))
            {
                // H08 race: 2 request cùng key — request thua trả booking của người thắng.
                await tx.RollbackAsync();
                _db.ChangeTracker.Clear();
                var winner = await _db.IdempotencyKeys.AsNoTracking()
                    .FirstOrDefaultAsync(k => k.UserId == userId && k.Key == idemKey);
                if (winner is not null)
                    return await GetAsync(winner.BookingId, userId, isAdmin: false, bypassOwner: true);
                throw;
            }
            await tx.CommitAsync();

            return await GetAsync(booking.Id, userId, isAdmin: false, bypassOwner: true);
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    // A2: thanh toán sau cho đơn PendingPayment kẹt (chủ đơn hoặc Admin).
    public async Task<BookingDto> PayAsync(int id, int actorId, string actorName, bool isAdmin)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var b = await _db.Bookings.Include(x => x.Checkout).FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy booking.");
            if (!isAdmin && b.UserId != actorId)
                throw new AppException(HttpStatusCode.Forbidden, "FORBIDDEN", "Bạn không có quyền trả đơn này.");
            if (b.Status != "PendingPayment")
                throw new AppException(HttpStatusCode.BadRequest, "INVALID_STATUS_TRANSITION",
                    $"Chỉ đơn chờ thanh toán mới trả được (hiện tại: {b.Status}).");
            b.Status = "Paid";
            if (b.Checkout is not null) b.Checkout.Status = "Paid";
            AppendStep(b, "Paid", actorName, "Thanh toán bổ sung");
            b.Version++;
            // H12: audit cùng transaction — lỗi audit thì rollback cả đổi trạng thái.
            _audit.Add(actorId, "Booking.Pay", "Booking", id, "PendingPayment", "Paid");
            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new AppException(HttpStatusCode.Conflict, "CONCURRENT_UPDATE",
                    "Đơn vừa được người khác cập nhật, vui lòng tải lại.");
            }
            await tx.CommitAsync();
            return await GetAsync(id, actorId, isAdmin, bypassOwner: true);
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
        // N03: projection, không Include User (tránh lôi PasswordHash vào RAM).
        var q = _db.Bookings.AsNoTracking().AsQueryable();
        if (!isAdmin) q = q.Where(b => b.UserId == userId);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(b => b.Status == status);
        var total = await q.CountAsync();
        var rows = await q.OrderByDescending(b => b.Id).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(b => new
            {
                b.Id, b.TourId, b.UserId, b.Quantity, b.Status, b.BookingDate, b.TrackingTrace,
                b.ContactName, b.ContactEmail, b.ContactPhone, b.Note,
                TourName = b.Tour!.TourName, Username = b.User!.Username,
                Checkout = b.Checkout == null ? null : new
                {
                    b.Checkout.Id, b.Checkout.Amount, b.Checkout.Status,
                    b.Checkout.PaymentMethod, b.Checkout.TransactionRef
                }
            }).ToListAsync();
        var items = rows.Select(r => new BookingDto
        {
            Id = r.Id, TourId = r.TourId, TourName = r.TourName ?? string.Empty,
            UserId = r.UserId, Username = r.Username ?? string.Empty,
            Quantity = r.Quantity, Status = r.Status, BookingDate = r.BookingDate,
            ContactName = r.ContactName, ContactEmail = r.ContactEmail,
            ContactPhone = r.ContactPhone, Note = r.Note,
            Tracking = ParseSteps(r.TrackingTrace),
            Checkout = r.Checkout is null ? null : new CheckoutDto
            {
                Id = r.Checkout.Id, Amount = r.Checkout.Amount, Status = r.Checkout.Status,
                PaymentMethod = r.Checkout.PaymentMethod, TransactionRef = r.Checkout.TransactionRef
            }
        }).ToList();
        return PaginationHelper.ToPagedResult(items, total, page, pageSize);
    }

    public async Task<BookingDto> GetAsync(int id, int userId, bool isAdmin, bool bypassOwner = false)
    {
        var b = await _db.Bookings.AsNoTracking()
            .Select(x => new
            {
                x.Id, x.TourId, x.UserId, x.Quantity, x.Status, x.BookingDate, x.TrackingTrace,
                x.ContactName, x.ContactEmail, x.ContactPhone, x.Note,
                TourName = x.Tour!.TourName, Username = x.User!.Username,
                Checkout = x.Checkout == null ? null : new
                {
                    x.Checkout.Id, x.Checkout.Amount, x.Checkout.Status,
                    x.Checkout.PaymentMethod, x.Checkout.TransactionRef
                }
            }).FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy booking.");
        if (!bypassOwner && !isAdmin && b.UserId != userId)
            throw new AppException(HttpStatusCode.Forbidden, "FORBIDDEN", "Bạn không có quyền xem đơn này.");
        return new BookingDto
        {
            Id = b.Id, TourId = b.TourId, TourName = b.TourName ?? string.Empty,
            UserId = b.UserId, Username = b.Username ?? string.Empty,
            Quantity = b.Quantity, Status = b.Status, BookingDate = b.BookingDate,
            ContactName = b.ContactName, ContactEmail = b.ContactEmail,
            ContactPhone = b.ContactPhone, Note = b.Note,
            Tracking = ParseSteps(b.TrackingTrace),
            Checkout = b.Checkout is null ? null : new CheckoutDto
            {
                Id = b.Checkout.Id, Amount = b.Checkout.Amount, Status = b.Checkout.Status,
                PaymentMethod = b.Checkout.PaymentMethod, TransactionRef = b.Checkout.TransactionRef
            }
        };
    }

    public async Task<BookingDto> UpdateStatusAsync(int id, string status, string note, int actorId, string actorName, bool isAdmin)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var b = await _db.Bookings.Include(x => x.Checkout)
                .FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy booking.");

            if (!Transitions.TryGetValue(b.Status, out var allowed) || !allowed.Contains(status))
                throw new AppException(HttpStatusCode.BadRequest, "INVALID_STATUS_TRANSITION",
                    $"Không thể chuyển từ {b.Status} sang {status}.");

            // B5: /status chỉ Admin; customer dùng /cancel.
            if (!isAdmin)
            {
                if (b.UserId != actorId)
                    throw new AppException(HttpStatusCode.Forbidden, "FORBIDDEN", "Bạn không có quyền sửa đơn này.");
                if (status != "Cancelled")
                    throw new AppException(HttpStatusCode.Forbidden, "FORBIDDEN", "Bạn chỉ được hủy đơn của mình qua /cancel.");
                // C05: customer chỉ hủy trong 24h từ BookingDate.
                if (DateTime.UtcNow > b.BookingDate.AddHours(24))
                    throw new AppException(HttpStatusCode.BadRequest, "CANCELLATION_WINDOW_EXPIRED",
                        "Đã quá 24 giờ, bạn không thể tự hủy. Vui lòng liên hệ admin.");
            }

            var old = b.Status;
            b.Status = status;
            // A3: hủy -> checkout Refunded; complete giữ Paid.
            if (b.Checkout is not null && status == "Cancelled")
                b.Checkout.Status = "Refunded";
            AppendStep(b, status, actorName, note ?? string.Empty);
            b.Version++; // M12: optimistic concurrency — 2 admin cùng sửa thì 1 người 409.
            // H12: audit cùng transaction — lỗi audit thì rollback cả đổi trạng thái.
            _audit.Add(actorId, "Booking.Status", "Booking", id, old, status);
            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new AppException(HttpStatusCode.Conflict, "CONCURRENT_UPDATE",
                    "Đơn vừa được người khác cập nhật, vui lòng tải lại.");
            }
            await tx.CommitAsync();
            return await GetAsync(id, actorId, isAdmin, bypassOwner: true);
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task<BookingDto> CancelAsync(int id, int userId, string username)
    {
        var b = await _db.Bookings.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy booking.");
        if (b.UserId != userId)
            throw new AppException(HttpStatusCode.Forbidden, "FORBIDDEN", "Bạn không có quyền hủy đơn này.");
        if (b.Status is "Completed" or "Cancelled")
            throw new AppException(HttpStatusCode.BadRequest, "INVALID_STATUS_TRANSITION", "Đơn đã kết thúc, không thể hủy.");
        // C05: cùng cửa sổ 24h cho cả /cancel.
        if (DateTime.UtcNow > b.BookingDate.AddHours(24))
            throw new AppException(HttpStatusCode.BadRequest, "CANCELLATION_WINDOW_EXPIRED",
                "Đã quá 24 giờ, bạn không thể tự hủy. Vui lòng liên hệ admin.");
        return await UpdateStatusAsync(id, "Cancelled", "Khách hủy", userId, username, isAdmin: false);
    }

    private void AppendStep(Booking b, string status, string by, string note)
    {
        var steps = ParseSteps(b.TrackingTrace);
        steps.Add(new TrackingStepDto { Status = status, At = DateTime.UtcNow, By = by, Note = note });
        b.TrackingTrace = JsonSerializer.Serialize(steps, JsonOpts);
    }

    private List<TrackingStepDto> ParseSteps(string? trace)
    {
        if (string.IsNullOrWhiteSpace(trace)) return new();
        try
        {
            return JsonSerializer.Deserialize<List<TrackingStepDto>>(trace, JsonOpts) ?? new();
        }
        catch (JsonException ex)
        {
            // M07: không nuốt lỗi parse tracking — log warning để phát hiện corrupt.
            _logger.LogWarning(ex, "TrackingTrace corrupt ở booking");
            return new();
        }
    }

    private static string? Norm(string? s)
        => string.IsNullOrWhiteSpace(s) ? null : s.Trim();
}
