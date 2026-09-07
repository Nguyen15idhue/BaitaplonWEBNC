import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { useToast, toastForApiError } from "../components/ui/toast";
import { Button } from "../components/ui/button";
import { Field, Input, PasswordInput, FieldError } from "../components/ui/fields";
import { Card } from "../components/ui/card";
import { PageHeader } from "../components/common/common";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const { register } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      setFieldError("Vui lòng nhập đầy đủ tên đăng nhập, email và mật khẩu.");
      usernameRef.current?.focus();
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setFieldError("Email chưa đúng định dạng (VD: ban@vidu.com).");
      emailRef.current?.focus();
      return;
    }
    if (password.length < 6) {
      setFieldError("Mật khẩu tối thiểu 6 ký tự.");
      passwordRef.current?.focus();
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
    <Card className="mx-auto max-w-md">
      <PageHeader title="Đăng ký" />
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="Tên đăng nhập">
          <Input ref={usernameRef} placeholder="VD: traveller01" value={username} onChange={(e) => setUsername(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input ref={emailRef} placeholder="VD: ban@vidu.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Mật khẩu">
          <PasswordInput ref={passwordRef} placeholder="Tối thiểu 6 ký tự" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <FieldError message={fieldError} />
        <Button type="submit" loading={submitting}>
          Đăng ký
        </Button>
      </form>
      <p className="mt-3 text-sm text-[#64748B]">
        Đã có tài khoản? <Link to="/login" className="text-[#2563EB]">Đăng nhập</Link>
      </p>
    </Card>
  );
}
