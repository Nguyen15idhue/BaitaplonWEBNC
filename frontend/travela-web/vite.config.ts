import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Plugin no-store: ép mọi response dev về no-store (kể cả static của vite),
// chống browser giữ bản cũ.
type ResLike = {
  setHeader: (name: string, value: string | number | string[]) => unknown;
};

function noStore() {
  return {
    name: "travela-no-store",
    configureServer(server: {
      middlewares: { use: (fn: (req: unknown, res: ResLike, next: () => void) => void) => void };
    }) {
      server.middlewares.use((_req, res, next) => {
        const orig = res.setHeader.bind(res);
        res.setHeader = ((name: string, value: string | number | string[]) => {
          if (name.toLowerCase() === "cache-control") return orig(name, "no-store");
          return orig(name, value);
        }) as ResLike["setHeader"];
        next();
      });
    },
  };
}

// Skeleton M1: dev proxy /api -> backend local. Trong Docker dùng Nginx proxy thay.
export default defineConfig({
  plugins: [react(), tailwindcss(), noStore()],
  server: {
    port: 5173,
    // Docker trên Windows không có inotify: polling 1s để phát hiện file đổi.
    // @vitejs/plugin-react giữ Fast Refresh (patch component qua WebSocket).
    watch: { usePolling: true, interval: 1000 },
    proxy: {
      "/api": {
        // Dev local: http://localhost:5000. Dev trong Docker: VITE_API_PROXY=http://backend:8080.
        target: process.env.VITE_API_PROXY ?? "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
