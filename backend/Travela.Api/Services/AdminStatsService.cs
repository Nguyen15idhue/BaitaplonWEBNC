using Microsoft.EntityFrameworkCore;
using Travela.Api.Data;
using Travela.Api.DTOs.Common;

namespace Travela.Api.Services;

// Aggregate dashboard ở DB (C07/A5/M09): 1-2 query GROUP BY, không kéo page về FE.
public class AdminStatsService
{
    private readonly TravelaDbContext _db;

    public AdminStatsService(TravelaDbContext db)
    {
        _db = db;
    }

    public async Task<AdminStatsDto> GetAsync()
    {
        var usersTotal = await _db.Users.CountAsync();
        var toursTotal = await _db.Tours.CountAsync();
        var bookingsTotal = await _db.Bookings.CountAsync();
        var revenue = await _db.Checkouts.Where(c => c.Status == "Paid").SumAsync(c => (decimal?)c.Amount) ?? 0;
        var byStatus = await _db.Bookings.GroupBy(b => b.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() }).ToListAsync();
        var top = await _db.Bookings.Where(b => b.Status != "Cancelled")
            .GroupBy(b => new { b.TourId, TourName = b.Tour!.TourName })
            .Select(g => new TopTourDto { TourId = g.Key.TourId, TourName = g.Key.TourName, Sold = g.Sum(x => x.Quantity) })
            .OrderByDescending(x => x.Sold).Take(5).ToListAsync();
        return new AdminStatsDto
        {
            UsersTotal = usersTotal,
            ToursTotal = toursTotal,
            BookingsTotal = bookingsTotal,
            RevenuePaid = revenue,
            BookingsByStatus = byStatus.ToDictionary(x => x.Status, x => x.Count),
            TopTours = top
        };
    }
}
