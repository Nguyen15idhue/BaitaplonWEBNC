import { api } from "./api";
import type { PagedResult, User } from "../types";

// User admin thật (B2): search username/email, phân trang, đổi role, khóa/mở.
export interface UserQuery {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listUsers(q: UserQuery = {}): Promise<PagedResult<User>> {
  const res = await api.get<PagedResult<User>>("/users", {
    params: {
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 12,
      ...(q.search ? { search: q.search } : {}),
      ...(q.role ? { role: q.role } : {}),
      ...(q.status ? { status: q.status } : {}),
    },
  });
  return res.data;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  role: "Admin" | "Customer";
  status: "Active" | "Locked";
}

export interface UpdateUserInput {
  email: string;
  role: "Admin" | "Customer";
  status: "Active" | "Locked";
  newPassword?: string;
}

export async function createUser(body: CreateUserInput): Promise<User> {
  const res = await api.post<User>("/users", body);
  return res.data;
}

export async function updateUser(id: number, body: UpdateUserInput): Promise<User> {
  const res = await api.put<User>(`/users/${id}`, body);
  return res.data;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function updateUserRole(id: number, role: "Admin" | "Customer"): Promise<User> {
  const res = await api.put<User>(`/users/${id}/role`, { role });
  return res.data;
}

export async function updateUserLock(id: number, locked: boolean): Promise<User> {
  const res = await api.put<User>(`/users/${id}/lock`, { locked });
  return res.data;
}
