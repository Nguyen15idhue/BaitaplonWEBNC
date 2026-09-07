import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getUser, clearSession } from "./auth-store";
import { login as apiLogin, logout as apiLogout, me as apiMe, register as apiRegister } from "../services/authApi";
import type { User } from "../types";

// AuthContext: user + loading. F5 persist bằng GET /me (không tin role local).
type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<User>;
  register: (username: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => {
    throw new Error("not-ready");
  },
  register: async () => {
    throw new Error("not-ready");
  },
  logout: async () => {},
});

export function useAuth() {
  return useContext(Ctx);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Có token local mới gọi /me xác thực lại; không có thì thôi (trang public).
    if (!getUser()) {
      setLoading(false);
      return;
    }
    apiMe()
      .then(setUser)
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    const res = await apiLogin(usernameOrEmail, password);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    await apiRegister(username, email, password);
    // Đăng ký xong tự đăng nhập luôn cho gọn luồng.
    return login(username, password);
  }, [login]);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
