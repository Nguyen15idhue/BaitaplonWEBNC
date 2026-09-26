using Travela.Api.Models;

namespace Travela.Api.Helpers;

// Nguồn sự thật duy nhất cho "giá hiệu lực" (D3):
// bản mới nhất từng nguồn (canonical) có EffectiveDate <= now, rồi MIN.
// TourService (hiển thị) và BookingService (tính tiền) cùng gọi.
public static class PricingHelper
{
    public static string NormalizeSource(string? source)
        => (source ?? string.Empty).Trim().ToLowerInvariant();

    public static List<Price> EffectivePrices(IEnumerable<Price> prices, DateTime now)
    {
        return prices.Where(p => p.EffectiveDate <= now)
            .GroupBy(p => NormalizeSource(p.SourceName))
            .Select(g => g.OrderByDescending(p => p.EffectiveDate).ThenByDescending(p => p.Id).First())
            .ToList();
    }

    public static decimal EffectiveMin(IEnumerable<Price> prices, DateTime now)
    {
        var effective = EffectivePrices(prices, now);
        return effective.Count == 0 ? 0 : effective.Min(p => p.PriceValue);
    }

    // Giá hiệu lực của nguồn khớp đầu tiên (so khớp đã chuẩn hóa). 0 nếu không có nguồn nào.
    public static decimal EffectiveForSource(IEnumerable<Price> prices, DateTime now, params string[] sources)
    {
        var effective = EffectivePrices(prices, now);
        foreach (var s in sources)
        {
            var match = effective.FirstOrDefault(p => NormalizeSource(p.SourceName) == NormalizeSource(s));
            if (match is not null) return match.PriceValue;
        }
        return 0;
    }
}
