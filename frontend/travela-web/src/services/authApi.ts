import { api } from "./api";

export async function loginMock(username: string): Promise<void> {
  // B4 sẽ thay bằng POST /auth/login thật. Skeleton chỉ lưu token giả để test guard.
  localStorage.setItem("accessToken", `mock-${username}`);
  localStorage.setItem("role", username === "admin" ? "Admin" : "Customer");
}

export async function fetchMe(): Promise<{ username: string } | null> {
  try {
    const res = await api.get("/auth/me");
    return res.data;
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("role");
}
