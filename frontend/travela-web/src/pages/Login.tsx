import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { useToast, toastForApiError } from "../components/ui/toast";
import { Button } from "../components/ui/button";
import { PasswordInput, FieldError } from "../components/ui/fields";

function AuthBanner() {
  return (
    <div className="bg-[#A79F84] px-6 py-3">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 text-lg font-bold italic text-white">Travela</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-[#535041]">
          Nhanh chóng - Tiện lợi - An toàn
        </p>
      </div>
    </div>
  );
}

export function Login() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const accountRef = useRef<HTMLInputElement>(null);
  const { login } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setFieldError("Vui lòng nhập đầy đủ email và mật khẩu.");
      accountRef.current?.focus();
      return;
    }
    setFieldError("");
    setSubmitting(true);
    try {
      const u = await login(usernameOrEmail.trim(), password);
      push("Đăng nhập thành công.", "success");
      const target = from.startsWith("/admin") && u.role !== "Admin" ? "/" : from;
      navigate(target, { replace: true });
    } catch (err) {
      toastForApiError(push, err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      <AuthBanner />

      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="rounded-[12px] border border-[#e0dbd0] bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-center text-2xl font-bold text-[#535041]">Đăng nhập</h2>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <div className="relative">
                <input
                  ref={accountRef}
                  type="text"
                  placeholder="Địa chỉ email"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="w-full rounded-full border border-[#e0dbd0] bg-white px-4 py-3 pr-12 text-sm text-[#535041] placeholder:text-[#8a8576] focus:outline-none focus:ring-2 focus:ring-[#A79F84]"
                />
                <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a8576]" />
              </div>
            </div>

            {/* Password */}
            <div>
              <PasswordInput
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-full px-4 py-3"
              />
            </div>

            <FieldError message={fieldError} />

            {/* Nút đăng nhập */}
            <Button type="submit" loading={submitting} className="w-full rounded-full py-3">
              Đăng nhập
            </Button>
          </form>

          {/* Đăng ký */}
          <p className="mt-4 text-center text-sm text-[#535041]">
            Bạn chưa có tài khoản ?{" "}
            <Link to="/register" className="font-medium text-[#A79F84] hover:underline">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
