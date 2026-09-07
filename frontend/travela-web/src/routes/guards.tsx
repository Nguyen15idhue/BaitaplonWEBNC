import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { isLoggedIn, getRole } from "../lib/auth-store";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RoleGuard({ role, children }: { role: string; children: ReactNode }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (getRole() !== role) return <Navigate to="/403" replace />;
  return <>{children}</>;
}
