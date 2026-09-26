import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { useToast, toastForApiError } from "../components/ui/toast";
import { Button } from "../components/ui/button";
import { PasswordInput, Checkbox, FieldError } from "../components/ui/fields";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9._-]{3,100}$/;

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

export function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      setFieldError("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }
    if (!USERNAME_RE.test(username.trim())) {
      setFieldError("Tên đăng nhập 3-100 ký tự, chỉ gồm chữ, số và . _ -");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setFieldError("Email chưa đúng định dạng.");
      return;
    }
    if (password.length < 8) {
      setFieldError("Mật khẩu tối thiểu 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setFieldError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!agreeTerms) {
      setFieldError("Vui lòng đồng ý với điều khoản.");
      return;
    }
    setFieldError("");
    setSubmitting(true);
    try {
      await register(username.trim(), email.trim(), password);
      push("Đăng ký thành công.", "success");
      navigate("/", { replace: true });
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
          <h2 className="mb-6 text-center text-2xl font-bold text-[#535041]">Đăng ký thành viên</h2>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {/* Tên đăng nhập */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#535041]">Tên đăng nhập</label>
              <input
                placeholder="VD: longphap"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-full border border-[#e0dbd0] bg-white px-4 py-3 text-sm text-[#535041] placeholder:text-[#8a8576] focus:outline-none focus:ring-2 focus:ring-[#A79F84]"
              />
            </div>

            {/* Địa chỉ email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#535041]">Địa chỉ email</label>
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border border-[#e0dbd0] bg-white px-4 py-3 text-sm text-[#535041] placeholder:text-[#8a8576] focus:outline-none focus:ring-2 focus:ring-[#A79F84]"
              />
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#535041]">
                Mật khẩu <span className="font-normal text-[#8a8576]">(Tối thiểu 8 ký tự)</span>
              </label>
              <PasswordInput
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-full px-4 py-3"
              />
            </div>

            {/* Xác nhận mật khẩu */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#535041]">Xác nhận mật khẩu</label>
              <PasswordInput
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-full px-4 py-3"
              />
            </div>

            <FieldError message={fieldError} />

            <Button type="submit" loading={submitting} className="w-full rounded-full py-3">
              Đăng ký
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-[#535041]">
            Bạn đã có tài khoản ?{" "}
            <Link to="/login" className="font-medium text-[#A79F84] hover:underline">
              Nhấn vào đây
            </Link>
          </p>

          <label className="mt-3 flex items-center gap-2 text-sm text-[#535041]">
            <Checkbox checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
            <span>
              Tôi đồng ý với{" "}
              <span className="font-medium text-[#A79F84]">Bảo mật</span> và{" "}
              <span className="font-medium text-[#A79F84]">Điều khoản hoạt động</span> của trang.
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
