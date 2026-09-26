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

// Ngày + giờ (giờ trình duyệt) cho các mốc bắt đầu/kết thúc/khởi hành.
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ISO (UTC) -> giá trị cho <input type="datetime-local"> theo giờ địa phương.
export function toLocalInput(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Giá trị datetime-local -> ISO UTC (rỗng -> null).
export function fromLocalInput(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
