namespace Travela.Api.DTOs.Booking;

public class CreateBookingRequest
{
    public int TourId { get; set; }
    // Legacy: nếu không gửi breakdown thì dùng Quantity với giá min (giữ tương thích).
    public int Quantity { get; set; }
    // Breakdown theo loại khách (F2 redesign) — server tính tiền từ các giá hiệu lực.
    public int AdultQty { get; set; }
    public int ChildQty { get; set; }
    public int SupplementQty { get; set; }
    public string PaymentMethod { get; set; } = "Mock";
    public string? ContactName { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactAddress { get; set; }
    public string? Note { get; set; }
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
    public DateTime? DepartureDate { get; set; }
    public string? ContactName { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactAddress { get; set; }
    public string? Note { get; set; }
    public List<TrackingStepDto> Tracking { get; set; } = new();
    public CheckoutDto? Checkout { get; set; }
}
