import { api } from "./api";
import axios from "axios";
import type { PagedResult, Tour } from "../types";

// Skeleton: gọi API thật, lỗi thì trả mock rỗng để F0 demo được khi BE chưa có data.
export async function getTours(page = 1, pageSize = 12): Promise<PagedResult<Tour>> {
  try {
    const res = await api.get<PagedResult<Tour>>("/tours", { params: { page, pageSize } });
    return res.data;
  } catch {
    return { items: [], page, pageSize, total: 0 };
  }
}

export async function getHealth(): Promise<{ status: string; db: string; time: string }> {
  const res = await axios.get("/health");
  return res.data;
}
