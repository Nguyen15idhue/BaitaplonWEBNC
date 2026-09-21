namespace Travela.Api.Models;

// bookings: TrackingTrace là chuỗi JSON [{status, at, by, note}], B4 append mỗi lần đổi trạng thái.
public class Booking
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int TourId { get; set; }
    public DateTime BookingDate { get; set; } = DateTime.UtcNow;
    public int Quantity { get; set; }
    public string Status { get; set; } = "PendingPayment";
    public string TrackingTrace { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    // Thông tin liên hệ khách hàng (F2 redesign, nullable để tương thích data cũ).
    public string? ContactName { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Note { get; set; }
    // M12: optimistic concurrency cho state machine (tăng mỗi lần đổi trạng thái).
    public long Version { get; set; }

    public User? User { get; set; }
    public Tour? Tour { get; set; }
    public Checkout? Checkout { get; set; }
}
