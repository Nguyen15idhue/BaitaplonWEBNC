using Travela.Api.Helpers;
using Travela.Api.Models;

namespace Travela.Tests;

// M11/D3: regression cho nguồn sự thật giá hiệu lực duy nhất.
// List/detail hiển thị và checkout tính tiền cùng gọi PricingHelper.
public class PricingHelperTests
{
    private static Price P(int id, string source, decimal value, DateTime eff) => new()
    {
        Id = id, TourId = 1, SourceName = source, PriceValue = value,
        EffectiveDate = eff, CreatedAt = eff
    };

    [Fact]
    public void EffectiveMin_LayMinCuaBanMoiNhatTungNguon()
    {
        var now = DateTime.UtcNow;
        var prices = new List<Price>
        {
            P(1, "Website", 1000, now.AddDays(-30)),
            P(2, "Website", 900, now.AddDays(-1)),   // mới nhất Website
            P(3, "Doi tac", 1200, now.AddDays(-60)),
            P(4, "Tuong lai", 100, now.AddDays(1)),  // chưa hiệu lực -> loại
        };
        Assert.Equal(900, PricingHelper.EffectiveMin(prices, now));
    }

    [Fact]
    public void EffectiveMin_Rong_Tra0()
    {
        Assert.Equal(0, PricingHelper.EffectiveMin(new List<Price>(), DateTime.UtcNow));
    }

    [Fact]
    public void EffectivePrices_KhongPhanBietHoaThuongNguon()
    {
        var now = DateTime.UtcNow;
        var prices = new List<Price>
        {
            P(1, "Website", 1000, now.AddDays(-30)),
            P(2, "website", 800, now.AddDays(-1)), // cùng nguồn sau chuẩn hóa
        };
        var eff = PricingHelper.EffectivePrices(prices, now);
        Assert.Single(eff);
        Assert.Equal(800, eff[0].PriceValue);
    }

    [Fact]
    public void EffectivePrices_CungNgay_ChonIdLonNhat()
    {
        var at = DateTime.UtcNow.AddDays(-5);
        var prices = new List<Price>
        {
            P(1, "Website", 1000, at),
            P(2, "Website", 1100, at), // tie -> deterministic chọn mới nhất
        };
        var eff = PricingHelper.EffectivePrices(prices, now: DateTime.UtcNow);
        Assert.Single(eff);
        Assert.Equal(2, eff[0].Id);
    }

    [Fact]
    public void EffectiveMin_ChiTinhGiaHieuLuc()
    {
        var now = DateTime.UtcNow;
        var prices = new List<Price> { P(1, "Website", 500, now.AddDays(2)) };
        Assert.Equal(0, PricingHelper.EffectiveMin(prices, now));
    }
}
