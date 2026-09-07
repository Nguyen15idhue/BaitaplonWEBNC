import axios from "axios";
import { clearSession, getAccessToken, getRefreshToken, setSession } from "../lib/auth-store";

// Mọi gọi API đi qua đây. baseURL tương đối để chạy được cả dev proxy lẫn Nginx Docker.
export const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// F1b: 401 -> refresh 1 lần rồi retry request gốc; fail -> xóa session, về /login.
// Không tự refresh lại chính /auth/login, /auth/register, /auth/refresh.
let refreshing: Promise<string> | null = null;

function doRefresh(): Promise<string> {
  if (!refreshing) {
    refreshing = (async () => {
      const rt = getRefreshToken();
      if (!rt) throw new Error("no-refresh");
      // Dùng axios trần (không qua interceptor) để tránh lặp.
      const res = await axios.post("/api/auth/refresh", { refreshToken: rt });
      const { accessToken, refreshToken, user } = res.data;
      setSession(accessToken, refreshToken, user);
      return accessToken as string;
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const url: string = original?.url ?? "";
    const isAuthCall =
      url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh");
    if (error.response?.status === 401 && !isAuthCall && original && !original._retry) {
      original._retry = true;
      try {
        const token = await doRefresh();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        clearSession();
        if (window.location.pathname !== "/login") window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
