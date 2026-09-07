import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, InputHTMLAttributes as CheckboxAttrs } from "react";
import { cn } from "../../lib/utils";

const field =
  "w-full rounded-[6px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, props.className)} {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(field, props.className)} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(field, props.className)} {...props} />;
}

export function Checkbox(props: CheckboxAttrs<HTMLInputElement>) {
  return <input type="checkbox" className={cn("h-4 w-4 accent-[#2563EB]", props.className)} {...props} />;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}
