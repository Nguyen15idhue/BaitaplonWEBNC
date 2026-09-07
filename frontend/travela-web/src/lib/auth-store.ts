import type { User } from "../types";

// Session V1 lưu localStorage (cookie HttpOnly để V2). Role suy từ user, không lưu rời.
const K = { access: "accessToken", refresh: "refreshToken", user: "authUser" };

export function getAccessToken(): string | null {
  return localStorage.getItem(K.access);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(K.refresh);
}

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(K.user);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function setSession(accessToken: string, refreshToken: string, user: User): void {
  localStorage.setItem(K.access, accessToken);
  localStorage.setItem(K.refresh, refreshToken);
  localStorage.setItem(K.user, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(K.access);
  localStorage.removeItem(K.refresh);
  localStorage.removeItem(K.user);
}

export function isLoggedIn(): boolean {
  return getAccessToken() !== null;
}
