namespace Travela.Api.DTOs.Booking;

public class CreateBookingRequest
{
    public int TourId { get; set; }
    public int Quantity { get; set; }
    public string PaymentMethod { get; set; } = "Mock";
}

public class UpdateStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
}

public class TrackingStepDto
{
    public string Status { get; set; } = string.Empty;
    public DateTime At { get; set; }
    public string By { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
}

public class CheckoutDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string? TransactionRef { get; set; }
}

public class BookingDto
{
    public int Id { get; set; }
    public int TourId { get; set; }
    public string TourName { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime BookingDate { get; set; }
    public List<TrackingStepDto> Tracking { get; set; } = new();
    public CheckoutDto? Checkout { get; set; }
}
