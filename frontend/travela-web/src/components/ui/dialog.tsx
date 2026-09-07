import type { ReactNode } from "react";
import { Button } from "./button";

// Dialog tối giản đúng token (không Radix để nhẹ). F2/F3 dùng cho CRUD/confirm.
export function Dialog({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-[8px] border border-[#E2E8F0] bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#0F172A]">{title}</h2>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
