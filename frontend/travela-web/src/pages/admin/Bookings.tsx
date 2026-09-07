import { useEffect, useState } from "react";
import { adminListBookings, getBooking, updateBookingStatus } from "../../services/bookingApi";
import { listAuditLogs, type AuditLog } from "../../services/auditApi";
import type { Booking } from "../../types";
import { Loading, EmptyState, ErrorState, PageHeader, Pagination } from "../../components/common/common";
import { Card, Badge } from "../../components/ui/card";
import { Table } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Select, Input } from "../../components/ui/fields";
import { Dialog } from "../../components/ui/dialog";
import { useToast, toastForApiError } from "../../components/ui/toast";
import { formatVND, bookingTone } from "../../lib/format";

const STATUSES = ["", "PendingPayment", "Paid", "Confirmed", "Ongoing", "Completed", "Cancelled"];
// Gợi ý chuyển tiếp đúng state machine từ trạng thái hiện tại.
const NEXT: Record<string, string[]> = {
  PendingPayment: ["Paid", "Cancelled"],
  Paid: ["Confirmed", "Cancelled"],
  Confirmed: ["Ongoing", "Cancelled"],
  Ongoing: ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

export function AdminBookings() {
  const { push } = useToast();
  const [items, setItems] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [nextStatus, setNextStatus] = useState("");
  const [note, setNote] = useState("");
  const pageSize = 12;

  async function load(p: number, s: string) {
    setLoading(true);
    setError("");
    try {
      const res = await adminListBookings(s || undefined, p, pageSize);
      setItems(res.items);
      setTotal(res.total);
      setPage(res.page);
    } catch {
      setError("Không tải được bookings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeStatus(s: string) {
    setStatus(s);
    load(1, s);
  }

  async function openDetail(id: number) {
    try {
      const b = await getBooking(id);
      setDetail(b);
      setNextStatus("");
      setNote("");
      setAudits(await listAuditLogs("Booking", id));
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  async function applyStatus() {
    if (!detail || !nextStatus) {
      push("Chọn trạng thái mới.", "error");
      return;
    }
    try {
      const updated = await updateBookingStatus(detail.id, nextStatus, note);
      setDetail(updated);
      setAudits(await listAuditLogs("Booking", updated.id));
      push(`Đã chuyển sang ${nextStatus}.`, "success");
      load(page, status);
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  return (
    <div>
      <PageHeader title="Quản lý Booking" />
      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={(e) => changeStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : items.length === 0 ? (
        <EmptyState message="Không có booking." />
      ) : (
        <>
          <Table headers={["ID", "Tour", "User", "SL", "Tiền", "Trạng thái", "Thao tác"]}>
            {items.map((b) => (
              <tr key={b.id} className="border-b border-[#E2E8F0]">
                <td className="px-4 py-2">{b.id}</td>
                <td className="px-4 py-2">{b.tourName}</td>
                <td className="px-4 py-2">{b.username}</td>
                <td className="px-4 py-2">{b.quantity}</td>
                <td className="px-4 py-2">{b.checkout ? formatVND(b.checkout.amount) : "-"}</td>
                <td className="px-4 py-2">
                  <Badge tone={bookingTone(b.status)}>{b.status}</Badge>
                </td>
                <td className="px-4 py-2">
                  <Button variant="outline" onClick={() => openDetail(b.id)}>
                    Chi tiết
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} pageSize={pageSize} total={total} onPage={(p) => load(p, status)} />
        </>
      )}

      <Dialog open={!!detail} title={`Booking #${detail?.id}`} onClose={() => setDetail(null)}>
        {detail && (
          <div className="flex flex-col gap-2 text-sm">
            <p>
              Tour: {detail.tourName} · User: {detail.username} · SL: {detail.quantity}
            </p>
            <p>
              Trạng thái: <Badge tone={bookingTone(detail.status)}>{detail.status}</Badge>
            </p>
            <h3 className="font-semibold">Lịch trình:</h3>
            <ul className="flex flex-col gap-1">
              {detail.tracking.map((t, i) => (
                <li key={i} className="text-[#64748B]">
                  <Badge tone="muted">{t.status}</Badge> {new Date(t.at).toLocaleString("vi-VN")} · bởi {t.by}
                  {t.note ? ` · ${t.note}` : ""}
                </li>
              ))}
            </ul>
            <h3 className="font-semibold">Đổi trạng thái:</h3>
            <div className="flex gap-2">
              <Select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                <option value="">Chọn...</option>
                {(NEXT[detail.status] ?? []).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <Input placeholder="Ghi chú" value={note} onChange={(e) => setNote(e.target.value)} />
              <Button onClick={applyStatus}>Áp dụng</Button>
            </div>
            <h3 className="font-semibold">Audit:</h3>
            {audits.length === 0 ? (
              <EmptyState message="Chưa có audit." />
            ) : (
              <ul className="flex flex-col gap-1 text-[#64748B]">
                {audits.map((a) => (
                  <li key={a.id}>
                    {a.action}: {a.oldValue ?? "-"} → {a.newValue ?? "-"}
                  </li>
                ))}
              </ul>
            )}
            <Card>
              <p className="text-[#64748B]">Đổi sai thứ tự BE trả 400, toast sẽ hiện lỗi.</p>
            </Card>
          </div>
        )}
      </Dialog>
    </div>
  );
}
