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

    public User? User { get; set; }
    public Tour? Tour { get; set; }
    public Checkout? Checkout { get; set; }
}
