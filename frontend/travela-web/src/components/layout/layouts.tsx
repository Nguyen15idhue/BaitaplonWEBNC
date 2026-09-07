import { Link, Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { Button } from "../ui/button";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="flex items-center gap-4 border-b border-[#E2E8F0] bg-white px-6 py-3">
      <Link to="/" className="text-base font-bold text-[#2563EB]">
        Travela
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link to="/tours" className="text-[#0F172A]">
          Tours
        </Link>
        <Link to="/my-bookings" className="text-[#0F172A]">
          My bookings
        </Link>
        {user?.role === "Admin" && (
          <Link to="/admin" className="text-[#0F172A]">
            Admin
          </Link>
        )}
      </nav>
      <div className="ml-auto flex items-center gap-3 text-sm">
        {user ? (
          <>
            <span className="text-[#64748B]">{user.username}</span>
            <Button
              variant="outline"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
            >
              <LogOut size={14} /> Đăng xuất
            </Button>
          </>
        ) : (
          <Link to="/login" className="text-[#2563EB]">
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
    </div>
  );
}

export function Sidebar() {
  return (
    <nav className="flex flex-col gap-1 text-sm">
      <Link to="/admin" className="rounded-[4px] px-3 py-2 hover:bg-[#F1F5F9]">
        Dashboard
      </Link>
      <Link to="/admin/users" className="rounded-[4px] px-3 py-2 hover:bg-[#F1F5F9]">
        Users
      </Link>
      <Link to="/admin/tours" className="rounded-[4px] px-3 py-2 hover:bg-[#F1F5F9]">
        Tours
      </Link>
      <Link to="/admin/destinations" className="rounded-[4px] px-3 py-2 hover:bg-[#F1F5F9]">
        Destinations
      </Link>
      <Link to="/admin/bookings" className="rounded-[4px] px-3 py-2 hover:bg-[#F1F5F9]">
        Bookings
      </Link>
    </nav>
  );
}

export function AdminLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[#E2E8F0] bg-white px-6 py-3">
        <Link to="/admin" className="text-base font-bold text-[#0F172A]">
          Travela Admin
        </Link>
      </header>
      <div className="mx-auto flex max-w-6xl gap-6 p-6">
        <aside className="w-48 shrink-0">
          <Sidebar />
        </aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl">{children}</div>;
}
