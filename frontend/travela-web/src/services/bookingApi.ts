import { api } from "./api";
import type { Booking, Checkout, PagedResult } from "../types";

// Booking + Checkout thật (B4 xong): customer tạo/xem/hủy own.
// H08: mỗi lần bấm đặt sinh Idempotency-Key riêng — retry mạng không tạo trùng đơn.
// F2 redesign: gửi breakdown loại khách + thông tin liên hệ; BE tự tính tiền từ giá hiệu lực.
export interface CreateBookingInput {
  tourId: number;
  adultQty: number;
  childQty: number;
  supplementQty: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  note?: string;
  paymentMethod?: string;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const key = crypto.randomUUID();
  const res = await api.post<Booking>(
    "/bookings",
    { paymentMethod: "Mock", ...input },
    { headers: { "Idempotency-Key": key } },
  );
  return res.data;
}

export async function getMyBookings(status?: string, page = 1, pageSize = 12): Promise<PagedResult<Booking>> {
  const res = await api.get<PagedResult<Booking>>("/bookings", {
    params: { page, pageSize, ...(status ? { status } : {}) },
  });
  return res.data;
}

export async function getBooking(id: number): Promise<Booking> {
  const res = await api.get<Booking>(`/bookings/${id}`);
  return res.data;
}

export async function cancelBooking(id: number): Promise<Booking> {
  const res = await api.put<Booking>(`/bookings/${id}/cancel`);
  return res.data;
}

// A2: thanh toán bổ sung cho đơn PendingPayment kẹt.
export async function payBooking(id: number): Promise<Booking> {
  const res = await api.post<Booking>(`/bookings/${id}/pay`);
  return res.data;
}

export async function getCheckout(id: number): Promise<Checkout> {
  const res = await api.get<Checkout>(`/checkouts/${id}`);
  return res.data;
}

// Admin (B4): xem tất cả + chuyển trạng thái đúng state machine.
export async function adminListBookings(status?: string, page = 1, pageSize = 12): Promise<PagedResult<Booking>> {
  return getMyBookings(status, page, pageSize);
}

export async function updateBookingStatus(id: number, status: string, note: string): Promise<Booking> {
  const res = await api.put<Booking>(`/bookings/${id}/status`, { status, note });
  return res.data;
}
