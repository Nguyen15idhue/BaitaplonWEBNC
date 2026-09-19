using Travela.Api.Data;
using Travela.Api.Models;

namespace Travela.Api.Data;

// Seed B1: chạy 1 lần khi DB trống (sau Migrate). Mật khẩu hash BCrypt tại lúc seed.
// 3 users, 10 destinations, 12 tours, mỗi tour 2-3 prices + 2-3 images, 5 bookings kèm checkout.
public static class DbSeeder
{
    public static void Seed(TravelaDbContext db)
    {
        // M05: seed theo từng bảng để chạy lại sau seed dở dang vẫn đủ dataset.
        var now = DateTime.UtcNow;

        if (!db.Users.Any())
        {
            db.Users.AddRange(
                new User
                {
                    Username = "admin", Email = "admin@travela.local",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    Role = "Admin", Status = "Active", CreatedAt = now
                },
                new User
                {
                    Username = "customer1", Email = "customer1@travela.local",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer123!"),
                    Role = "Customer", Status = "Active", CreatedAt = now
                },
                new User
                {
                    Username = "customer2", Email = "customer2@travela.local",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer123!"),
                    Role = "Customer", Status = "Active", CreatedAt = now
                });
            db.SaveChanges();
        }
        var admin = db.Users.FirstOrDefault(u => u.Username == "admin");
        var cus1 = db.Users.FirstOrDefault(u => u.Username == "customer1");
        var cus2 = db.Users.FirstOrDefault(u => u.Username == "customer2");
        if (admin is null || cus1 is null || cus2 is null)
            throw new InvalidOperationException("Seed users thiếu (admin/customer1/customer2). Xóa DB và seed lại.");

        if (!db.Destinations.Any())
        {
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
        }
        var dests = db.Destinations.OrderBy(d => d.Id).ToList();

        if (!db.Tours.Any())
        {
            var tours = new List<Tour>
            {
            new() { DestinationId = dests[0].Id, TourName = "Hà Nội 1 ngày: Phố cổ – Hồ Gươm", Description = "City tour Hà Nội.", MaxSeats = 40, Status = "Published", CreatedAt = now },
            new() { DestinationId = dests[1].Id, TourName = "Vịnh Hạ Long 2N1Đ", Description = "Du thuyền vịnh Hạ Long.", MaxSeats = 30, Status = "Published", CreatedAt = now },
            new() { DestinationId = dests[2].Id, TourName = "Sa Pa săn mây 3N2Đ", Description = "Fansipan, bản Cát Cát.", MaxSeats = 25, Status = "Published", CreatedAt = now },
            new() { DestinationId = dests[3].Id, TourName = "Huế mộng mơ 2N1Đ", Description = "Đại Nội, lăng tẩm.", MaxSeats = 30, Status = "Published", CreatedAt = now },
            new() { DestinationId = dests[4].Id, TourName = "Đà Nẵng – Bà Nà Hills 3N2Đ", Description = "Cầu Vàng, biển Mỹ Khê.", MaxSeats = 35, Status = "Published", CreatedAt = now },
            new() { DestinationId = dests[5].Id, TourName = "Hội An đèn lồng 2N1Đ", Description = "Phố cổ, thả đèn hoa đăng.", MaxSeats = 30, Status = "Published", CreatedAt = now },
            new() { DestinationId = dests[6].Id, TourName = "Nha Trang biển xanh 3N2Đ", Description = "Vinpearl, tour đảo.", MaxSeats = 40, Status = "Published", CreatedAt = now },
            new() { DestinationId = dests[7].Id, TourName = "Sài Gòn về đêm", Description = "Bùi Viện, Bitexco.", MaxSeats = 40, Status = "Published", CreatedAt = now },
            new() { DestinationId = dests[8].Id, TourName = "Phú Quốc 4N3Đ", Description = "VinWonders, Safari.", MaxSeats = 25, Status = "Published", CreatedAt = now },
            new() { DestinationId = dests[9].Id, TourName = "Miền Tây sông nước 2N1Đ", Description = "Chợ nổi Cái Răng.", MaxSeats = 30, Status = "Published", CreatedAt = now },
            new() { DestinationId = dests[4].Id, TourName = "Đà Lạt mộng mơ 3N2Đ (nháp)", Description = "Tour đang soạn.", MaxSeats = 20, Status = "Draft", CreatedAt = now },
            new() { DestinationId = dests[8].Id, TourName = "Côn Đảo tâm linh 2N1Đ (ẩn)", Description = "Tour tạm ẩn.", MaxSeats = 15, Status = "Hidden", CreatedAt = now },
        };
            db.Tours.AddRange(tours);
            db.SaveChanges();
        }
        var tourList = db.Tours.OrderBy(t => t.Id).ToList();

        // Backfill nội dung chi tiết cho DB đã seed từ trước (Itinerary hoặc field mới null = chưa có nội dung).
        var missing = tourList.Where(t => t.Itinerary == null || t.ItineraryDays == null || t.PaymentTerms == null).ToList();
        if (missing.Count > 0)
        {
            foreach (var t in missing)
                if (TourContents.TryGetValue(t.TourName, out var seed))
                    ApplyContent(t, seed, now);
            db.SaveChanges();
            tourList = db.Tours.OrderBy(t => t.Id).ToList();
        }

        var basePrices = new long[] { 890000, 2490000, 3290000, 1990000, 3990000, 1790000, 3590000, 990000, 5990000, 1590000, 2990000, 2190000 };
        if (!db.Prices.Any())
        {
            for (var i = 0; i < tourList.Count && i < basePrices.Length; i++)
            {
                db.Prices.Add(new Price
                {
                    TourId = tourList[i].Id, SourceName = "Người lớn",
                    PriceValue = basePrices[i], EffectiveDate = now.AddDays(-30), CreatedAt = now
                });
                db.Prices.Add(new Price
                {
                    TourId = tourList[i].Id, SourceName = "Trẻ em",
                    PriceValue = (long)(basePrices[i] * 0.75), EffectiveDate = now.AddDays(-30), CreatedAt = now
                });
                db.Prices.Add(new Price
                {
                    TourId = tourList[i].Id, SourceName = "Phụ thu",
                    PriceValue = 1200000, EffectiveDate = now.AddDays(-30), CreatedAt = now
                });
            }
            db.SaveChanges();
        }

        if (!db.Images.Any())
        {
            for (var i = 0; i < tourList.Count; i++)
            {
                var count = i % 2 == 0 ? 3 : 2;
                for (var j = 1; j <= count; j++)
                {
                    db.Images.Add(new Image
                    {
                        TourId = tourList[i].Id,
                        ImageUrl = $"https://picsum.photos/seed/travela-{tourList[i].Id}-{j}/800/600",
                        Caption = $"Ảnh {j} - {tourList[i].TourName}",
                        SortOrder = j
                    });
                }
            }
            db.SaveChanges();
        }

        if (!db.Bookings.Any())
        {
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
                    UserId = userId, TourId = tourList[tourIdx].Id, BookingDate = now.AddDays(-2),
                    Quantity = qty, Status = status, TrackingTrace = $"[{steps}]", CreatedAt = now
                };
                db.Bookings.Add(booking);
                db.SaveChanges();
                // N07: amount = giá người lớn × số lượng.
                var unit = basePrices[tourIdx];
                db.Checkouts.Add(new Checkout
                {
                    BookingId = booking.Id, PaymentMethod = "Mock",
                    Amount = unit * qty,
                    Status = payStatus, TransactionRef = $"MOCK-{booking.Id}", CreatedAt = now
                });
                db.SaveChanges();
            }
        }
    }

    // Nội dung chi tiết mẫu cho từng tour seed (tuyến, lịch trình, dịch vụ, điều khoản...).
    private sealed record TourContent(
        string Route, string Duration, string Itinerary, string Transport,
        string Accommodation, string Meals, string Sightseeing, string Guide,
        string Included, string Excluded, string Audience, string Insurance,
        string Terms, string ContactInfo, string DepartureLocation,
        int StartInDays, int Days,
        string PaymentTerms, string CancellationPolicy, string ApplicationConditions,
        string ItineraryDays);

    private static void ApplyContent(Tour t, TourContent s, DateTime now)
    {
        var start = now.AddDays(s.StartInDays);
        t.Route = s.Route; t.Duration = s.Duration; t.Itinerary = s.Itinerary;
        t.Transport = s.Transport; t.Accommodation = s.Accommodation; t.Meals = s.Meals;
        t.Sightseeing = s.Sightseeing; t.Guide = s.Guide;
        t.Included = s.Included; t.Excluded = s.Excluded; t.Audience = s.Audience;
        t.Insurance = s.Insurance; t.Terms = s.Terms; t.ContactInfo = s.ContactInfo;
        t.PaymentTerms = s.PaymentTerms; t.CancellationPolicy = s.CancellationPolicy;
        t.ApplicationConditions = s.ApplicationConditions; t.ItineraryDays = s.ItineraryDays;
        if (t.StartDate is null) t.StartDate = start;
        if (t.EndDate is null) t.EndDate = start.AddDays(Math.Max(0, s.Days - 1));
        if (t.DepartureDate is null) t.DepartureDate = start;
        if (t.DepartureLocation is null) t.DepartureLocation = s.DepartureLocation;
        if (t.Duration is null) t.Duration = s.Duration;
    }

    private static readonly Dictionary<string, TourContent> TourContents = new()
    {
        ["Hà Nội 1 ngày: Phố cổ – Hồ Gươm"] = new(
            Route: "Hà Nội: Phố cổ → Hồ Gươm → Văn Miếu → Lăng Bác",
            Duration: "1 ngày",
            Itinerary: "Sáng: đón khách tại phố cổ, dạo Hồ Gươm, đền Ngọc Sơn, ăn phở Bát Đàn.\nChiều: Văn Miếu – Quốc Tử Giám, Lăng Bác, Hồ Tây, cà phê trứng Giảng.\nTối: phố Tạ Hiện, trả khách tại điểm hẹn.",
            Transport: "Ô tô du lịch 16–45 chỗ, xe điện phố cổ",
            Accommodation: "Không lưu trú (tour trong ngày)",
            Meals: "01 bữa trưa: bún chả Hàng Quạt + nem cua bể; nước suối trên xe",
            Sightseeing: "Vé Văn Miếu, đền Ngọc Sơn, xe điện 35 phút phố cổ",
            Guide: "HDV tiếng Việt theo đoàn suốt tuyến",
            Included: "Xe đưa đón, HDV, 01 bữa trưa, vé tham quan theo chương trình, nước suối, bảo hiểm",
            Excluded: "Đồ uống gọi thêm, chi phí cá nhân, tip HDV/lái xe, VAT",
            Audience: "Mọi lứa tuổi; đoàn 10–40 khách; trẻ em dưới 5 tuổi miễn phí",
            Insurance: "Bảo hiểm du lịch nội địa, mức đền bù tối đa 50 triệu đồng/vụ",
            Terms: "Đặt cọc 30% khi đăng ký; hủy trước 3 ngày mất cọc; tour khởi hành khi đủ 10 khách",
            ContactInfo: "Travela Hà Nội — Hotline 1900 1888 (8h–22h); HDV Minh Anh 0912 345 678",
            DepartureLocation: "Nhà hát Lớn, Hà Nội",
            StartInDays: 7, Days: 1,
            PaymentTerms: "Đặt cọc 30% khi đăng ký, thanh toán剩余 trước ngày khởi hành 3 ngày",
            CancellationPolicy: "Hủy trước 7 ngày: hoàn 100%; trước 3 ngày: mất cọc 30%; dưới 3 ngày: mất 100%",
            ApplicationConditions: "Trẻ em dưới 5 tuổi miễn phí (ngủ chung với bố mẹ); trẻ em 5–11 tuổi tính 75% giá; từ 12 tuổi tính giá người lớn",
            ItineraryDays: "[{\"day\":1,\"title\":\"Hà Nội: Phố cổ – Hồ Gươm\",\"meals\":\"01 bữa trưa\",\"content\":\"Sáng: đón khách tại phố cổ, dạo Hồ Gươm, đền Ngọc Sơn, ăn phở Bát Đàn. Chiều: Văn Miếu – Quốc Tử Giám, Lăng Bác, Hồ Tây, cà phê trứng Giảng. Tối: phố Tạ Hiện, trả khách tại điểm hẹn.\"}]"),
        ["Vịnh Hạ Long 2N1Đ"] = new(
            Route: "Hà Nội → Hạ Long → Hang Sửng Sốt → Đảo Titop → Làng chài Cửa Vạn",
            Duration: "2 ngày 1 đêm",
            Itinerary: "Ngày 1: Hà Nội – Hạ Long, lên du thuyền, ăn trưa hải sản, thăm hang Sửng Sốt, tắm biển Titop, tiệc sunset + câu mực đêm.\nNgày 2: đón bình minh, chèo kayak Cửa Vạn, brunch trên tàu, về Hà Nội chiều tối.",
            Transport: "Ô tô Hà Nội – Hạ Long, du thuyền 4 sao ngủ đêm trên vịnh",
            Accommodation: "01 đêm cabin du thuyền 4 sao (2 khách/cabin, ocean view)",
            Meals: "02 bữa trưa + 01 bữa tối BBQ hải sản + 01 brunch; thực đơn chay báo trước 2 ngày",
            Sightseeing: "Vé vịnh + hang Sửng Sốt, kayak 30 phút, tiệc trà chiều",
            Guide: "HDV tiếng Việt/Anh trên tàu + hỗ trợ đoàn tại bến",
            Included: "Xe, du thuyền, 04 bữa ăn, vé vịnh, kayak, bảo hiểm, nước chào mừng",
            Excluded: "Đồ uống có cồn, spa/massage, chi phí cá nhân, tip thủy thủ đoàn",
            Audience: "Người lớn, trẻ em từ 5 tuổi; tối đa 30 khách/chuyến",
            Insurance: "Bảo hiểm đường thủy + du lịch, tối đa 100 triệu đồng/vụ",
            Terms: "Cọc 50%; hủy trước 7 ngày mất 50% cọc; lịch trình có thể đổi theo thủy triều/thời tiết",
            ContactInfo: "Travela Hạ Long — Hotline 1900 1888; Điều hành Ms. Lan 0987 654 321",
            DepartureLocation: "Cảng Tuần Châu, Hạ Long",
            StartInDays: 10, Days: 2,
            PaymentTerms: "Đặt cọc 50% khi đăng ký, thanh toán剩余 trước ngày khởi hành 5 ngày",
            CancellationPolicy: "Hủy trước 7 ngày: hoàn 50% cọc; trước 3 ngày: mất 50% cọc; dưới 3 ngày: mất 100%",
            ApplicationConditions: "Trẻ em dưới 5 tuổi miễn phí (ngủ chung); từ 5 tuổi tính giá trẻ em 75%; từ 12 tuổi tính giá người lớn. Lịch trình có thể thay đổi theo thủy triều/thời tiết",
            ItineraryDays: "[{\"day\":1,\"title\":\"Hà Nội – Hạ Long – Hang Sửng Sốt – Đảo Titop\",\"meals\":\"01 bữa trưa + 01 bữa tối BBQ\",\"content\":\"Lên du thuyền, ăn trưa hải sản, thăm hang Sửng Sốt, tắm biển Titop, tiệc sunset + câu mực đêm.\"},{\"day\":2,\"title\":\"Làng chài Cửa Vạn – Hà Nội\",\"meals\":\"01 brunch\",\"content\":\"Đón bình minh, chèo kayak Cửa Vạn, brunch trên tàu, về Hà Nội chiều tối.\"}]"),
        ["Sa Pa săn mây 3N2Đ"] = new(
            Route: "Hà Nội → Lào Cai → Sa Pa → Fansipan → Bản Cát Cát → Đèo Ô Quy Hồ",
            Duration: "3 ngày 2 đêm",
            Itinerary: "Ngày 1: xe giường nằm đêm Hà Nội – Sa Pa, nhận phòng, bản Cát Cát, nhà thờ đá.\nNgày 2: cáp treo Fansipan săn mây, đèo Ô Quy Hồ, chợ tình tối thứ 7.\nNgày 3: núi Hàm Rồng, mua đặc sản, về Hà Nội.",
            Transport: "Xe giường nằm khứ hồi + ô tô 16 chỗ tại Sa Pa",
            Accommodation: "02 đêm khách sạn 3 sao trung tâm (2–3 khách/phòng, có sưởi)",
            Meals: "03 bữa sáng + 03 bữa chính: thắng cố, lẩu cá hồi, cơm lam thịt nướng",
            Sightseeing: "Vé cáp treo Fansipan khứ hồi, Cát Cát, Hàm Rồng, tàu Mường Hoa",
            Guide: "HDV địa phương người Mông + trưởng đoàn từ Hà Nội",
            Included: "Xe các chặng, khách sạn, ăn theo chương trình, vé tham quan, bảo hiểm",
            Excluded: "Tàu leo núi Fansipan chặng cuối, đồ uống, mua sắm cá nhân",
            Audience: "Sức khỏe tốt, không phù hợp người sợ độ cao; trẻ em từ 6 tuổi",
            Insurance: "Bảo hiểm du lịch miền núi, tối đa 100 triệu đồng/vụ",
            Terms: "Cọc 30%; mang áo ấm, giày trekking; hủy trước 5 ngày mất cọc",
            ContactInfo: "Travela Tây Bắc — Hotline 1900 1888; HDV A Lử 0961 222 333",
            DepartureLocation: "Bến xe Mỹ Đình, Hà Nội",
            StartInDays: 14, Days: 3,
            PaymentTerms: "Đặt cọc 30% khi đăng ký, thanh toán剩余 trước ngày khởi hành 5 ngày",
            CancellationPolicy: "Hủy trước 7 ngày: hoàn 100%; trước 5 ngày: mất cọc 30%; dưới 5 ngày: mất 100%",
            ApplicationConditions: "Trẻ em từ 6 tuổi trở lên; không phù hợp người sợ độ cao; cần sức khỏe tốt để trekking",
            ItineraryDays: "[{\"day\":1,\"title\":\"Hà Nội – Sa Pa – Bản Cát Cát\",\"meals\":\"01 bữa sáng + 01 bữa chính\",\"content\":\"Xe giường nằm đêm Hà Nội – Sa Pa, nhận phòng, bản Cát Cát, nhà thờ đá.\"},{\"day\":2,\"title\":\"Fansipan săn mây – Ô Quy Hồ\",\"meals\":\"01 bữa sáng + 01 bữa chính\",\"content\":\"Cáp treo Fansipan săn mây, đèo Ô Quy Hồ, chợ tình tối thứ 7.\"},{\"day\":3,\"title\":\"Núi Hàm Rồng – Hà Nội\",\"meals\":\"01 bữa sáng + 01 bữa chính\",\"content\":\"Núi Hàm Rồng, mua đặc sản, về Hà Nội.\"}]"),
        ["Huế mộng mơ 2N1Đ"] = new(
            Route: "Huế: Đại Nội → Lăng Khải Định → Chùa Thiên Mụ → Sông Hương",
            Duration: "2 ngày 1 đêm",
            Itinerary: "Ngày 1: Đại Nội, điện Thái Hòa, ăn cơm cung đình, du thuyền sông Hương nghe ca Huế.\nNgày 2: lăng Khải Định, lăng Minh Mạng, chùa Thiên Mụ, chợ Đông Ba.",
            Transport: "Ô tô 16–29 chỗ, thuyền rồng sông Hương buổi tối",
            Accommodation: "01 đêm khách sạn 3 sao ven sông Hương",
            Meals: "02 bữa sáng + 03 bữa chính: cơm cung đình, bún bò Huế, bánh khoái",
            Sightseeing: "Vé Đại Nội + 2 lăng, thuyền + ca Huế tối",
            Guide: "HDV địa phương am hiểu triều Nguyễn",
            Included: "Xe, khách sạn, ăn, vé, thuyền ca Huế, bảo hiểm, nón lá tặng",
            Excluded: "Chi phí cá nhân, đồ uống, xích lô (tự túc ~100k/lượt)",
            Audience: "Mọi lứa tuổi, yêu văn hóa – lịch sử; nhóm gia đình rất hợp",
            Insurance: "Bảo hiểm du lịch nội địa 50 triệu đồng/vụ",
            Terms: "Cọc 30%; ca Huế hủy khi mưa bão được hoàn vé thuyền",
            ContactInfo: "Travela Huế — Hotline 1900 1888; HDV Thu Hiền 0935 777 888",
            DepartureLocation: "Ga Huế / sân bay Phú Bài",
            StartInDays: 12, Days: 2,
            PaymentTerms: "Đặt cọc 30% khi đăng ký, thanh toán剩余 trước ngày khởi hành 3 ngày",
            CancellationPolicy: "Hủy trước 5 ngày: hoàn 100%; trước 3 ngày: mất cọc 30%; dưới 3 ngày: mất 100%. Ca Huế hủy khi mưa bão được hoàn vé thuyền",
            ApplicationConditions: "Trẻ em từ 5 tuổi trở lên; phù hợp mọi lứa tuổi, yêu văn hóa – lịch sử",
            ItineraryDays: "[{\"day\":1,\"title\":\"Đại Nội – Sông Hương – Ca Huế\",\"meals\":\"02 bữa chính\",\"content\":\"Đại Nội, điện Thái Hòa, ăn cơm cung đình, du thuyền sông Hương nghe ca Huế.\"},{\"day\":2,\"title\":\"Lăng tẩm – Chùa Thiên Mụ – Chợ Đông Ba\",\"meals\":\"01 bữa sáng + 01 bữa chính\",\"content\":\"Lăng Khải Định, lăng Minh Mạng, chùa Thiên Mụ, chợ Đông Ba.\"}]"),
        ["Đà Nẵng – Bà Nà Hills 3N2Đ"] = new(
            Route: "Đà Nẵng → Bà Nà Hills → Hội An → Bán đảo Sơn Trà → Biển Mỹ Khê",
            Duration: "3 ngày 2 đêm",
            Itinerary: "Ngày 1: Sơn Trà – chùa Linh Ứng, biển Mỹ Khê, cầu Rồng phun lửa tối.\nNgày 2: Bà Nà Hills: Cầu Vàng, Fantasy Park, làng Pháp, buffet trưa.\nNgày 3: Hội An phố cổ + thả đèn, mua sắm, tiễn sân bay.",
            Transport: "Ô tô du lịch + cáp treo Bà Nà khứ hồi",
            Accommodation: "02 đêm khách sạn 4 sao biển Mỹ Khê (buffet sáng, hồ bơi)",
            Meals: "03 buffet sáng + 04 bữa chính + 01 buffet trưa Bà Nà",
            Sightseeing: "Vé Bà Nà + Fantasy (trừ trò trúng thưởng), vé Hội An, căng buồm Mỹ Khê",
            Guide: "HDV theo đoàn + HDV điểm tại Bà Nà",
            Included: "Xe, khách sạn, ăn, cáp treo, vé các điểm, bảo hiểm",
            Excluded: "Hầm rượu Debay, bảo tàng tượng sáp, đồ uống, chi phí cá nhân",
            Audience: "Gia đình, nhóm bạn; trẻ em miễn vé Bà Nà dưới 1m",
            Insurance: "Bảo hiểm du lịch 100 triệu đồng/vụ",
            Terms: "Cọc 30%; Bà Nà dừng cáp treo do bão được đổi ngày hoặc hoàn vé",
            ContactInfo: "Travela Đà Nẵng — Hotline 1900 1888; HDV Quốc Bảo 0905 111 222",
            DepartureLocation: "Sân bay Đà Nẵng",
            StartInDays: 15, Days: 3,
            PaymentTerms: "Đặt cọc 30% khi đăng ký, thanh toán剩余 trước ngày khởi hành 5 ngày",
            CancellationPolicy: "Hủy trước 7 ngày: hoàn 100%; trước 3 ngày: mất cọc 30%; dưới 3 ngày: mất 100%. Bà Nà dừng cáp treo do bão được đổi ngày hoặc hoàn vé",
            ApplicationConditions: "Trẻ em dưới 1m miễn vé Bà Nà; phù hợp gia đình, nhóm bạn",
            ItineraryDays: "[{\"day\":1,\"title\":\"Sơn Trà – Biển Mỹ Khê – Cầu Rồng\",\"meals\":\"01 bữa sáng + 01 bữa chính\",\"content\":\"Chùa Linh Ứng, biển Mỹ Khê, cầu Rồng phun lửa tối.\"},{\"day\":2,\"title\":\"Bà Nà Hills – Cầu Vàng – Fantasy Park\",\"meals\":\"01 buffet sáng + 01 buffet trưa Bà Nà + 01 bữa chính\",\"content\":\"Cáp treo Bà Nà, Cầu Vàng, Fantasy Park, làng Pháp, buffet trưa.\"},{\"day\":3,\"title\":\"Hội An phố cổ – Tiễn sân bay\",\"meals\":\"01 bữa sáng + 01 bữa chính\",\"content\":\"Phố cổ Hội An + thả đèn, mua sắm, tiễn sân bay.\"}]"),
        ["Hội An đèn lồng 2N1Đ"] = new(
            Route: "Đà Nẵng → Hội An: Phố cổ → Chùa Cầu → Sông Hoài → Làng rau Trà Quế",
            Duration: "2 ngày 1 đêm",
            Itinerary: "Ngày 1: phố cổ, Chùa Cầu, hội quán, tối đi thuyền thả đèn hoa đăng sông Hoài.\nNgày 2: làng rau Trà Quế làm nông dân, lớp học nấu ăn, cao lầu – mì Quảng.",
            Transport: "Ô tô Đà Nẵng – Hội An, thuyền thả đèn buổi tối, xe đạp dạo phố",
            Accommodation: "01 đêm homestay phố cổ (phòng gỗ, hồ bơi mini)",
            Meals: "Cao lầu, mì Quảng, cơm gà Bà Buội + lớp nấu ăn (ăn thành phẩm của mình)",
            Sightseeing: "Vé phố cổ 5/21 điểm, thuyền thả đèn + 2 đèn/khách, vé Trà Quế",
            Guide: "HDV địa phương + đầu bếp hướng dẫn lớp nấu ăn",
            Included: "Xe, homestay, ăn, vé, thuyền đèn, xe đạp, bảo hiểm",
            Excluded: "May đồ, mua sắm, đồ uống thêm",
            Audience: "Cặp đôi, gia đình; tour nhẹ nhàng, đi bộ nhiều trong phố cổ",
            Insurance: "Bảo hiểm du lịch nội địa 50 triệu đồng/vụ",
            Terms: "Cọc 30%; thả đèn phụ thuộc mực nước sông Hoài",
            ContactInfo: "Travela Hội An — Hotline 1900 1888; HDV Hoài Thương 0914 555 666",
            DepartureLocation: "Sân bay Đà Nẵng",
            StartInDays: 11, Days: 2,
            PaymentTerms: "Đặt cọc 30% khi đăng ký, thanh toán剩余 trước ngày khởi hành 3 ngày",
            CancellationPolicy: "Hủy trước 5 ngày: hoàn 100%; trước 3 ngày: mất cọc 30%; dưới 3 ngày: mất 100%. Thả đèn phụ thuộc mực nước sông Hoài",
            ApplicationConditions: "Phù hợp cặp đôi, gia đình; đi bộ nhiều trong phố cổ nên mang giày thoải mái",
            ItineraryDays: "[{\"day\":1,\"title\":\"Phố cổ – Chùa Cầu – Thả đèn sông Hoài\",\"meals\":\"01 bữa chính\",\"content\":\"Phố cổ, Chùa Cầu, hội quán, tối đi thuyền thả đèn hoa đăng sông Hoài.\"},{\"day\":2,\"title\":\"Làng rau Trà Quế – Lớp nấu ăn\",\"meals\":\"01 bữa sáng + 01 bữa chính (lớp nấu ăn)\",\"content\":\"Làm nông dân tại Trà Quế, lớp học nấu ăn, cao lầu – mì Quảng.\"}]"),
        ["Nha Trang biển xanh 3N2Đ"] = new(
            Route: "Nha Trang: Vinpearl → Hòn Mun lặn biển → Tháp Bà Ponagar → Chợ Đầm",
            Duration: "3 ngày 2 đêm",
            Itinerary: "Ngày 1: Tháp Bà Ponagar, tắm bùn Tháp Bà, dạo biển Trần Phú.\nNgày 2: cano 3 đảo + lặn ngắm san hô Hòn Mun, tiệc hải sản bè nổi.\nNgày 3: VinWonders cả ngày (cáp treo vượt biển), chợ Đầm mua đặc sản.",
            Transport: "Ô tô + cano cao tốc tour đảo + cáp treo Vinpearl khứ hồi",
            Accommodation: "02 đêm resort 4 sao mặt biển (buffet sáng, bãi riêng)",
            Meals: "03 buffet sáng + 04 bữa chính hải sản (tôm hùm 1 bữa theo nhóm)",
            Sightseeing: "Vé VinWonders, lặn ống thở + huấn luyện viên, tắm bùn khoáng",
            Guide: "HDV + HLV lặn biển kèm nhóm 4 khách",
            Included: "Xe, resort, ăn, cano, vé các điểm, thiết bị lặn, bảo hiểm",
            Excluded: "Lặn bình dưỡng khí (scuba ~800k), jetski, đồ uống",
            Audience: "Biết bơi cơ bản với tour lặn; trẻ em có khu vui chơi riêng",
            Insurance: "Bảo hiểm thể thao biển, tối đa 100 triệu đồng/vụ",
            Terms: "Cọc 30%; tour đảo hủy khi biển động cấp 6+, được đổi ngày",
            ContactInfo: "Travela Nha Trang — Hotline 1900 1888; HDV Khánh Duy 0978 333 444",
            DepartureLocation: "Sân bay Cam Ranh",
            StartInDays: 18, Days: 3,
            PaymentTerms: "Đặt cọc 30% khi đăng ký, thanh toán剩余 trước ngày khởi hành 5 ngày",
            CancellationPolicy: "Hủy trước 7 ngày: hoàn 100%; trước 3 ngày: mất cọc 30%; dưới 3 ngày: mất 100%. Tour đảo hủy khi biển động cấp 6+, được đổi ngày",
            ApplicationConditions: "Biết bơi cơ bản với tour lặn; trẻ em có khu vui chơi riêng; không phù hợp người sợ sóng lớn",
            ItineraryDays: "[{\"day\":1,\"title\":\"Tháp Bà Ponagar – Tắm bùn – Biển Trần Phú\",\"meals\":\"01 bữa sáng + 01 bữa chính\",\"content\":\"Tháp Bà Ponagar, tắm bùn khoáng, dạo biển Trần Phú.\"},{\"day\":2,\"title\":\"Cano 3 đảo – Lặn san hô Hòn Mun\",\"meals\":\"01 bữa sáng + 01 bữa chính hải sản\",\"content\":\"Cano cao tốc tour đảo + lặn ống thở ngắm san hô Hòn Mun, tiệc hải sản bè nổi.\"},{\"day\":3,\"title\":\"VinWonders – Chợ Đầm\",\"meals\":\"01 bữa sáng + 01 bữa chính\",\"content\":\"VinWonders cả ngày (cáp treo vượt biển), chợ Đầm mua đặc sản.\"}]"),
        ["Sài Gòn về đêm"] = new(
            Route: "TP.HCM: Bùi Viện → Bitexco → Bến Bạch Đằng → Chợ Bến Thành",
            Duration: "1 buổi tối (4 giờ)",
            Itinerary: "18h đón khách quận 1, dạo Bùi Viện, lên đài quan sát Bitexco ngắm toàn cảnh.\nDu thuyền sông Sài Gòn ăn tối + nhạc acoustic, dạo bến Bạch Đằng, trả khách 22h.",
            Transport: "Ô tô 16 chỗ + du thuyền sông Sài Gòn",
            Accommodation: "Không lưu trú (tour buổi tối)",
            Meals: "01 bữa tối trên du thuyền: set menu Âu – Á + tráng miệng",
            Sightseeing: "Vé đài quan sát Bitexco, vé du thuyền + chương trình nhạc",
            Guide: "HDV tiếng Việt/Anh, hỗ trợ chụp ảnh sống ảo",
            Included: "Xe, HDV, bữa tối du thuyền, vé các điểm, bảo hiểm",
            Excluded: "Đồ uống có cồn trên tàu, chi phí cá nhân",
            Audience: "Từ 18 tuổi cho combo có rượu; gia đình đi suất không cồn",
            Insurance: "Bảo hiểm du lịch nội địa 50 triệu đồng/vụ",
            Terms: "Thanh toán 100% khi đăng ký; hủy trước 24h hoàn 50%",
            ContactInfo: "Travela Sài Gòn — Hotline 1900 1888; HDV Chí Thiện 0938 999 000",
            DepartureLocation: "Nhà hát Thành phố, Quận 1",
            StartInDays: 5, Days: 1,
            PaymentTerms: "Thanh toán 100% khi đăng ký",
            CancellationPolicy: "Hủy trước 24h: hoàn 50%; dưới 24h: không hoàn",
            ApplicationConditions: "Từ 18 tuổi cho combo có rượu; gia đình đi suất không cồn. Tour buổi tối 18h–22h",
            ItineraryDays: "[{\"day\":1,\"title\":\"Sài Gòn về đêm: Bùi Viện – Bitexco – Du thuyền\",\"meals\":\"01 bữa tối trên du thuyền\",\"content\":\"18h đón khách quận 1, dạo Bùi Viện, lên đài quan sát Bitexco ngắm toàn cảnh. Du thuyền sông Sài Gòn ăn tối + nhạc acoustic, dạo bến Bạch Đằng, trả khách 22h.\"}]"),
        ["Phú Quốc 4N3Đ"] = new(
            Route: "Phú Quốc: VinWonders → Safari → Grand World → Hoàng hôn Sunset Sanato",
            Duration: "4 ngày 3 đêm",
            Itinerary: "Ngày 1: bay đến Phú Quốc, Grand World, show Tinh hoa Việt Nam.\nNgày 2: VinWonders + Safari (xe bus đưa đón).\nNgày 3: tour 4 đảo + cáp treo Hòn Thơm, lặn ngắm san hô, hoàng hôn Sanato.\nNgày 4: nhà tù Phú Quốc, vườn tiêu, mua nước mắm, về đất liền.",
            Transport: "Vé máy bay khứ hồi + ô tô + cano tour đảo + cáp treo Hòn Thơm",
            Accommodation: "03 đêm resort 5 sao bãi Trường (villa hồ bơi riêng theo hạng)",
            Meals: "03 buffet sáng + 06 bữa chính hải sản + 01 bữa tối chợ đêm (tự chọn có hỗ trợ)",
            Sightseeing: "Vé VinWonders, Safari, Grand World show, tour 4 đảo + flycam",
            Guide: "HDV suốt tuyến + HDV điểm tại Safari",
            Included: "Vé máy bay, resort, ăn, vé các điểm, cano, bảo hiểm",
            Excluded: "Hành lý quá cước, đồ uống, vui chơi có thưởng",
            Audience: "Gia đình, trăng mật; trẻ em dưới 4 tuổi miễn phí (ngủ chung)",
            Insurance: "Bảo hiểm hàng không + du lịch, tối đa 200 triệu đồng/vụ",
            Terms: "Cọc 50%; vé máy bay xuất riêng theo điều kiện hãng; hủy tour mất vé MB",
            ContactInfo: "Travela Phú Quốc — Hotline 1900 1888; HDV Ngọc Hân 0944 123 789",
            DepartureLocation: "Sân bay Tân Sơn Nhất",
            StartInDays: 21, Days: 4,
            PaymentTerms: "Đặt cọc 50% khi đăng ký, thanh toán剩余 trước ngày khởi hành 7 ngày",
            CancellationPolicy: "Hủy trước 10 ngày: hoàn 100%; trước 5 ngày: mất 50% cọc; dưới 5 ngày: mất 100%. Vé máy bay xuất riêng theo điều kiện hãng, hủy tour mất vé máy bay",
            ApplicationConditions: "Trẻ em dưới 4 tuổi miễn phí (ngủ chung); từ 4 tuổi tính giá trẻ em; phù hợp gia đình, trăng mật",
            ItineraryDays: "[{\"day\":1,\"title\":\"Phú Quốc – Grand World – Tinh hoa Việt Nam\",\"meals\":\"01 bữa sáng + 01 bữa chính\",\"content\":\"Bay đến Phú Quốc, Grand World, show Tinh hoa Việt Nam.\"},{\"day\":2,\"title\":\"VinWonders + Safari\",\"meals\":\"01 bữa sáng + 01 bữa chính\",\"content\":\"VinWonders + Safari (xe bus đưa đón).\"},{\"day\":3,\"title\":\"Tour 4 đảo – Cáp treo Hòn Thơm – Hoàng hôn Sanato\",\"meals\":\"01 bữa sáng + 01 bữa chính hải sản\",\"content\":\"Tour 4 đảo + cáp treo Hòn Thơm, lặn ngắm san hô, hoàng hôn Sunset Sanato.\"},{\"day\":4,\"title\":\"Nhà tù Phú Quốc – Về đất liền\",\"meals\":\"01 bữa sáng + 01 bữa chính\",\"content\":\"Nhà tù Phú Quốc, vườn tiêu, mua nước mắm, về đất liền.\"}]"),
        ["Miền Tây sông nước 2N1Đ"] = new(
            Route: "TP.HCM → Mỹ Tho → Bến Tre → Cần Thơ → Chợ nổi Cái Răng",
            Duration: "2 ngày 1 đêm",
            Itinerary: "Ngày 1: chùa Vĩnh Tràng, cồn Thới Sơn (đờn ca tài tử, kẹo dừa), Bến Tre xuồng ba lá, tối dạo bến Ninh Kiều.\nNgày 2: 5h chợ nổi Cái Răng (ăn hủ tiếu trên ghe), vườn trái cây, về TP.HCM.",
            Transport: "Ô tô + xuồng ba lá + ghe máy chợ nổi",
            Accommodation: "01 đêm homestay miệt vườn Cần Thơ (đờn ca tài tử tối)",
            Meals: "Cá tai tượng chiên xù, lẩu mắm, hủ tiếu ghe + trái cây miệt vườn",
            Sightseeing: "Vé cồn, lò kẹo dừa, ghe chợ nổi, xuồng ba lá 30 phút",
            Guide: "HDV miền Tây + cô chú nông dân dẫn vườn",
            Included: "Xe, homestay, ăn, ghe/xuồng, vé, bảo hiểm, nón lá",
            Excluded: "Mua đặc sản, đồ uống thêm",
            Audience: "Mọi lứa tuổi; người say sóng nhẹ nên uống thuốc trước tour ghe",
            Insurance: "Bảo hiểm đường sông + du lịch 50 triệu đồng/vụ",
            Terms: "Cọc 30%; chợ nổi đẹp nhất 5h–7h sáng, trễ giờ tự chịu",
            ContactInfo: "Travela Cần Thơ — Hotline 1900 1888; HDV Út Thương 0922 456 111",
            DepartureLocation: "Bến xe Miền Tây, TP.HCM",
            StartInDays: 9, Days: 2,
            PaymentTerms: "Đặt cọc 30% khi đăng ký, thanh toán剩余 trước ngày khởi hành 3 ngày",
            CancellationPolicy: "Hủy trước 5 ngày: hoàn 100%; trước 3 ngày: mất cọc 30%; dưới 3 ngày: mất 100%. Chợ nổi đẹp nhất 5h–7h sáng, trễ giờ tự chịu",
            ApplicationConditions: "Mọi lứa tuổi; người say sóng nhẹ nên uống thuốc trước tour ghe",
            ItineraryDays: "[{\"day\":1,\"title\":\"Mỹ Tho – Bến Tre – Cần Thơ\",\"meals\":\"01 bữa chính\",\"content\":\"Chùa Vĩnh Tràng, cồn Thới Sơn (đờn ca tài tử, kẹo dừa), Bến Tre xuồng ba lá, tối dạo bến Ninh Kiều.\"},{\"day\":2,\"title\":\"Chợ nổi Cái Răng – TP.HCM\",\"meals\":\"01 bữa sáng + 01 bữa chính\",\"content\":\"5h chợ nổi Cái Răng (ăn hủ tiếu trên ghe), vườn trái cây, về TP.HCM.\"}]"),
        ["Đà Lạt mộng mơ 3N2Đ (nháp)"] = new(
            Route: "Đà Lạt: Hồ Tuyền Lâm → Thung lũng Tình Yêu → Làng Cù Lần → Chợ đêm",
            Duration: "3 ngày 2 đêm",
            Itinerary: "Ngày 1: Dinh Bảo Đại, ga xe lửa, nhà thờ Con Gà.\nNgày 2: Thung lũng Tình Yêu, đồi chè Cầu Đất săn mây, tối chợ đêm + sữa đậu nành.\nNgày 3: Làng Cù Lần, thác Datanla máng trượt, về lại TP.HCM.",
            Transport: "Xe giường nằm khứ hồi + ô tô ngày tại Đà Lạt",
            Accommodation: "02 đêm khách sạn 3 sao gần hồ Xuân Hương",
            Meals: "Bánh căn, lẩu gà lá é, nem nướng + buffet rau Đà Lạt",
            Sightseeing: "Vé các KDL + máng trượt Datanla 1 lượt",
            Guide: "HDV theo đoàn",
            Included: "Xe, khách sạn, ăn, vé, bảo hiểm",
            Excluded: "Vé Langbiang xe jeep, đồ uống, mua sắm",
            Audience: "Tour đang soạn — giá và lịch có thể đổi trước khi mở bán",
            Insurance: "Bảo hiểm du lịch nội địa 50 triệu đồng/vụ",
            Terms: "Tour nháp chưa nhận booking công khai",
            ContactInfo: "Travela Đà Lạt (sắp mở) — Hotline 1900 1888",
            DepartureLocation: "Bến xe Miền Đông, TP.HCM",
            StartInDays: 30, Days: 3,
            PaymentTerms: "Tour nháp chưa nhận booking công khai",
            CancellationPolicy: "Tour nháp chưa có chính sách hủy",
            ApplicationConditions: "Tour đang soạn — giá và lịch có thể đổi trước khi mở bán",
            ItineraryDays: "[{\"day\":1,\"title\":\"Dinh Bảo Đại – Ga xe lửa – Nhà thờ Con Gà\",\"meals\":\"01 bữa chính\",\"content\":\"Dinh Bảo Đại, ga xe lửa, nhà thờ Con Gà.\"},{\"day\":2,\"title\":\"Thung lũng Tình Yêu – Đồi chè Cầu Đất\",\"meals\":\"01 bữa sáng + 01 bữa chính\",\"content\":\"Thung lũng Tình Yêu, đồi chè Cầu Đất săn mây, tối chợ đêm + sữa đậu nành.\"},{\"day\":3,\"title\":\"Làng Cù Lần – Thác Datanla – TP.HCM\",\"meals\":\"01 bữa sáng + 01 bữa chính\",\"content\":\"Làng Cù Lần, thác Datanla máng trượt, về lại TP.HCM.\"}]"),
        ["Côn Đảo tâm linh 2N1Đ (ẩn)"] = new(
            Route: "Côn Đảo: Nghĩa trang Hàng Dương → Miếu bà Phi Yến → Bãi Đầm Trầu",
            Duration: "2 ngày 1 đêm",
            Itinerary: "Ngày 1: bay ra Côn Đảo, viếng mộ chị Võ Thị Sáu, miếu bà Phi Yến, lễ tối Hàng Dương.\nNgày 2: nhà tù Côn Đảo, bãi Đầm Trầu ngắm máy bay, mua đặc sản, về đất liền.",
            Transport: "Vé máy bay khứ hồi + xe điện tại đảo",
            Accommodation: "01 đêm resort 4 sao bãi biển",
            Meals: "Hải sản Côn Đảo: ốc vú nàng, cá mú đỏ + cơm phần",
            Sightseeing: "Vé nhà tù + bảo tàng, xe điện, đồ lễ cơ bản",
            Guide: "HDV địa phương + hỗ trợ lễ viếng",
            Included: "Vé MB, resort, ăn, xe, vé, đồ lễ, bảo hiểm",
            Excluded: "Đồ lễ riêng cao cấp, chi phí cá nhân",
            Audience: "Tour tạm ẩn — chỉ mở theo yêu cầu đoàn",
            Insurance: "Bảo hiểm hàng không + du lịch 200 triệu đồng/vụ",
            Terms: "Mở lại khi đủ 15 khách/đoàn; giờ lễ theo quy định ban quản lý",
            ContactInfo: "Travela Côn Đảo — Hotline 1900 1888",
            DepartureLocation: "Sân bay Tân Sơn Nhất",
            StartInDays: 25, Days: 2,
            PaymentTerms: "Mở lại khi đủ 15 khách/đoàn; đặt cọc 50% khi đăng ký",
            CancellationPolicy: "Hủy trước 7 ngày: hoàn 100%; trước 3 ngày: mất 50% cọc; dưới 3 ngày: mất 100%",
            ApplicationConditions: "Tour tạm ẩn — chỉ mở theo yêu cầu đoàn; giờ lễ theo quy định ban quản lý",
            ItineraryDays: "[{\"day\":1,\"title\":\"Côn Đảo – Viếng mộ – Miếu bà Phi Yến\",\"meals\":\"01 bữa chính\",\"content\":\"Bay ra Côn Đảo, viếng mộ chị Võ Thị Sáu, miếu bà Phi Yến, lễ tối Hàng Dương.\"},{\"day\":2,\"title\":\"Nhà tù Côn Đảo – Bãi Đầm Trầu\",\"meals\":\"01 bữa sáng + 01 bữa chính\",\"content\":\"Nhà tù Côn Đảo, bãi Đầm Trầu ngắm máy bay, mua đặc sản, về đất liền.\"}]"),
    };
}
