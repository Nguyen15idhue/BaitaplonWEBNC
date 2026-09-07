using System.Net;
using Microsoft.EntityFrameworkCore;
using Travela.Api.Data;
using Travela.Api.DTOs.Common;
using Travela.Api.DTOs.Destination;
using Travela.Api.Helpers;
using Travela.Api.Middleware;
using Travela.Api.Models;

namespace Travela.Api.Services;

// DestinationService: public đọc, Admin ghi. Xóa destination còn tour thì chặn.
public class DestinationService
{
    private readonly TravelaDbContext _db;

    public DestinationService(TravelaDbContext db)
    {
        _db = db;
    }

    private static DestinationDto ToDto(Destination d) => new()
    {
        Id = d.Id, Name = d.Name, RegionName = d.RegionName, Description = d.Description
    };

    public async Task<List<DestinationDto>> ListAsync(string? search)
    {
        var q = _db.Destinations.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(d => d.Name.Contains(search) || d.RegionName.Contains(search));
        return (await q.OrderBy(d => d.Id).ToListAsync()).Select(ToDto).ToList();
    }

    public async Task<DestinationDto> GetAsync(int id)
    {
        var d = await _db.Destinations.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy điểm đến.");
        return ToDto(d);
    }

    public async Task<DestinationDto> CreateAsync(CreateDestinationRequest req)
    {
        Validate(req);
        var d = new Destination { Name = req.Name.Trim(), RegionName = req.RegionName.Trim(), Description = req.Description?.Trim() ?? string.Empty };
        _db.Destinations.Add(d);
        await _db.SaveChangesAsync();
        return ToDto(d);
    }

    public async Task<DestinationDto> UpdateAsync(int id, CreateDestinationRequest req)
    {
        Validate(req);
        var d = await _db.Destinations.FindAsync(id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy điểm đến.");
        d.Name = req.Name.Trim();
        d.RegionName = req.RegionName.Trim();
        d.Description = req.Description?.Trim() ?? string.Empty;
        await _db.SaveChangesAsync();
        return ToDto(d);
    }

    public async Task DeleteAsync(int id)
    {
        var d = await _db.Destinations.FindAsync(id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy điểm đến.");
        if (await _db.Tours.AnyAsync(t => t.DestinationId == id))
            throw new AppException(HttpStatusCode.BadRequest, "HAS_TOURS", "Không thể xóa điểm đến còn tour.");
        _db.Destinations.Remove(d);
        await _db.SaveChangesAsync();
    }

    private static void Validate(CreateDestinationRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Trim().Length > 200)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Tên điểm đến bắt buộc, tối đa 200 ký tự.");
        if (req.RegionName?.Trim() is not ("Bắc" or "Trung" or "Nam"))
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Vùng chỉ nhận Bắc, Trung hoặc Nam.");
    }
}
