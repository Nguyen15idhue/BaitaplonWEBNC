import { api } from "./api";
import type { AdminStats } from "../types";

// C07/A5: số liệu aggregate ở BE, FE không cộng tay theo page.
export async function getAdminStats(): Promise<AdminStats> {
  const res = await api.get<AdminStats>("/admin/stats");
  return res.data;
}
