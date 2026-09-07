import axios from "axios";

// Mọi gọi API đi qua đây. baseURL tương đối để chạy được cả dev proxy lẫn Nginx Docker.
export const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// B4 sẽ bổ sung: 401 -> gọi /auth/refresh một lần rồi thử lại.
