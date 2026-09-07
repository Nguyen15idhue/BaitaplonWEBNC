import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cancelBooking, getBooking, getMyBookings } from "../services/bookingApi";
import type { Booking } from "../types";
import { Loading, EmptyState, ErrorState, PageHeader, Pagination, ConfirmDialog } from "../components/common/common";
import { Card, Badge } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Field, Select } from "../components/ui/fields";
import { Dialog } from "../components/ui/dialog";
import { useToast, toastForApiError } from "../components/ui/toast";
import { formatVND, bookingTone } from "../lib/format";
import { label, BOOKING_STATUS_LABEL } from "../lib/labels";

const STATUSES = ["", "PendingPayment", "Paid", "Confirmed", "Ongoing", "Completed", "Cancelled"];

export function MyBookings() {
  const { push } = useToast();
  const [items, setItems] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const pageSize = 12;

  async function load(p: number, s: string) {
    setLoading(true);
    setError("");
    try {
      const res = await getMyBookings(s || undefined, p, pageSize);
      setItems(res.items);
      setTotal(res.total);
      setPage(res.page);
    } catch {
      setError("Không tải được booking.");
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
      setDetail(await getBooking(id));
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  async function confirmCancel() {
    if (!cancelling) return;
    try {
      await cancelBooking(cancelling.id);
      push("Đã hủy booking.", "success");
      setCancelling(null);
      setDetail(null);
      load(page, status);
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  const canCancel = (b: Booking) => b.status !== "Completed" && b.status !== "Cancelled";

  return (
    <div>
      <PageHeader title="Chuyến của tôi" />
      <div className="mb-4 max-w-xs">
        <Field label="Trạng thái">
          <Select value={status} onChange={(e) => changeStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {label(BOOKING_STATUS_LABEL, s)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : items.length === 0 ? (
        <EmptyState
          message="Bạn chưa có chuyến đi nào."
          action={
            <Link to="/tours">
              <Button>Xem tour ngay</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {items.map((b) => (
              <Card key={b.id}>
                <h3 className="mb-1 text-sm font-semibold text-[#0F172A]">{b.tourName}</h3>
                <p className="text-sm text-[#64748B]">
                  Số lượng: {b.quantity}
                  {b.checkout ? ` · ${formatVND(b.checkout.amount)}` : ""}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge tone={bookingTone(b.status)}>{label(BOOKING_STATUS_LABEL, b.status)}</Badge>
                  <Button variant="outline" onClick={() => openDetail(b.id)}>
                    Chi tiết
                  </Button>
                  {canCancel(b) && (
                    <Button variant="danger" onClick={() => setCancelling(b)}>
                      Hủy
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={page} pageSize={pageSize} total={total} onPage={(p) => load(p, status)} />
        </>
      )}

      <Dialog open={!!detail} title={`Booking #${detail?.id}`} onClose={() => setDetail(null)}>
        {detail && (
          <div className="flex flex-col gap-1 text-sm">
            <p>Tour: {detail.tourName}</p>
            <p>Số lượng: {detail.quantity}</p>
            <p>
              Trạng thái: <Badge tone={bookingTone(detail.status)}>{label(BOOKING_STATUS_LABEL, detail.status)}</Badge>
            </p>
            <h3 className="mt-2 font-semibold">Lịch trình:</h3>
            {detail.tracking.length === 0 ? (
              <EmptyState message="Chưa có mốc tracking." />
            ) : (
              <ul className="flex flex-col gap-1">
                {detail.tracking.map((t, i) => (
                  <li key={i} className="text-[#64748B]">
                    <Badge tone="muted">{label(BOOKING_STATUS_LABEL, t.status)}</Badge> {new Date(t.at).toLocaleString("vi-VN")} · bởi {t.by}
                    {t.note ? ` · ${t.note}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!cancelling}
        title="Hủy booking"
        message={`Hủy booking #${cancelling?.id} (${cancelling?.tourName})?`}
        onConfirm={confirmCancel}
        onClose={() => setCancelling(null)}
      />
    </div>
  );
}
