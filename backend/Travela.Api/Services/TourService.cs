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
            .Include(x => x.Destination).Include(x => x.Prices).Include(x => x.Images)
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
        var old = $"{t.TourName}|{t.Status}";
        t.TourName = req.TourName.Trim();
        t.Description = req.Description?.Trim() ?? string.Empty;
        t.DestinationId = req.DestinationId;
        t.MaxSeats = req.MaxSeats;
        t.Status = req.Status;
        await _db.SaveChangesAsync();
        await _audit.LogAsync(actorId, "Tour.Update", "Tour", id, old, $"{t.TourName}|{t.Status}");
        return await GetDetailAsync(id, publicOnly: false);
    }

    public async Task<object> DeleteAsync(int id, int actorId)
    {
        var t = await _db.Tours.Include(x => x.Prices).Include(x => x.Images).FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy tour.");
        // Có booking thì không xóa cứng: chuyển Hidden (FK Restrict cũng chặn).
        if (await _db.Bookings.AnyAsync(b => b.TourId == id))
        {
            var old = t.Status;
            t.Status = "Hidden";
            await _db.SaveChangesAsync();
            await _audit.LogAsync(actorId, "Tour.Update", "Tour", id, old, "Hidden");
            return new { hidden = true, message = "Tour đã có booking nên chuyển sang Hidden thay vì xóa." };
        }
        _db.Prices.RemoveRange(t.Prices);
        _db.Images.RemoveRange(t.Images);
        _db.Tours.Remove(t);
        await _db.SaveChangesAsync();
        await _audit.LogAsync(actorId, "Tour.Delete", "Tour", id, t.TourName, null);
        return new { hidden = false, message = "Đã xóa tour." };
    }

    public async Task<List<PriceDto>> ListPricesAsync(int tourId)
    {
        await RequireTourAsync(tourId);
        var now = DateTime.UtcNow;
        return await _db.Prices.AsNoTracking().Where(p => p.TourId == tourId && p.EffectiveDate <= now)
            .OrderByDescending(p => p.EffectiveDate)
            .Select(p => new PriceDto { Id = p.Id, SourceName = p.SourceName, PriceValue = p.PriceValue, EffectiveDate = p.EffectiveDate })
            .ToListAsync();
    }

    public async Task<PriceDto> CreatePriceAsync(int tourId, CreatePriceRequest req, int actorId)
    {
        await RequireTourAsync(tourId);
        ValidatePrice(req);
        var p = new Price
        {
            TourId = tourId, SourceName = req.SourceName.Trim(), PriceValue = req.PriceValue,
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
        p.SourceName = req.SourceName.Trim();
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

    public async Task<ImageDto> CreateImageAsync(int tourId, CreateImageRequest req)
    {
        await RequireTourAsync(tourId);
        if (string.IsNullOrWhiteSpace(req.ImageUrl) || req.ImageUrl.Trim().Length > 500 ||
            !Uri.TryCreate(req.ImageUrl.Trim(), UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            throw new AppException(HttpStatusCode.UnprocessableEntity, "VALIDATION_ERROR", "image_url phải là URL http/https, tối đa 500 ký tự.");
        if (await _db.Images.CountAsync(i => i.TourId == tourId) >= 10)
            throw new AppException(HttpStatusCode.BadRequest, "TOO_MANY_IMAGES", "Mỗi tour tối đa 10 ảnh.");
        var img = new Image
        {
            TourId = tourId, ImageUrl = req.ImageUrl.Trim(),
            Caption = req.Caption?.Trim() ?? string.Empty, SortOrder = req.SortOrder
        };
        _db.Images.Add(img);
        await _db.SaveChangesAsync();
        return ToImageDto(img);
    }

    public async Task DeleteImageAsync(int id)
    {
        var img = await _db.Images.FindAsync(id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy ảnh.");
        _db.Images.Remove(img);
        await _db.SaveChangesAsync();
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
        var effective = EffectivePrices(t, now);
        return new TourListDto
        {
            Id = t.Id,
            TourName = t.TourName,
            Thumbnail = t.Images.OrderBy(i => i.SortOrder).FirstOrDefault()?.ImageUrl ?? string.Empty,
            PriceFrom = effective.Count == 0 ? 0 : effective.Min(p => p.PriceValue),
            Destination = t.Destination is null ? null : new DestinationBriefDto { Id = t.Destination.Id, Name = t.Destination.Name, RegionName = t.Destination.RegionName },
            Status = t.Status
        };
    }

    private static TourDetailDto BuildDetailDto(Tour t, DateTime now)
    {
        var list = BuildListDto(t, now);
        return new TourDetailDto
        {
            Id = list.Id, TourName = list.TourName, Thumbnail = list.Thumbnail, PriceFrom = list.PriceFrom,
            Destination = list.Destination, Status = list.Status,
            Description = t.Description, MaxSeats = t.MaxSeats, DestinationId = t.DestinationId,
            Images = t.Images.OrderBy(i => i.SortOrder).Select(ToImageDto).ToList(),
            Prices = EffectivePrices(t, now).OrderByDescending(p => p.EffectiveDate).Select(ToPriceDto).ToList()
        };
    }

    private static List<Price> EffectivePrices(Tour t, DateTime now)
    {
        return t.Prices.Where(p => p.EffectiveDate <= now)
            .GroupBy(p => p.SourceName)
            .Select(g => g.OrderByDescending(p => p.EffectiveDate).First())
            .ToList();
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
