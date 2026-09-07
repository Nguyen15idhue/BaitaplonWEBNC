using Travela.Api.DTOs.Common;

namespace Travela.Api.Helpers;

// Phân trang chuẩn: page/pageSize mặc định 1/12, chặn tối đa 50 (NFR).
public static class PaginationHelper
{
    public const int DefaultPageSize = 12;
    public const int MaxPageSize = 50;

    public static (int Page, int PageSize) Normalize(int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = DefaultPageSize;
        if (pageSize > MaxPageSize) pageSize = MaxPageSize;
        return (page, pageSize);
    }

    public static PagedResult<T> ToPagedResult<T>(List<T> items, int total, int page, int pageSize)
    {
        return new PagedResult<T> { Items = items, Total = total, Page = page, PageSize = pageSize };
    }
}
