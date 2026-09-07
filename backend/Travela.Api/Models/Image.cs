namespace Travela.Api.Models;

// images: chỉ lưu URL chuỗi tối đa 500 ký tự, không lưu blob.
public class Image
{
    public int Id { get; set; }
    public int TourId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public Tour? Tour { get; set; }
}
