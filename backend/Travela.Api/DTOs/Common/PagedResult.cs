namespace Travela.Api.DTOs.Common;

// Chuẩn phân trang mọi API danh sách: { items, page, pageSize, total }.
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int Total { get; set; }
}
