import { useEffect, useRef, useState, useCallback } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, User, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { cn } from "../../lib/utils";
import { getHealth } from "../../services/tourApi";
import { useSliderImages } from "../../lib/image-store";

// Footer hiện trạng thái hệ thống (F4): GET /health, db:up.
function Footer() {
  const [db, setDb] = useState("...");
  useEffect(() => {
    getHealth()
      .then((h) => setDb(h.db))
      .catch(() => setDb("down"));
  }, []);
  return (
    <footer className="bg-[#535041] px-6 py-3 text-xs text-white/60">
      Travela · DB: {db}
    </footer>
  );
}

function isActive(path: string, current: string) {
  return current === path || current.startsWith(path + "/");
}

const ADMIN_LINKS = [
  { to: "/admin", label: "Tổng quan" },
  { to: "/admin/users", label: "Người dùng" },
  { to: "/admin/tours", label: "Tour" },
  { to: "/admin/destinations", label: "Điểm đến" },
  { to: "/admin/bookings", label: "Đơn đặt" },
  { to: "/admin/audit-logs", label: "Lịch sử" },
  { to: "/admin/settings", label: "Hình ảnh" },
];

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  function navClass(path: string) {
    const active = location.pathname === path || location.pathname.startsWith(path + "/");
    return active
      ? "text-white font-semibold border-b-2 border-white pb-0.5"
      : "text-white/70 hover:text-white";
  }

  return (
    <header className="relative">
      {/* Tầng trên — #A79F84 */}
      <div className="flex items-center justify-between bg-[#A79F84] px-6 py-3">
        <Link to="/" className="text-lg font-bold italic text-white">
          Travela
        </Link>
        <p className="hidden text-center text-sm font-bold uppercase tracking-widest text-[#535041] sm:block">
          Nhanh chóng - Tiện lợi - An toàn
        </p>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to={user.role === "Admin" ? "/admin" : "/profile"}
                className="flex items-center gap-2 rounded-full bg-[#535041] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[#535041]/90"
              >
                <User size={14} />
                <span className="hidden sm:inline">{user.username}</span>
              </Link>
              {user.role !== "Admin" && (
                <button
                  onClick={async () => {
                    await logout();
                    navigate("/login");
                  }}
                  className="hidden items-center gap-1 rounded-full bg-[#535041] px-2.5 py-1.5 text-sm text-white transition-colors hover:bg-[#535041]/90 sm:flex"
                >
                  <LogOut size={14} />
                </button>
              )}
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-full bg-[#535041] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[#535041]/90"
            >
              <User size={14} />
              <span className="hidden sm:inline">Tài khoản</span>
            </Link>
          )}
        </div>
      </div>

      {/* Tầng dưới — #535041 */}
      <div className="flex items-center justify-center gap-6 bg-[#535041] px-6 py-2.5">
        {/* Mobile menu toggle */}
        <button
          className="mr-auto rounded-[4px] p-2 text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link to="/" className={navClass("/")}>
            Trang chủ
          </Link>
          <Link to="/tours" className={navClass("/tours")}>
            Tour
          </Link>
          <Link to="/destinations" className={navClass("/destinations")}>
            Điểm đến
          </Link>
          <Link to="/my-bookings" className={navClass("/my-bookings")}>
            Chuyến của tôi
          </Link>
          <Link to="/contact" className={navClass("/contact")}>
            Liên hệ
          </Link>
          {user?.role === "Admin" && (
            <Link to="/admin" className={navClass("/admin")}>
              Admin
            </Link>
          )}
        </nav>

        <button className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm text-[#535041] transition-colors hover:bg-white/90">
          <Search size={16} />
          <span className="hidden sm:inline">Tìm kiếm</span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="absolute inset-x-0 top-full z-30 flex flex-col gap-1 border-b border-[#e0dbd0] bg-[#535041] px-4 py-2 text-sm shadow-md md:hidden">
          {[
            { to: "/", label: "Trang chủ" },
            { to: "/tours", label: "Tour" },
            { to: "/destinations", label: "Điểm đến" },
            { to: "/my-bookings", label: "Chuyến của tôi" },
            { to: "/contact", label: "Liên hệ" },
            ...(user?.role === "Admin" ? [{ to: "/admin", label: "Admin" }] : []),
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-[4px] px-3 py-2",
                (location.pathname === l.to || location.pathname.startsWith(l.to + "/"))
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

function HeroSlider() {
  const { images } = useSliderImages();
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  const count = images.length;

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    setCurrent(0);
  }, [count]);

  useEffect(() => {
    if (count === 0) return;
    timerRef.current = setInterval(next, 3000);
    return () => clearInterval(timerRef.current!);
  }, [next, count]);

  function resetTimer() {
    clearInterval(timerRef.current!);
    timerRef.current = setInterval(next, 3000);
  }

  function goNext() {
    next();
    resetTimer();
  }

  function goPrev() {
    prev();
    resetTimer();
  }

  if (count === 0) return null;

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "clamp(276px, 45vw, 576px)" }}>
      {images.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      <button
        onClick={goPrev}
        className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[#535041] shadow-md transition-colors hover:bg-white"
        aria-label="Ảnh trước"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={goNext}
        className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[#535041] shadow-md transition-colors hover:bg-white"
        aria-label="Ảnh tiếp"
      >
        <ChevronRight size={22} />
      </button>

      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrent(i);
              resetTimer();
            }}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              i === current ? "bg-white" : "bg-white/50"
            }`}
            aria-label={`Ảnh ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export { HeroSlider };

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {location.pathname === "/" && <HeroSlider />}
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <nav className="flex flex-col gap-1 text-sm">
      {ADMIN_LINKS.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          onClick={onNavigate}
          className={cn(
            "rounded-[4px] px-3 py-2 hover:bg-[#F1F5F9]",
            isActive(l.to, location.pathname) ? "bg-[#A79F84]/20 text-[#535041] font-medium" : "text-[#0F172A]",
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 bg-[#535041] px-4 py-3 md:px-6">
        <button
          className="rounded-[4px] p-2 text-white md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Mở menu admin"
        >
          <Menu size={20} />
        </button>
        <Link to="/admin" className="text-base font-bold italic text-white">
          Travela Admin
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <Link to="/" className="text-sm text-white/80 hover:text-white">
            Về trang chủ
          </Link>
          <button
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/25"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
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
