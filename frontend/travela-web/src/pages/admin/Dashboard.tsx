import { useEffect, useState } from "react";
import { getAdminStats } from "../../services/statsApi";
import { adminListBookings } from "../../services/bookingApi";
import type { Booking } from "../../types";
import { Loading, ErrorState, PageHeader } from "../../components/common/common";
import { Card, Badge } from "../../components/ui/card";
import { Table } from "../../components/ui/table";
import { formatVND, bookingTone } from "../../lib/format";
import { label, BOOKING_STATUS_LABEL } from "../../lib/labels";

// Dashboard: số liệu từ GET /admin/stats (aggregate DB) + 5 đơn mới nhất.
export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toursTotal, setToursTotal] = useState(0);
  const [usersTotal, setUsersTotal] = useState(0);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [latest, setLatest] = useState<Booking[]>([]);

  useEffect(() => {
    // C07: doanh thu/tổng từ stats (đúng cả khi >50 booking); latest lấy page 1 x 5.
    Promise.all([getAdminStats(), adminListBookings(undefined, 1, 5)])
      .then(([s, b]) => {
        setToursTotal(s.toursTotal);
        setUsersTotal(s.usersTotal);
        setBookingsTotal(s.bookingsTotal);
        setRevenue(s.revenuePaid);
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
