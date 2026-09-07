import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Skeleton M1: dev proxy /api -> backend local. Trong Docker dùng Nginx proxy thay.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
