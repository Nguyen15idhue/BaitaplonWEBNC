import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getTourDetail } from "../services/tourApi";
import { createBooking } from "../services/bookingApi";
import type { TourDetail } from "../types";
import { Loading, ErrorState, PageHeader } from "../components/common/common";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Field, Input, FieldError } from "../components/ui/fields";
import { useToast, toastForApiError } from "../components/ui/toast";
import { formatVND } from "../lib/format";

export function BookingPage() {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const [tour, setTour] = useState<TourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [fieldError, setFieldError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Khóa form sau khi đặt xong: Back trình duyệt không đặt trùng được.
  const [doneId, setDoneId] = useState<number | null>(() =>
    Number(sessionStorage.getItem(`booked_${tourId}`) || 0) || null,
  );

  useEffect(() => {
    setLoading(true);
    setError("");
    getTourDetail(Number(tourId))
      .then(setTour)
      .catch(() => setError("Không tìm thấy tour hoặc tour chưa mở bán."))
      .finally(() => setLoading(false));
  }, [tourId]);

  if (loading) return <Loading />;
  if (error || !tour) return <ErrorState message={error || "Không tìm thấy tour."} />;
  const current = tour;

  if (doneId) {
    return (
      <div>
        <PageHeader title="Đặt tour" />
        <Card className="max-w-md">
          <p className="mb-3 text-sm text-[#0F172A]">
            Bạn đã đặt tour này xong. Vào Chuyến của tôi để theo dõi.
          </p>
          <div className="flex gap-2">
            <Link to={`/checkout/${doneId}`}>
              <Button>Xem thanh toán</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                sessionStorage.removeItem(`booked_${tourId}`);
                setDoneId(null);
              }}
            >
              Đặt thêm
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const qty = Number(quantity);
  const validQty = Number.isInteger(qty) && qty > 0;
  const amount = validQty ? tour.priceFrom * qty : 0;
  // C06/B1: tour chưa có giá -> Liên hệ, hết chỗ -> khóa nút.
  const noPrice = tour.priceFrom <= 0;
  const soldOut = tour.availableSeats <= 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validQty) {
      setFieldError("Số lượng phải là số nguyên lớn hơn 0.");
      return;
    }
    if (qty > current.availableSeats) {
      setFieldError(`Chỉ còn ${current.availableSeats} chỗ, giảm số lượng.`);
      return;
    }
    setFieldError("");
    setSubmitting(true);
    try {
      const booking = await createBooking(current.id, qty);
      sessionStorage.setItem(`booked_${tourId}`, String(booking.id));
      push("Đặt tour thành công.", "success");
      navigate(`/checkout/${booking.id}`);
    } catch (err) {
      toastForApiError(push, err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Đặt tour" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-[#0F172A]">{tour.tourName}</h2>
          <p className="text-sm text-[#64748B]">
            {tour.destination?.name} · Giá/người: {noPrice ? "Liên hệ" : formatVND(tour.priceFrom)}
          </p>
          <p className="text-sm text-[#64748B]">
            Còn {tour.availableSeats}/{tour.maxSeats} chỗ
          </p>
        </Card>
        <Card>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <Field label="Số lượng người">
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
            <FieldError message={fieldError} />
            {noPrice && <FieldError message="Tour chưa có giá bán, vui lòng liên hệ." />}
            {soldOut && !noPrice && <FieldError message="Tour đã hết chỗ." />}
            {qty > tour.availableSeats && !noPrice && !soldOut && (
              <FieldError message={`Chỉ còn ${tour.availableSeats} chỗ.`} />
            )}
            <p className="text-sm font-bold text-[#0F172A]">Tổng tiền: {formatVND(amount)}</p>
            <Button type="submit" loading={submitting} disabled={noPrice || soldOut || qty > tour.availableSeats}>
              Xác nhận đặt
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
