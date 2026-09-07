import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { useToast, toastForApiError } from "../components/ui/toast";
import { Button } from "../components/ui/button";
import { Input, FieldError } from "../components/ui/fields";
import { Card } from "../components/ui/card";
import { PageHeader } from "../components/common/common";

export function Login() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState("");
  const { login } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setFieldError("Nhập đầy đủ tài khoản và mật khẩu.");
      return;
    }
    setFieldError("");
    try {
      await login(usernameOrEmail, password);
      push("Đăng nhập thành công.", "success");
      navigate(from, { replace: true });
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <PageHeader title="Đăng nhập" />
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Input
          placeholder="Username hoặc email"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FieldError message={fieldError} />
        <Button type="submit">Đăng nhập</Button>
      </form>
      <p className="mt-3 text-sm text-[#64748B]">
        Chưa có tài khoản? <Link to="/register" className="text-[#2563EB]">Đăng ký</Link>
      </p>
    </Card>
  );
}
