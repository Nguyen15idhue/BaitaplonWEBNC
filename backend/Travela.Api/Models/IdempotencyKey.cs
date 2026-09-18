namespace Travela.Api.Models;

// H08: chống duplicate booking do retry mạng — 1 key chỉ tạo 1 booking.
public class IdempotencyKey
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Key { get; set; } = string.Empty;
    public int BookingId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public Booking? Booking { get; set; }
}
