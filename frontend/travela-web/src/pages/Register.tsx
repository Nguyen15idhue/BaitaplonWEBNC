import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { useToast, toastForApiError } from "../components/ui/toast";
import { Button } from "../components/ui/button";
import { Input, FieldError } from "../components/ui/fields";
import { Card } from "../components/ui/card";
import { PageHeader } from "../components/common/common";

export function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState("");
  const { register } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !email || !password) {
      setFieldError("Nhập đầy đủ username, email, mật khẩu.");
      return;
    }
    if (password.length < 6) {
      setFieldError("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    setFieldError("");
    try {
      await register(username, email, password);
      push("Đăng ký thành công.", "success");
      navigate("/", { replace: true });
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <PageHeader title="Đăng ký" />
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Mật khẩu (≥6 ký tự)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <FieldError message={fieldError} />
        <Button type="submit">Đăng ký</Button>
      </form>
      <p className="mt-3 text-sm text-[#64748B]">
        Đã có tài khoản? <Link to="/login" className="text-[#2563EB]">Đăng nhập</Link>
      </p>
    </Card>
  );
}
