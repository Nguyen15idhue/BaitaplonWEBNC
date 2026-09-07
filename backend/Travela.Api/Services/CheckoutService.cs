using System.Net;
using Microsoft.EntityFrameworkCore;
using Travela.Api.Data;
using Travela.Api.DTOs.Booking;
using Travela.Api.Middleware;

namespace Travela.Api.Services;

// CheckoutService: chỉ tra cứu checkout của chính mình hoặc Admin (không tạo lẻ).
public class CheckoutService
{
    private readonly TravelaDbContext _db;

    public CheckoutService(TravelaDbContext db)
    {
        _db = db;
    }

    public async Task<CheckoutDto> GetAsync(int id, int userId, bool isAdmin)
    {
        var c = await _db.Checkouts.AsNoTracking().Include(x => x.Booking)
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy checkout.");
        if (!isAdmin && (c.Booking is null || c.Booking.UserId != userId))
            throw new AppException(HttpStatusCode.Forbidden, "FORBIDDEN", "Bạn không có quyền xem checkout này.");
        return new CheckoutDto
        {
            Id = c.Id, Amount = c.Amount, Status = c.Status,
            PaymentMethod = c.PaymentMethod, TransactionRef = c.TransactionRef
        };
    }
}
