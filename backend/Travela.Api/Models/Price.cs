namespace Travela.Api.Models;

// prices: giá đa nguồn theo tour, price_value > 0, kèm ngày hiệu lực.
public class Price
{
    public int Id { get; set; }
    public int TourId { get; set; }
    public string SourceName { get; set; } = string.Empty;
    public decimal PriceValue { get; set; }
    public DateTime EffectiveDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Tour? Tour { get; set; }
}
