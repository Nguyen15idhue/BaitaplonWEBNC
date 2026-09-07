import { api } from "./api";
import type { PagedResult, User } from "../types";

// User admin thật (B2): search username/email, phân trang, đổi role, khóa/mở.
export interface UserQuery {
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listUsers(q: UserQuery = {}): Promise<PagedResult<User>> {
  const res = await api.get<PagedResult<User>>("/users", {
    params: {
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 12,
      ...(q.search ? { search: q.search } : {}),
    },
  });
  return res.data;
}

export async function updateUserRole(id: number, role: "Admin" | "Customer"): Promise<User> {
  const res = await api.put<User>(`/users/${id}/role`, { role });
  return res.data;
}

export async function updateUserLock(id: number, locked: boolean): Promise<User> {
  const res = await api.put<User>(`/users/${id}/lock`, { locked });
  return res.data;
}
