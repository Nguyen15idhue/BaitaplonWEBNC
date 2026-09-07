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

export async function getHealth(): Promise<{ status: string; db: string; time: string }> {
  const res = await axios.get("/health");
  return res.data;
}
