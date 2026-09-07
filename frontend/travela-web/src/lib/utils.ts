import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// cn() dùng chung cho mọi ui component (pattern shadcn).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
