using System.Net;
using Microsoft.EntityFrameworkCore;
using Travela.Api.Data;
using Travela.Api.DTOs.Common;
using Travela.Api.DTOs.Tour;
using Travela.Api.Helpers;
using Travela.Api.Middleware;
using Travela.Api.Models;

namespace Travela.Api.Services;

// TourService: list public (chỉ Published) + filter/sort/page, priceFrom = min giá hiệu lực
// (bản mới nhất từng nguồn có effective_date <= now). Ghi audit mọi tạo/sửa/xóa tour và giá.
public class TourService
{
    private readonly TravelaDbContext _db;
    private readonly AuditLogService _audit;
    private static readonly string[] ValidStatus = ["Draft", "Published", "Hidden"];

    public TourService(TravelaDbContext db, AuditLogService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<PagedResult<TourListDto>> ListAsync(
        string? search, int? destinationId, decimal? minPrice, decimal? maxPrice,
        int page, int pageSize, string? sort, bool publicOnly, string? status = null)
    {
        (page, pageSize) = PaginationHelper.Normalize(page, pageSize);
        var now = DateTime.UtcNow;
        var q = _db.Tours.AsNoTracking()
            .Include(t => t.Destination)
            .Include(t => t.Prices)
            .Include(t => t.Images)
            .Include(t => t.Bookings)
            .AsQueryable();
        if (publicOnly) q = q.Where(t => t.Status == "Published");
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(t => t.Status == status);
        if (destinationId.HasValue) q = q.Where(t => t.DestinationId == destinationId.Value);
        if (!string.IsNullOrWhiteSpace(search)) q = q.Where(t => t.TourName.Contains(search));

        // Tính priceFrom trong bộ nhớ (data BTL nhỏ). B5/NFR sẽ rà lại nếu phình.
        var all = (await q.ToListAsync()).Select(t => BuildListDto(t, now)).ToList();
        if (minPrice.HasValue) all = all.Where(x => x.PriceFrom >= minPrice.Value).ToList();
        if (maxPrice.HasValue) all = all.Where(x => x.PriceFrom <= maxPrice.Value).ToList();
        all = (sort?.ToLowerInvariant()) switch
        {
            "price_asc" => all.OrderBy(x => x.PriceFrom).ToList(),
            "price_desc" => all.OrderByDescending(x => x.PriceFrom).ToList(),
            "name" => all.OrderBy(x => x.TourName).ToList(),
            _ => all.OrderByDescending(x => x.Id).ToList(),
        };
        var items = all.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return PaginationHelper.ToPagedResult(items, all.Count, page, pageSize);
    }

    public async Task<TourDetailDto> GetDetailAsync(int id, bool publicOnly)
    {
        var t = await _db.Tours.AsNoTracking()
            .Include(x => x.Destination).Include(x => x.Prices).Include(x => x.Images).Include(x => x.Bookings)
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy tour.");
        if (publicOnly && t.Status != "Published")
            throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy tour.");
        return BuildDetailDto(t, DateTime.UtcNow);
    }

    public async Task<TourDetailDto> CreateAsync(CreateTourRequest req, int actorId)
    {
        ValidateTour(req);
        await RequireDestinationAsync(req.DestinationId);
        var t = new Tour
        {
            TourName = req.TourName.Trim(), Description = req.Description?.Trim() ?? string.Empty,
            DestinationId = req.DestinationId, MaxSeats = req.MaxSeats, Status = req.Status,
            StartDate = req.StartDate, EndDate = req.EndDate,
            CreatedAt = DateTime.UtcNow
        };
        _db.Tours.Add(t);
        await _db.SaveChangesAsync();
        await _audit.LogAsync(actorId, "Tour.Create", "Tour", t.Id, null, t.TourName);
        return await GetDetailAsync(t.Id, publicOnly: false);
    }

    public async Task<TourDetailDto> UpdateAsync(int id, UpdateTourRequest req, int actorId)
    {
        ValidateTour(req);
        await RequireDestinationAsync(req.DestinationId);
        var t = await _db.Tours.FindAsync(id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy tour.");
        // N05: không cho hạ MaxSeats dưới số đã bán (trừ Cancelled).
        var sold = await _db.Bookings.Where(b => b.TourId == id && b.Status != "Cancelled")
            .SumAsync(b => (int?)b.Quantity) ?? 0;
        if (req.MaxSeats < sold)
            throw new AppException(HttpStatusCode.UnprocessableEntity, "SEATS_BELOW_SOLD",
                $"Tour đã bán {sold} chỗ, không thể hạ xuống {req.MaxSeats}.");
        var old = $"{t.TourName}|{t.Status}";
        t.TourName = req.TourName.Trim();
        t.Description = req.Description?.Trim() ?? string.Empty;
        t.DestinationId = req.DestinationId;
        t.MaxSeats = req.MaxSeats;
        t.Status = req.Status;
        t.StartDate = req.StartDate;
        t.EndDate = req.EndDate;
        await _db.SaveChangesAsync();
        await _audit.LogAsync(actorId, "Tour.Update", "Tour", id, old, $"{t.TourName}|{t.Status}");
        return await GetDetailAsync(id, publicOnly: false);
    }

    public async Task<object> DeleteAsync(int id, int actorId)
    {
        // N04: check + delete/hide + audit trong 1 transaction, chống race orphan/FK 500.
        await using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var t = await _db.Tours.Include(x => x.Prices).Include(x => x.Images).FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy tour.");
            // Có booking thì không xóa cứng: chuyển Hidden (FK Restrict cũng chặn).
            if (await _db.Bookings.AnyAsync(b => b.TourId == id))
            {
                var old = t.Status;
                t.Status = "Hidden";
                _audit.Add(actorId, "Tour.Update", "Tour", id, old, "Hidden");
                await _db.SaveChangesAsync();
                await tx.CommitAsync();
                return new { hidden = true, message = "Tour đã có booking nên chuyển sang Hidden thay vì xóa." };
            }
            _db.Prices.RemoveRange(t.Prices);
            _db.Images.RemoveRange(t.Images);
            _db.Tours.Remove(t);
            _audit.Add(actorId, "Tour.Delete", "Tour", id, t.TourName, null);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();
            return new { hidden = false, message = "Đã xóa tour." };
        }
        catch (DbUpdateException ex) when (IsFkViolation(ex))
        {
            await tx.RollbackAsync();
            throw new AppException(HttpStatusCode.Conflict, "HAS_BOOKINGS",
                "Tour đã có booking, không thể xóa.");
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    private static bool IsFkViolation(Exception ex)
    {
        for (var e = ex; e is not null; e = e.InnerException)
        {
            if (e is MySqlConnector.MySqlException mysql && mysql.Number == 1451)
                return true;
        }
        return false;
    }

    public async Task<List<PriceDto>> ListPricesAsync(int tourId, bool publicOnly = false)
    {
        var tour = await _db.Tours.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tourId)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy tour.");
        if (publicOnly && tour.Status != "Published")
            throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy tour.");
        var now = DateTime.UtcNow;
        // H05: chỉ trả giá hiệu lực mới nhất từng nguồn (đồng nhất với detail/checkout).
        var all = await _db.Prices.AsNoTracking().Where(p => p.TourId == tourId && p.EffectiveDate <= now).ToListAsync();
        return PricingHelper.EffectivePrices(all, now)
            .OrderByDescending(p => p.EffectiveDate)
            .Select(p => new PriceDto { Id = p.Id, SourceName = p.SourceName, PriceValue = p.PriceValue, EffectiveDate = p.EffectiveDate })
            .ToList();
    }

    public async Task<PriceDto> CreatePriceAsync(int tourId, CreatePriceRequest req, int actorId)
    {
        await RequireTourAsync(tourId);
        ValidatePrice(req);
        var p = new Price
        {
            // M02: canonical source để Website/website không thành 2 nguồn.
            TourId = tourId, SourceName = req.SourceName.Trim().ToLowerInvariant(), PriceValue = req.PriceValue,
            EffectiveDate = req.EffectiveDate, CreatedAt = DateTime.UtcNow
        };
        _db.Prices.Add(p);
        await _db.SaveChangesAsync();
        await _audit.LogAsync(actorId, "Price.Create", "Price", p.Id, null, $"{p.SourceName}:{p.PriceValue}");
        return ToPriceDto(p);
    }

    public async Task<PriceDto> UpdatePriceAsync(int id, UpdatePriceRequest req, int actorId)
    {
        ValidatePrice(req);
        var p = await _db.Prices.FindAsync(id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy giá.");
        var old = $"{p.SourceName}:{p.PriceValue}";
        p.SourceName = req.SourceName.Trim().ToLowerInvariant();
        p.PriceValue = req.PriceValue;
        p.EffectiveDate = req.EffectiveDate;
        await _db.SaveChangesAsync();
        await _audit.LogAsync(actorId, "Price.Update", "Price", id, old, $"{p.SourceName}:{p.PriceValue}");
        return ToPriceDto(p);
    }

    public async Task DeletePriceAsync(int id, int actorId)
    {
        var p = await _db.Prices.FindAsync(id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy giá.");
        _db.Prices.Remove(p);
        await _db.SaveChangesAsync();
        await _audit.LogAsync(actorId, "Price.Delete", "Price", id, $"{p.SourceName}:{p.PriceValue}", null);
    }

    public async Task<ImageDto> CreateImageAsync(int tourId, CreateImageRequest req, int actorId = 0)
    {
        await RequireTourAsync(tourId);
        if (string.IsNullOrWhiteSpace(req.ImageUrl) || req.ImageUrl.Trim().Length > 500 ||
            !Uri.TryCreate(req.ImageUrl.Trim(), UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            throw new AppException(HttpStatusCode.UnprocessableEntity, "VALIDATION_ERROR", "image_url phải là URL http/https, tối đa 500 ký tự.");
        if (await _db.Images.CountAsync(i => i.TourId == tourId) >= 10)
            throw new AppException(HttpStatusCode.BadRequest, "TOO_MANY_IMAGES", "Mỗi tour tối đa 10 ảnh.");
        // M03: validate sort/caption ở server, không chỉ client.
        if (req.SortOrder <= 0)
            throw new AppException(HttpStatusCode.UnprocessableEntity, "VALIDATION_ERROR", "SortOrder phải lớn hơn 0.");
        if ((req.Caption?.Length ?? 0) > 300)
            throw new AppException(HttpStatusCode.UnprocessableEntity, "VALIDATION_ERROR", "Caption tối đa 300 ký tự.");
        var img = new Image
        {
            TourId = tourId, ImageUrl = req.ImageUrl.Trim(),
            Caption = req.Caption?.Trim() ?? string.Empty, SortOrder = req.SortOrder
        };
        _db.Images.Add(img);
        await _db.SaveChangesAsync();
        // M08: audit cả Image để đủ vết admin.
        if (actorId != 0)
            await _audit.LogAsync(actorId, "Image.Create", "Image", img.Id, null, img.ImageUrl);
        return ToImageDto(img);
    }

    public async Task DeleteImageAsync(int id, int actorId = 0)
    {
        var img = await _db.Images.FindAsync(id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy ảnh.");
        var old = img.ImageUrl;
        _db.Images.Remove(img);
        await _db.SaveChangesAsync();
        if (actorId != 0)
            await _audit.LogAsync(actorId, "Image.Delete", "Image", id, old, null);
    }

    private async Task RequireTourAsync(int tourId)
    {
        if (!await _db.Tours.AnyAsync(t => t.Id == tourId))
            throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy tour.");
    }

    private async Task RequireDestinationAsync(int destinationId)
    {
        if (!await _db.Destinations.AnyAsync(d => d.Id == destinationId))
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Điểm đến không tồn tại.");
    }

    private static void ValidateTour(CreateTourRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.TourName) || req.TourName.Trim().Length > 200)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Tên tour bắt buộc, tối đa 200 ký tự.");
        if (req.MaxSeats <= 0)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Số chỗ phải lớn hơn 0.");
        if (!ValidStatus.Contains(req.Status))
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Trạng thái chỉ nhận Draft, Published hoặc Hidden.");
        // A4: ngày đi phải hợp lệ (Start < End).
        if (req.StartDate.HasValue && req.EndDate.HasValue && req.StartDate.Value >= req.EndDate.Value)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Ngày bắt đầu phải trước ngày kết thúc.");
    }

    private static void ValidatePrice(CreatePriceRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.SourceName))
            throw new AppException(HttpStatusCode.UnprocessableEntity, "VALIDATION_ERROR", "Thiếu nguồn giá.");
        if (req.PriceValue <= 0)
            throw new AppException(HttpStatusCode.UnprocessableEntity, "VALIDATION_ERROR", "Giá phải lớn hơn 0.");
        if (req.EffectiveDate < DateTime.UtcNow.AddDays(-1))
            throw new AppException(HttpStatusCode.UnprocessableEntity, "VALIDATION_ERROR", "Ngày hiệu lực không được quá khứ quá 1 ngày.");
    }

    private static TourListDto BuildListDto(Tour t, DateTime now)
    {
        var effective = PricingHelper.EffectivePrices(t.Prices, now);
        // B1/M01: lifetime capacity — Completed vẫn chiếm chỗ, chỉ trừ Cancelled.
        var booked = t.Bookings.Where(b => b.Status != "Cancelled").Sum(b => b.Quantity);
        return new TourListDto
        {
            Id = t.Id,
            TourName = t.TourName,
            Thumbnail = t.Images.OrderBy(i => i.SortOrder).FirstOrDefault()?.ImageUrl ?? string.Empty,
            PriceFrom = effective.Count == 0 ? 0 : effective.Min(p => p.PriceValue),
            Destination = t.Destination is null ? null : new DestinationBriefDto { Id = t.Destination.Id, Name = t.Destination.Name, RegionName = t.Destination.RegionName },
            Status = t.Status,
            MaxSeats = t.MaxSeats,
            BookedSeats = booked,
            AvailableSeats = Math.Max(0, t.MaxSeats - booked),
            StartDate = t.StartDate,
            EndDate = t.EndDate
        };
    }

    private static TourDetailDto BuildDetailDto(Tour t, DateTime now)
    {
        var list = BuildListDto(t, now);
        return new TourDetailDto
        {
            Id = list.Id, TourName = list.TourName, Thumbnail = list.Thumbnail, PriceFrom = list.PriceFrom,
            Destination = list.Destination, Status = list.Status,
            MaxSeats = list.MaxSeats, BookedSeats = list.BookedSeats, AvailableSeats = list.AvailableSeats,
            StartDate = list.StartDate, EndDate = list.EndDate,
            Description = t.Description, DestinationId = t.DestinationId,
            Images = t.Images.OrderBy(i => i.SortOrder).Select(ToImageDto).ToList(),
            Prices = PricingHelper.EffectivePrices(t.Prices, now).OrderByDescending(p => p.EffectiveDate).Select(ToPriceDto).ToList()
        };
    }

    private static PriceDto ToPriceDto(Price p) => new()
    {
        Id = p.Id, SourceName = p.SourceName, PriceValue = p.PriceValue, EffectiveDate = p.EffectiveDate
    };

    private static ImageDto ToImageDto(Image i) => new()
    {
        Id = i.Id, ImageUrl = i.ImageUrl, Caption = i.Caption, SortOrder = i.SortOrder
    };
}
