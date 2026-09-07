import { api } from "./api";
import { clearSession, getRefreshToken, setSession } from "../lib/auth-store";
import type { AuthResponse, User } from "../types";

// Auth thật theo contract V1 (docs/phan-cong/backend/api.md mục 2).
export async function register(username: string, email: string, password: string): Promise<User> {
  const res = await api.post<User>("/auth/register", { username, email, password });
  return res.data;
}

export async function login(usernameOrEmail: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/login", { usernameOrEmail, password });
  const { accessToken, refreshToken, user } = res.data;
  setSession(accessToken, refreshToken, user);
  return res.data;
}

export async function logout(): Promise<void> {
  const rt = getRefreshToken();
  try {
    if (rt) await api.post("/auth/logout", { refreshToken: rt });
  } catch {
    // Logout BE lỗi vẫn xóa session local.
  }
  clearSession();
}

export async function me(): Promise<User> {
  const res = await api.get<User>("/auth/me");
  return res.data;
}
