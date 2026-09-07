import { api } from "./api";
import type { Booking, Checkout, PagedResult } from "../types";

// Booking + Checkout thật (B4 xong): customer tạo/xem/hủy own.
export async function createBooking(tourId: number, quantity: number): Promise<Booking> {
  const res = await api.post<Booking>("/bookings", { tourId, quantity, paymentMethod: "Mock" });
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
