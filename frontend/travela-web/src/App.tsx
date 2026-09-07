import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import { ToastProvider } from "./components/ui/toast";
import { AppLayout, AdminLayout } from "./components/layout/layouts";
import { ProtectedRoute, RoleGuard } from "./routes/guards";
import { Forbidden, NotFound } from "./pages/pages";
import { Home } from "./pages/Home";
import { TourList } from "./pages/TourList";
import { TourDetailPage } from "./pages/TourDetail";
import { Destinations } from "./pages/Destinations";
import { BookingPage } from "./pages/Booking";
import { CheckoutPage } from "./pages/Checkout";
import { MyBookings } from "./pages/MyBookings";
import { Profile } from "./pages/Profile";
import { Admin } from "./pages/pages";
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
              <Route path="/tours" element={<TourList />} />
              <Route path="/tours/:id" element={<TourDetailPage />} />
              <Route path="/destinations" element={<Destinations />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/booking/:tourId"
                element={
                  <ProtectedRoute>
                    <BookingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout/:bookingId"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
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
