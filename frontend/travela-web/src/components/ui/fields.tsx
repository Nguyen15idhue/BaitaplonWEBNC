import { useState, type ReactNode, type Ref } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const field =
  "w-full rounded-[6px] border border-[#e0dbd0] bg-white px-3 py-2 text-sm text-[#535041] placeholder:text-[#8a8576] focus:outline-none focus:ring-2 focus:ring-[#A79F84]";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-[#535041]">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}

export function Input({ ref, ...rest }: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} {...rest} className={cn(field, rest.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(field, props.className)} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(field, props.className)} {...props} />;
}

export function Checkbox(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" className={cn("h-4 w-4 accent-[#A79F84]", props.className)} {...props} />;
}

export function PasswordInput({ ref, ...rest }: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input ref={ref} {...rest} className={cn(field, "pr-10", rest.className)} type={show ? "text" : "password"} />
      <button
        type="button"
        aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8a8576] hover:text-[#535041]"
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
