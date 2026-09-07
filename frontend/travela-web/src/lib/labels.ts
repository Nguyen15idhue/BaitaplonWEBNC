// Nhãn tiếng Việt dùng chung toàn app (F4.1). BE giữ mã gốc, FE chỉ dịch khi hiển thị.
export const BOOKING_STATUS_LABEL: Record<string, string> = {
  PendingPayment: "Chờ thanh toán",
  Pending: "Chờ xử lý",
  Paid: "Đã thanh toán",
  Confirmed: "Đã xác nhận",
  Ongoing: "Đang diễn ra",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};

export const TOUR_STATUS_LABEL: Record<string, string> = {
  Draft: "Nháp",
  Published: "Đang bán",
  Hidden: "Tạm ẩn",
};

export const ROLE_LABEL: Record<string, string> = {
  Admin: "Quản trị",
  Customer: "Khách hàng",
};

export const USER_STATUS_LABEL: Record<string, string> = {
  Active: "Đang hoạt động",
  Locked: "Đã khóa",
};

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  "User.Lock": "Khóa người dùng",
  "User.Unlock": "Mở khóa người dùng",
  "User.Role": "Đổi quyền",
  "Tour.Create": "Tạo tour",
  "Tour.Update": "Sửa tour",
  "Tour.Delete": "Xóa tour",
  "Price.Create": "Thêm giá",
  "Price.Update": "Sửa giá",
  "Price.Delete": "Xóa giá",
  "Booking.Create": "Tạo đơn",
  "Booking.Status": "Đổi trạng thái đơn",
};

export function label(map: Record<string, string>, code: string): string {
  return map[code] ?? code;
}
