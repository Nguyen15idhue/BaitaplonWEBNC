// Format tiền VND dùng chung (giá BE trả là VND). Giá 0/chưa có → "Liên hệ".
export function formatVND(value: number): string {
  if (!value || value <= 0) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

const BOOKING_TONE: Record<string, "muted" | "primary" | "success" | "danger"> = {
  PendingPayment: "muted",
  Paid: "primary",
  Confirmed: "primary",
  Ongoing: "primary",
  Completed: "success",
  Cancelled: "danger",
};

export function bookingTone(status: string): "muted" | "primary" | "success" | "danger" {
  return BOOKING_TONE[status] ?? "muted";
}
