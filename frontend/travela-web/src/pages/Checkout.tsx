import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBooking } from "../services/bookingApi";
import type { Booking } from "../types";
import { Loading, ErrorState, PageHeader } from "../components/common/common";
import { Card, Badge } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { formatVND, bookingTone } from "../lib/format";
import { label, BOOKING_STATUS_LABEL } from "../lib/labels";

export function CheckoutPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getBooking(Number(bookingId))
      .then(setBooking)
      .catch(() => setError("Không tìm thấy booking."))
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) return <Loading />;
  if (error || !booking) return <ErrorState message={error || "Không tìm thấy booking."} />;

  return (
    <div>
      <PageHeader title="Checkout" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-[#0F172A]">Thông tin đặt tour</h2>
          <p className="text-sm">Tour: {booking.tourName}</p>
          <p className="text-sm">Số lượng: {booking.quantity}</p>
          <p className="text-sm">
            Trạng thái: <Badge tone={bookingTone(booking.status)}>{label(BOOKING_STATUS_LABEL, booking.status)}</Badge>
          </p>
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-[#0F172A]">Thanh toán</h2>
          {booking.checkout ? (
            <>
              <p className="text-sm">Số tiền: <strong>{formatVND(booking.checkout.amount)}</strong></p>
              <p className="text-sm">
                Trạng thái: <Badge tone={booking.checkout.status === "Paid" ? "success" : "muted"}>{label(BOOKING_STATUS_LABEL, booking.checkout.status)}</Badge>
              </p>
              <p className="text-sm text-[#64748B]">Mã GD: {booking.checkout.transactionRef}</p>
            </>
          ) : (
            <p className="text-sm text-[#64748B]">Chưa có thông tin thanh toán.</p>
          )}
          <div className="mt-3">
            <Link to="/my-bookings">
              <Button>Xem booking của tôi</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
