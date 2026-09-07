using Travela.Api.Data;
using Travela.Api.Models;

namespace Travela.Api.Data;

// Seed B1: chạy 1 lần khi DB trống (sau Migrate). Mật khẩu hash BCrypt tại lúc seed.
// 3 users, 10 destinations, 12 tours, mỗi tour 2-3 prices + 2-3 images, 5 bookings kèm checkout.
public static class DbSeeder
{
    public static void Seed(TravelaDbContext db)
    {
        if (db.Users.Any()) return;

        var now = DateTime.UtcNow;

        var admin = new User
        {
            Username = "admin", Email = "admin@travela.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            Role = "Admin", Status = "Active", CreatedAt = now
        };
        var cus1 = new User
        {
            Username = "customer1", Email = "customer1@travela.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer123!"),
            Role = "Customer", Status = "Active", CreatedAt = now
        };
        var cus2 = new User
        {
            Username = "customer2", Email = "customer2@travela.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer123!"),
            Role = "Customer", Status = "Active", CreatedAt = now
        };
        db.Users.AddRange(admin, cus1, cus2);
        db.SaveChanges();

        var destinations = new List<Destination>
        {
            new() { Name = "Hà Nội", RegionName = "Bắc", Description = "Thủ đô nghìn năm văn hiến." },
            new() { Name = "Hạ Long", RegionName = "Bắc", Description = "Vịnh di sản thế giới." },
            new() { Name = "Sa Pa", RegionName = "Bắc", Description = "Săn mây, ruộng bậc thang." },
            new() { Name = "Huế", RegionName = "Trung", Description = "Cố đô, nhã nhạc cung đình." },
            new() { Name = "Đà Nẵng", RegionName = "Trung", Description = "Thành phố đáng sống." },
            new() { Name = "Hội An", RegionName = "Trung", Description = "Phố cổ đèn lồng." },
            new() { Name = "Nha Trang", RegionName = "Trung", Description = "Biển xanh cát trắng." },
            new() { Name = "TP. Hồ Chí Minh", RegionName = "Nam", Description = "Sài Gòn năng động." },
            new() { Name = "Phú Quốc", RegionName = "Nam", Description = "Đảo ngọc." },
            new() { Name = "Cần Thơ", RegionName = "Nam", Description = "Miền Tây sông nước." },
        };
        db.Destinations.AddRange(destinations);
        db.SaveChanges();

        var tours = new List<Tour>
        {
            new() { DestinationId = destinations[0].Id, TourName = "Hà Nội 1 ngày: Phố cổ – Hồ Gươm", Description = "City tour Hà Nội.", MaxSeats = 40, Status = "Published", CreatedAt = now },
            new() { DestinationId = destinations[1].Id, TourName = "Vịnh Hạ Long 2N1Đ", Description = "Du thuyền vịnh Hạ Long.", MaxSeats = 30, Status = "Published", CreatedAt = now },
            new() { DestinationId = destinations[2].Id, TourName = "Sa Pa săn mây 3N2Đ", Description = "Fansipan, bản Cát Cát.", MaxSeats = 25, Status = "Published", CreatedAt = now },
            new() { DestinationId = destinations[3].Id, TourName = "Huế mộng mơ 2N1Đ", Description = "Đại Nội, lăng tẩm.", MaxSeats = 30, Status = "Published", CreatedAt = now },
            new() { DestinationId = destinations[4].Id, TourName = "Đà Nẵng – Bà Nà Hills 3N2Đ", Description = "Cầu Vàng, biển Mỹ Khê.", MaxSeats = 35, Status = "Published", CreatedAt = now },
            new() { DestinationId = destinations[5].Id, TourName = "Hội An đèn lồng 2N1Đ", Description = "Phố cổ, thả đèn hoa đăng.", MaxSeats = 30, Status = "Published", CreatedAt = now },
            new() { DestinationId = destinations[6].Id, TourName = "Nha Trang biển xanh 3N2Đ", Description = "Vinpearl, tour đảo.", MaxSeats = 40, Status = "Published", CreatedAt = now },
            new() { DestinationId = destinations[7].Id, TourName = "Sài Gòn về đêm", Description = "Bùi Viện, Bitexco.", MaxSeats = 40, Status = "Published", CreatedAt = now },
            new() { DestinationId = destinations[8].Id, TourName = "Phú Quốc 4N3Đ", Description = "VinWonders, Safari.", MaxSeats = 25, Status = "Published", CreatedAt = now },
            new() { DestinationId = destinations[9].Id, TourName = "Miền Tây sông nước 2N1Đ", Description = "Chợ nổi Cái Răng.", MaxSeats = 30, Status = "Published", CreatedAt = now },
            new() { DestinationId = destinations[4].Id, TourName = "Đà Lạt mộng mơ 3N2Đ (nháp)", Description = "Tour đang soạn.", MaxSeats = 20, Status = "Draft", CreatedAt = now },
            new() { DestinationId = destinations[8].Id, TourName = "Côn Đảo tâm linh 2N1Đ (ẩn)", Description = "Tour tạm ẩn.", MaxSeats = 15, Status = "Hidden", CreatedAt = now },
        };
        db.Tours.AddRange(tours);
        db.SaveChanges();

        var basePrices = new long[] { 890000, 2490000, 3290000, 1990000, 3990000, 1790000, 3590000, 990000, 5990000, 1590000, 2990000, 2190000 };
        for (var i = 0; i < tours.Count; i++)
        {
            db.Prices.Add(new Price
            {
                TourId = tours[i].Id, SourceName = "Website",
                PriceValue = basePrices[i], EffectiveDate = now.AddDays(-30), CreatedAt = now
            });
            db.Prices.Add(new Price
            {
                TourId = tours[i].Id, SourceName = "Đối tác",
                PriceValue = basePrices[i] + 200000, EffectiveDate = now.AddDays(-60), CreatedAt = now
            });
            if (i % 2 == 0)
            {
                db.Prices.Add(new Price
                {
                    TourId = tours[i].Id, SourceName = "Khuyến mãi",
                    PriceValue = basePrices[i] - 100000, EffectiveDate = now.AddDays(-7), CreatedAt = now
                });
            }
        }
        db.SaveChanges();

        for (var i = 0; i < tours.Count; i++)
        {
            var count = i % 2 == 0 ? 3 : 2;
            for (var j = 1; j <= count; j++)
            {
                db.Images.Add(new Image
                {
                    TourId = tours[i].Id,
                    ImageUrl = $"https://picsum.photos/seed/travela-{tours[i].Id}-{j}/800/600",
                    Caption = $"Ảnh {j} - {tours[i].TourName}",
                    SortOrder = j
                });
            }
        }
        db.SaveChanges();

        var bookings = new List<(int UserId, int TourIdx, int Qty, string Status, string[] Trace, string PayStatus)>
        {
            (cus1.Id, 0, 2, "PendingPayment", new[] { "PendingPayment" }, "Pending"),
            (cus1.Id, 1, 2, "Paid", new[] { "PendingPayment", "Paid" }, "Paid"),
            (cus2.Id, 4, 3, "Confirmed", new[] { "PendingPayment", "Paid", "Confirmed" }, "Paid"),
            (cus2.Id, 6, 2, "Ongoing", new[] { "PendingPayment", "Paid", "Confirmed", "Ongoing" }, "Paid"),
            (cus1.Id, 8, 2, "Completed", new[] { "PendingPayment", "Paid", "Confirmed", "Ongoing", "Completed" }, "Paid"),
        };
        foreach (var (userId, tourIdx, qty, status, trace, payStatus) in bookings)
        {
            var steps = string.Join(",", trace.Select((s, k) =>
                $"{{\"status\":\"{s}\",\"at\":\"{now.AddHours(-(trace.Length - k)):o}\",\"by\":\"seed\",\"note\":\"Seed B1\"}}"));
            var booking = new Booking
            {
                UserId = userId, TourId = tours[tourIdx].Id, BookingDate = now.AddDays(-2),
                Quantity = qty, Status = status, TrackingTrace = $"[{steps}]", CreatedAt = now
            };
            db.Bookings.Add(booking);
            db.SaveChanges();
            db.Checkouts.Add(new Checkout
            {
                BookingId = booking.Id, PaymentMethod = "Mock",
                Amount = (basePrices[tourIdx] - 100000) * qty,
                Status = payStatus, TransactionRef = $"MOCK-{booking.Id}", CreatedAt = now
            });
            db.SaveChanges();
        }
    }
}
