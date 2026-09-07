import { useEffect, useState } from "react";
import { getTours } from "../services/tourApi";
import type { Tour } from "../types";
import { Loading, EmptyState, PageHeader } from "../components/common/common";

export function Home() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendOk, setBackendOk] = useState(false);

  useEffect(() => {
    getTours()
      .then((res) => {
        setTours(res.items);
        setBackendOk(true);
      })
      .catch(() => setBackendOk(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  return (
    <div>
      <PageHeader title="Travela skeleton" />
      <p>Backend: {backendOk ? "connected" : "not connected (mock)"}</p>
      {tours.length === 0 ? (
        <EmptyState message="Chua co tour. B3 se do data that vao day." />
      ) : (
        <ul>
          {tours.map((t) => (
            <li key={t.id}>{t.tourName}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Tours() {
  return (
    <div>
      <PageHeader title="Danh sach tour" />
      <EmptyState message="Skeleton F0. F2 se lam search/filter/pagination." />
    </div>
  );
}

export function MyBookings() {
  return (
    <div>
      <PageHeader title="Booking cua toi" />
      <EmptyState message="Can dang nhap. F2 se hien tracking timeline." />
    </div>
  );
}

export function Admin() {
  return (
    <div>
      <PageHeader title="Admin dashboard" />
      <EmptyState message="Skeleton. F3 se lam bang Users/Tours/Bookings." />
    </div>
  );
}

export function Forbidden() {
  return <PageHeader title="403 - Khong co quyen" />;
}

export function NotFound() {
  return <PageHeader title="404 - Khong tim thay trang" />;
}
