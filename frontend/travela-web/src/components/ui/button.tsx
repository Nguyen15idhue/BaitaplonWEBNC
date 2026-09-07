import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

// Button dùng chung: primary / outline / danger. Bo 6px, đúng token.
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "danger";
};

export function Button({ variant = "primary", className, ...rest }: Props) {
  return (
    <button
      className={cn(
        "rounded-[6px] px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
        variant === "primary" && "bg-[#2563EB] text-white hover:bg-[#1D4ED8]",
        variant === "outline" && "border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className,
      )}
      {...rest}
    />
  );
}
