namespace Travela.Api.Models;

// tours: status Draft|Published|Hidden. Xóa tour có booking = chuyển Hidden.
public class Tour
{
    public int Id { get; set; }
    public int DestinationId { get; set; }
    public string TourName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int MaxSeats { get; set; }
    public string Status { get; set; } = "Draft";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    // A4: ngày bắt đầu (kiêm khởi hành) / kết thúc, kèm giờ (nullable để tương thích tour cũ/seed).
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    // Main: thông tin khởi hành hiển thị (nullable để tương thích tour cũ/seed).
    public string? DepartureLocation { get; set; }
    public string? Duration { get; set; }
    // Nội dung chi tiết tour (nullable để tương thích tour cũ/seed).
    public string? Route { get; set; }
    public string? Itinerary { get; set; }
    public string? Transport { get; set; }
    public string? Accommodation { get; set; }
    public string? Meals { get; set; }
    public string? Sightseeing { get; set; }
    public string? Guide { get; set; }
    public string? Included { get; set; }
    public string? Excluded { get; set; }
    public string? Audience { get; set; }
    public string? Insurance { get; set; }
    public string? Terms { get; set; }
    public string? ContactInfo { get; set; }
    // Redesign: điều kiện tour chi tiết + lịch trình từng ngày (JSON).
    public string? PaymentTerms { get; set; }
    public string? CancellationPolicy { get; set; }
    public string? ApplicationConditions { get; set; }
    public string? ItineraryDays { get; set; }

    public Destination? Destination { get; set; }
    public ICollection<Price> Prices { get; set; } = new List<Price>();
    public ICollection<Image> Images { get; set; } = new List<Image>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
