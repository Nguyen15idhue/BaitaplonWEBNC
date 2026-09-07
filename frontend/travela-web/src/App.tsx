import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import { ToastProvider } from "./components/ui/toast";
import { AppLayout, AdminLayout } from "./components/layout/layouts";
import { ProtectedRoute, RoleGuard } from "./routes/guards";
import { Home, Tours, MyBookings, Admin, Forbidden, NotFound } from "./pages/pages";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/tours" element={<Tours />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route path="/403" element={<Forbidden />} />
            </Route>
            <Route
              element={
                <RoleGuard role="Admin">
                  <AdminLayout />
                </RoleGuard>
              }
            >
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
