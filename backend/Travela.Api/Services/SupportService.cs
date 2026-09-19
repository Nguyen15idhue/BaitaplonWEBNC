using System.Net;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Travela.Api.Data;
using Travela.Api.DTOs.Common;
using Travela.Api.DTOs.Support;
using Travela.Api.Helpers;
using Travela.Api.Middleware;
using Travela.Api.Models;

namespace Travela.Api.Services;

// SupportService: tiếp nhận liên hệ public + admin xử lý theo New -> InProgress -> Resolved.
public class SupportService
{
    private readonly TravelaDbContext _db;
    private readonly AuditLogService _audit;
    private static readonly string[] ValidStatus = ["New", "InProgress", "Resolved"];
    private static readonly Regex EmailRe = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled);

    private static readonly Dictionary<string, string[]> Next = new()
    {
        ["New"] = ["InProgress", "Resolved"],
        ["InProgress"] = ["Resolved"],
        ["Resolved"] = [],
    };

    public SupportService(TravelaDbContext db, AuditLogService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<SupportRequestDto> CreateAsync(CreateSupportRequest req, int? userId)
    {
        Validate(req);
        var s = new SupportRequest
        {
            UserId = userId,
            Name = req.Name.Trim(), Email = req.Email.Trim(),
            Phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim(),
            Subject = req.Subject.Trim(), Message = req.Message.Trim(),
            Status = "New", CreatedAt = DateTime.UtcNow
        };
        _db.SupportRequests.Add(s);
        await _db.SaveChangesAsync();
        await _audit.LogAsync(userId, "Support.Create", "SupportRequest", s.Id, null, s.Subject);
        return ToDto(s);
    }

    public async Task<PagedResult<SupportRequestDto>> ListAsync(
        string? status, string? search, int page, int pageSize)
    {
        (page, pageSize) = PaginationHelper.Normalize(page, pageSize);
        var q = _db.SupportRequests.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(x => x.Status == status);
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(x => x.Name.Contains(search) || x.Email.Contains(search) || x.Subject.Contains(search));
        var total = await q.CountAsync();
        var rows = await q.OrderByDescending(x => x.Id).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return PaginationHelper.ToPagedResult(rows.Select(ToDto).ToList(), total, page, pageSize);
    }

    public async Task<SupportRequestDto> GetAsync(int id)
    {
        var s = await _db.SupportRequests.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy yêu cầu.");
        return ToDto(s);
    }

    public async Task<PagedResult<SupportRequestDto>> MineAsync(int userId, int page, int pageSize)
    {
        (page, pageSize) = PaginationHelper.Normalize(page, pageSize);
        var q = _db.SupportRequests.AsNoTracking().Where(x => x.UserId == userId);
        var total = await q.CountAsync();
        var rows = await q.OrderByDescending(x => x.Id).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return PaginationHelper.ToPagedResult(rows.Select(ToDto).ToList(), total, page, pageSize);
    }

    public async Task<SupportRequestDto> UpdateStatusAsync(int id, UpdateSupportStatusRequest req, int actorId)
    {
        if (!ValidStatus.Contains(req.Status))
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Trạng thái chỉ nhận New, InProgress hoặc Resolved.");
        if ((req.AdminNote?.Length ?? 0) > 1000)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Ghi chú tối đa 1000 ký tự.");
        var s = await _db.SupportRequests.FindAsync(id)
            ?? throw new AppException(HttpStatusCode.NotFound, "NOT_FOUND", "Không tìm thấy yêu cầu.");
        if (!Next[s.Status].Contains(req.Status))
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR",
                $"Không thể chuyển từ {s.Status} sang {req.Status}.");
        var old = s.Status;
        s.Status = req.Status;
        s.AdminNote = string.IsNullOrWhiteSpace(req.AdminNote) ? s.AdminNote : req.AdminNote.Trim();
        s.HandledBy = actorId;
        s.HandledAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _audit.LogAsync(actorId, "Support.Status", "SupportRequest", id, old, s.Status);
        return ToDto(s);
    }

    private static void Validate(CreateSupportRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Trim().Length is < 2 or > 100)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Họ tên từ 2–100 ký tự.");
        if (string.IsNullOrWhiteSpace(req.Email) || !EmailRe.IsMatch(req.Email.Trim()))
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Email không hợp lệ.");
        if ((req.Phone?.Trim().Length ?? 0) > 20)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Số điện thoại tối đa 20 ký tự.");
        if (string.IsNullOrWhiteSpace(req.Subject) || req.Subject.Trim().Length is < 5 or > 200)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Chủ đề từ 5–200 ký tự.");
        if (string.IsNullOrWhiteSpace(req.Message) || req.Message.Trim().Length is < 10 or > 2000)
            throw new AppException(HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Nội dung từ 10–2000 ký tự.");
    }

    private static SupportRequestDto ToDto(SupportRequest s) => new()
    {
        Id = s.Id, UserId = s.UserId, Name = s.Name, Email = s.Email, Phone = s.Phone,
        Subject = s.Subject, Message = s.Message, Status = s.Status,
        AdminNote = s.AdminNote, HandledBy = s.HandledBy,
        HandledAt = s.HandledAt, CreatedAt = s.CreatedAt
    };
}
