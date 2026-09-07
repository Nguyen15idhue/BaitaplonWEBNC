import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginMock } from "../services/authApi";
import { PageHeader } from "../components/common/common";

export function Login() {
  const [username, setUsername] = useState("admin");
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await loginMock(username);
    navigate("/");
  }

  return (
    <div>
      <PageHeader title="Dang nhap (mock)" />
      <form onSubmit={submit}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
        <button type="submit">Login</button>
      </form>
      <p>B4 se thay bang POST /auth/login that.</p>
    </div>
  );
}
