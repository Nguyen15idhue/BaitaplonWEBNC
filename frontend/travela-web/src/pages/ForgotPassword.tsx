import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useToast } from "../components/ui/toast";
import { Button } from "../components/ui/button";

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

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { push } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      push("Vui lòng nhập địa chỉ email.", "error");
      return;
    }
    setSubmitting(true);
    try {
      // BE chưa có endpoint forgot password — giả lập thành công
      await new Promise((r) => setTimeout(r, 1000));
      push("Đã gửi mật khẩu mới tới email của bạn.", "success");
    } catch {
      push("Không gửi được email, thử lại sau.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      <AuthBanner />

      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="rounded-[12px] border border-[#e0dbd0] bg-white p-8 shadow-sm">
          <h2 className="mb-2 text-center text-2xl font-bold text-[#535041]">Quên mật khẩu</h2>
          <p className="mb-6 text-center text-sm text-[#8a8576]">
            Chúng tôi sẽ gửi mật khẩu mới tới email của bạn
          </p>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="email"
                placeholder="Địa chỉ email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border border-[#e0dbd0] bg-white px-4 py-3 pr-12 text-sm text-[#535041] placeholder:text-[#8a8576] focus:outline-none focus:ring-2 focus:ring-[#A79F84]"
              />
              <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a8576]" />
            </div>

            <Button type="submit" loading={submitting} className="w-full rounded-full py-3">
              Gửi
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-[#535041]">
            Bạn đã có tài khoản ?{" "}
            <Link to="/login" className="font-medium text-[#A79F84] hover:underline">
              Đăng nhập
            </Link>
          </p>
          <p className="mt-1 text-center text-sm text-[#535041]">
            Bạn chưa có tài khoản ?{" "}
            <Link to="/register" className="font-medium text-[#A79F84] hover:underline">
              Đăng ký
            </Link>
          </p>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e0dbd0]" />
            <span className="text-sm text-[#8a8576]">Hoặc</span>
            <div className="h-px flex-1 bg-[#e0dbd0]" />
          </div>

          {/* Social login */}
          <div className="flex gap-3">
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#e0dbd0] bg-white px-4 py-2.5 text-sm text-[#535041] transition-colors hover:bg-[#fffaf2]"
            >
              Đăng nhập với Facebook
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#e0dbd0] bg-white px-4 py-2.5 text-sm text-[#535041] transition-colors hover:bg-[#fffaf2]"
            >
              Đăng nhập với Google
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
