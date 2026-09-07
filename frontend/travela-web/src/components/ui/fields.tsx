import { useState, type ReactNode, type Ref } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, InputHTMLAttributes as CheckboxAttrs } from "react";
import { cn } from "../../lib/utils";

const field =
  "w-full rounded-[6px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]";

// Field bọc label thật cho input (người ít tech không bị mất gợi ý khi gõ).
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-[#0F172A]">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}

export function Input({ ref, ...rest }: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} className={cn(field, rest.className)} {...rest} />;
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

// Ô mật khẩu có nút hiện/ẩn.
export function PasswordInput({ ref, ...rest }: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input ref={ref} className={cn(field, "pr-10", rest.className)} {...rest} type={show ? "text" : "password"} />
      <button
        type="button"
        aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        onClick={() => setShow((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#0F172A]"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}
