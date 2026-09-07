import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTourDetail } from "../services/tourApi";
import { createBooking } from "../services/bookingApi";
import type { TourDetail } from "../types";
import { Loading, ErrorState, PageHeader } from "../components/common/common";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, FieldError } from "../components/ui/fields";
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

  useEffect(() => {
    getTourDetail(Number(tourId))
      .then(setTour)
      .catch(() => setError("Không tìm thấy tour hoặc tour chưa mở bán."))
      .finally(() => setLoading(false));
  }, [tourId]);

  if (loading) return <Loading />;
  if (error || !tour) return <ErrorState message={error || "Không tìm thấy tour."} />;
  const current = tour;

  const qty = Number(quantity);
  const validQty = Number.isInteger(qty) && qty > 0;
  const amount = validQty ? tour.priceFrom * qty : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validQty) {
      setFieldError("Số lượng phải là số nguyên lớn hơn 0.");
      return;
    }
    setFieldError("");
    setSubmitting(true);
    try {
      const booking = await createBooking(current.id, qty);
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
            {tour.destination?.name} · Giá/người: {formatVND(tour.priceFrom)}
          </p>
        </Card>
        <Card>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="text-sm text-[#0F172A]">
              Số lượng
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
            <FieldError message={fieldError} />
            <p className="text-sm font-bold text-[#0F172A]">Tổng tiền: {formatVND(amount)}</p>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang đặt..." : "Xác nhận đặt"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
