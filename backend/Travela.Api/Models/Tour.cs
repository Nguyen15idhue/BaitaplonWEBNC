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
    // A4: ngày khởi hành/kết thúc (nullable để tương thích tour cũ/seed).
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public Destination? Destination { get; set; }
    public ICollection<Price> Prices { get; set; } = new List<Price>();
    public ICollection<Image> Images { get; set; } = new List<Image>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
