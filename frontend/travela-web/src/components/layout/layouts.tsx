import { Link, Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div>
      <header style={{ borderBottom: "1px solid #E2E8F0", padding: "12px 24px" }}>
        <Link to="/" style={{ fontWeight: 700, color: "#2563EB" }}>Travela</Link>{" "}
        <Link to="/tours">Tours</Link> <Link to="/my-bookings">My bookings</Link>{" "}
        <Link to="/login">Login</Link>
      </header>
      <main style={{ padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}

export function AdminLayout() {
  return (
    <div>
      <header style={{ borderBottom: "1px solid #E2E8F0", padding: "12px 24px" }}>
        <strong>Travela Admin</strong> <Link to="/admin">Dashboard</Link>
      </header>
      <main style={{ padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
