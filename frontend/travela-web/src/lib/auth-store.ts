export function getAccessToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function getRole(): string | null {
  return localStorage.getItem("role");
}

export function isLoggedIn(): boolean {
  return getAccessToken() !== null;
}
