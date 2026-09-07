import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

// Tabs tối giản cho trang sửa tour (tab Thông tin / Giá / Ảnh) ở F3.
export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: number; onChange: (i: number) => void }) {
  return (
    <div className="mb-4 flex gap-2 border-b border-[#E2E8F0]">
      {tabs.map((t, i) => (
        <button
          key={t}
          onClick={() => onChange(i)}
          className={cn(
            "px-4 py-2 text-sm",
            i === active ? "border-b-2 border-[#2563EB] font-medium text-[#2563EB]" : "text-[#64748B]",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
