import { useEffect, useState } from "react";
import { adminListBookings } from "../../services/bookingApi";
import { getTours } from "../../services/tourApi";
import { listUsers } from "../../services/userApi";
import type { Booking } from "../../types";
import { Loading, ErrorState, PageHeader } from "../../components/common/common";
import { Card, Badge } from "../../components/ui/card";
import { Table } from "../../components/ui/table";
import { formatVND, bookingTone } from "../../lib/format";
import { label, BOOKING_STATUS_LABEL } from "../../lib/labels";

// Dashboard: tận dụng GET /bookings + /tours + /users, không cần API thống kê riêng.
export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toursTotal, setToursTotal] = useState(0);
  const [usersTotal, setUsersTotal] = useState(0);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [latest, setLatest] = useState<Booking[]>([]);

  useEffect(() => {
    Promise.all([getTours({ page: 1, pageSize: 1 }), listUsers({ page: 1, pageSize: 1 }), adminListBookings(undefined, 1, 50)])
      .then(([t, u, b]) => {
        setToursTotal(t.total);
        setUsersTotal(u.total);
        setBookingsTotal(b.total);
        setRevenue(b.items.filter((x) => x.checkout?.status === "Paid").reduce((s, x) => s + (x.checkout?.amount ?? 0), 0));
        setLatest(b.items.slice(0, 5));
      })
      .catch(() => setError("Không tải được dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  const cards = [
    { label: "Tour", value: toursTotal },
    { label: "Đơn đặt", value: bookingsTotal },
    { label: "Người dùng", value: usersTotal },
    { label: "Doanh thu (Đã thanh toán)", value: formatVND(revenue) },
  ];
  return (
    <div>
      <PageHeader title="Tổng quan" />
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <p className="text-sm text-[#64748B]">{c.label}</p>
            <p className="text-xl font-bold text-[#0F172A]">{c.value}</p>
          </Card>
        ))}
      </div>
      <h2 className="mb-2 text-sm font-semibold text-[#0F172A]">Đơn mới nhất</h2>
          <Table headers={["Mã", "Tour", "Khách", "Trạng thái"]}>
        {latest.map((b) => (
          <tr key={b.id} className="border-b border-[#E2E8F0]">
            <td className="px-4 py-2">{b.id}</td>
            <td className="px-4 py-2">{b.tourName}</td>
            <td className="px-4 py-2">{b.username}</td>
            <td className="px-4 py-2">
              <Badge tone={bookingTone(b.status)}>{label(BOOKING_STATUS_LABEL, b.status)}</Badge>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
