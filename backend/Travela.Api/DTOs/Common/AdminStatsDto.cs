namespace Travela.Api.DTOs.Common;

// Stats cho Dashboard admin (C07/A5): aggregate ở DB, không cộng tay ở FE.
public class AdminStatsDto
{
    public int UsersTotal { get; set; }
    public int ToursTotal { get; set; }
    public int BookingsTotal { get; set; }
    public decimal RevenuePaid { get; set; }
    public Dictionary<string, int> BookingsByStatus { get; set; } = new();
    public List<TopTourDto> TopTours { get; set; } = new();
}

public class TopTourDto
{
    public int TourId { get; set; }
    public string TourName { get; set; } = string.Empty;
    public int Sold { get; set; }
}
