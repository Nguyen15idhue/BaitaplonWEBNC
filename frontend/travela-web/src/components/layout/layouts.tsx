import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { getHealth } from "../../services/tourApi";

// Footer hiện trạng thái hệ thống (F4): GET /health, db:up.
function Footer() {
  const [db, setDb] = useState("...");
  useEffect(() => {
    getHealth()
      .then((h) => setDb(h.db))
      .catch(() => setDb("down"));
  }, []);
  return (
    <footer className="border-t border-[#E2E8F0] bg-white px-6 py-2 text-xs text-[#64748B]">
      Travela · DB: {db}
    </footer>
  );
}

const MAIN_LINKS = [
  { to: "/tours", label: "Tour" },
  { to: "/destinations", label: "Điểm đến" },
  { to: "/my-bookings", label: "Chuyến của tôi" },
];

const ADMIN_LINKS = [
  { to: "/admin", label: "Tổng quan" },
  { to: "/admin/users", label: "Người dùng" },
  { to: "/admin/tours", label: "Tour" },
  { to: "/admin/destinations", label: "Điểm đến" },
  { to: "/admin/bookings", label: "Đơn đặt" },
  { to: "/admin/audit-logs", label: "Lịch sử" },
];

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="relative border-b border-[#E2E8F0] bg-white">
      <div className="flex items-center gap-3 px-4 py-3 md:gap-4 md:px-6">
        <button
          className="rounded-[4px] p-2 hover:bg-[#F1F5F9] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link to="/" className="text-base font-bold text-[#2563EB]">
          Travela
        </Link>
        <nav className="hidden items-center gap-4 text-sm md:flex">
          {MAIN_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="text-[#0F172A]">
              {l.label}
            </Link>
          ))}
          {user?.role === "Admin" && (
            <Link to="/admin" className="text-[#0F172A]">
              Admin
            </Link>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm md:gap-3">
          {user ? (
            <>
              <span className="hidden max-w-28 truncate text-[#64748B] sm:inline">{user.username}</span>
              <Button
                variant="outline"
                onClick={async () => {
                  await logout();
                  navigate("/login");
                }}
              >
                <LogOut size={14} /> <span className="hidden sm:inline">Đăng xuất</span>
              </Button>
            </>
          ) : (
            <Link to="/login" className="text-[#2563EB]">
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
      {open && (
        <nav className="absolute inset-x-0 top-full z-30 flex flex-col gap-1 border-b border-[#E2E8F0] bg-white px-4 py-2 text-sm shadow-md md:hidden">
          {MAIN_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="rounded-[4px] px-3 py-2 text-[#0F172A] hover:bg-[#F1F5F9]"
            >
              {l.label}
            </Link>
          ))}
          {user?.role === "Admin" && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="rounded-[4px] px-3 py-2 text-[#0F172A] hover:bg-[#F1F5F9]"
            >
              Admin
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 text-sm">
      {ADMIN_LINKS.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          onClick={onNavigate}
          className="rounded-[4px] px-3 py-2 hover:bg-[#F1F5F9]"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-[#E2E8F0] bg-white px-4 py-3 md:px-6">
        <button
          className="rounded-[4px] p-2 hover:bg-[#F1F5F9] md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Mở menu admin"
        >
          <Menu size={20} />
        </button>
        <Link to="/admin" className="text-base font-bold text-[#0F172A]">
          Travela Admin
        </Link>
        <Link to="/" className="ml-auto text-sm text-[#2563EB]">
          Về trang chủ
        </Link>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 p-4 md:p-6">
        <aside className="hidden w-48 shrink-0 md:block">
          <Sidebar />
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <Footer />

      {/* Drawer mobile */}
      <div className={cn("fixed inset-0 z-40 md:hidden", !open && "pointer-events-none")}>
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-64 bg-white p-4 shadow-lg transition-transform",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <strong className="text-sm">Menu</strong>
            <button
              className="rounded-[4px] p-2 hover:bg-[#F1F5F9]"
              onClick={() => setOpen(false)}
              aria-label="Đóng menu"
            >
              <X size={18} />
            </button>
          </div>
          <Sidebar onNavigate={() => setOpen(false)} />
        </aside>
      </div>
    </div>
  );
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl">{children}</div>;
}
