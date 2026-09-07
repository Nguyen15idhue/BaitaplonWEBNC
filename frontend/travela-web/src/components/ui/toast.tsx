import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";

// Toast dùng chung toàn app (thay cho alert). F1b dùng hiện lỗi theo mã BE (Phụ lục C).
type Toast = { id: number; message: string; tone: "error" | "success" | "info" };
const ToastCtx = createContext<{ push: (message: string, tone?: Toast["tone"]) => void }>({
  push: () => {},
});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-[6px] border px-4 py-2 text-sm shadow",
              t.tone === "error" && "border-red-200 bg-[#FEF2F2] text-[#B91C1C]",
              t.tone === "success" && "border-green-200 bg-[#F0FDF4] text-[#15803D]",
              t.tone === "info" && "border-[#E2E8F0] bg-white text-[#0F172A]",
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// Chuẩn hóa message từ lỗi BE { error, message } theo Phụ lục C.
export function toastForApiError(push: (m: string, t?: Toast["tone"]) => void, err: unknown) {
  const data = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
  push(data?.message ?? "Đã có lỗi xảy ra, thử lại sau.", "error");
}
