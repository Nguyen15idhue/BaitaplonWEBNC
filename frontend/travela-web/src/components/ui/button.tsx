import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "danger";
  loading?: boolean;
};

export function Button({ variant = "primary", loading = false, disabled, className, children, ...rest }: Props) {
  return (
    <button
      className={cn(
        "rounded-[6px] px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
        variant === "primary" && "bg-[#A79F84] text-white hover:bg-[#8a7d68]",
        variant === "outline" && "border border-[#e0dbd0] bg-white text-[#535041] hover:bg-[#fffaf2]",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "Đang xử lý..." : children}
    </button>
  );
}
