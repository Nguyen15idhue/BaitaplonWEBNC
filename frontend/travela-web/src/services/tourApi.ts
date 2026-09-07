import { api } from "./api";
import axios from "axios";
import type { PagedResult, Tour, TourDetail, TourPrice } from "../types";

// Tour thật (B3 xong): list published + filter/sort/page, detail kèm images + prices.
export interface TourQuery {
  search?: string;
  destinationId?: number;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export async function getTours(q: TourQuery = {}): Promise<PagedResult<Tour>> {
  const res = await api.get<PagedResult<Tour>>("/tours", {
    params: {
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 12,
      ...(q.search ? { search: q.search } : {}),
      ...(q.destinationId ? { destinationId: q.destinationId } : {}),
      ...(q.minPrice !== undefined ? { minPrice: q.minPrice } : {}),
      ...(q.maxPrice !== undefined ? { maxPrice: q.maxPrice } : {}),
      ...(q.sort ? { sort: q.sort } : {}),
    },
  });
  return res.data;
}

export async function getTourDetail(id: number): Promise<TourDetail> {
  const res = await api.get<TourDetail>(`/tours/${id}`);
  return res.data;
}

export async function getTourPrices(id: number): Promise<TourPrice[]> {
  const res = await api.get<TourPrice[]>(`/tours/${id}/prices`);
  return res.data;
}

// Admin: xem tất cả trạng thái (public chỉ Published).
export async function adminListTours(q: TourQuery & { status?: string } = {}): Promise<PagedResult<Tour>> {
  const res = await api.get<PagedResult<Tour>>("/tours/all", {
    params: {
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 12,
      ...(q.search ? { search: q.search } : {}),
      ...(q.destinationId ? { destinationId: q.destinationId } : {}),
      ...(q.status ? { status: q.status } : {}),
    },
  });
  return res.data;
}

export async function getHealth(): Promise<{ status: string; db: string; time: string }> {
  const res = await axios.get("/health");
  return res.data;
}

// Admin (B3): CRUD tour + giá + ảnh. Validate FE trùng BE.
export interface TourForm {
  tourName: string;
  description: string;
  destinationId: number;
  maxSeats: number;
  status: string;
}

export async function createTour(body: TourForm): Promise<TourDetail> {
  const res = await api.post<TourDetail>("/tours", body);
  return res.data;
}

export async function updateTour(id: number, body: TourForm): Promise<TourDetail> {
  const res = await api.put<TourDetail>(`/tours/${id}`, body);
  return res.data;
}

export async function deleteTour(id: number): Promise<{ hidden: boolean; message: string }> {
  const res = await api.delete<{ hidden: boolean; message: string }>(`/tours/${id}`);
  return res.data;
}

export async function createPrice(
  tourId: number,
  body: { sourceName: string; priceValue: number; effectiveDate: string },
): Promise<TourPrice> {
  const res = await api.post<TourPrice>(`/tours/${tourId}/prices`, body);
  return res.data;
}

export async function deletePrice(id: number): Promise<void> {
  await api.delete(`/prices/${id}`);
}

export async function createImage(
  tourId: number,
  body: { imageUrl: string; caption: string; sortOrder: number },
): Promise<void> {
  await api.post(`/tours/${tourId}/images`, body);
}

export async function deleteImage(id: number): Promise<void> {
  await api.delete(`/images/${id}`);
}
