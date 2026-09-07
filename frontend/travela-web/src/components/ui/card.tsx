import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-[8px] border border-[#E2E8F0] bg-white p-4", className)}>{children}</div>
  );
}

export function Badge({ tone = "muted", children }: { tone?: "muted" | "primary" | "success" | "danger"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-block rounded-[4px] px-2 py-0.5 text-xs font-medium",
        tone === "muted" && "bg-[#F1F5F9] text-[#64748B]",
        tone === "primary" && "bg-[#DBEAFE] text-[#1D4ED8]",
        tone === "success" && "bg-[#DCFCE7] text-[#15803D]",
        tone === "danger" && "bg-[#FEE2E2] text-[#B91C1C]",
      )}
    >
      {children}
    </span>
  );
}
