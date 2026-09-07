import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout, AdminLayout } from "./components/layout/layouts";
import { ProtectedRoute, RoleGuard } from "./routes/guards";
import { Home, Tours, MyBookings, Admin, Forbidden, NotFound } from "./pages/pages";
import { Login } from "./pages/Login";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/login" element={<Login />} />
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
  );
}
