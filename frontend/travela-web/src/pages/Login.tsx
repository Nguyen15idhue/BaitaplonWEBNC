import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { useToast, toastForApiError } from "../components/ui/toast";
import { Button } from "../components/ui/button";
import { Field, Input, PasswordInput, FieldError } from "../components/ui/fields";
import { Card } from "../components/ui/card";
import { PageHeader } from "../components/common/common";

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
      setFieldError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      accountRef.current?.focus();
      return;
    }
    setFieldError("");
    setSubmitting(true);
    try {
      await login(usernameOrEmail.trim(), password);
      push("Đăng nhập thành công.", "success");
      navigate(from, { replace: true });
    } catch (err) {
      toastForApiError(push, err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <PageHeader title="Đăng nhập" />
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="Tên đăng nhập hoặc email">
          <Input
            ref={accountRef}
            placeholder="VD: customer1"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
          />
        </Field>
        <Field label="Mật khẩu">
          <PasswordInput
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <FieldError message={fieldError} />
        <Button type="submit" loading={submitting}>
          Đăng nhập
        </Button>
      </form>
      <p className="mt-3 text-sm text-[#64748B]">
        Chưa có tài khoản? <Link to="/register" className="text-[#2563EB]">Đăng ký</Link>
      </p>
    </Card>
  );
}
