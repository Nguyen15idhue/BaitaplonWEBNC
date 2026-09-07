namespace Travela.Api.Models;

// checkouts: quan hệ 1-1 với bookings qua BookingId unique. Amount do server tính.
public class Checkout
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public string PaymentMethod { get; set; } = "Mock";
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Pending";
    public string? TransactionRef { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Booking? Booking { get; set; }
}
