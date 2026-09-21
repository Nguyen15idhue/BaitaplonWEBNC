import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getTourDetail } from "../services/tourApi";
import { createBooking } from "../services/bookingApi";
import type { TourDetail } from "../types";
import { Loading, ErrorState, PageHeader } from "../components/common/common";
import { Button } from "../components/ui/button";
import { Input, Textarea, FieldError } from "../components/ui/fields";
import { SafeImage } from "../components/common/SafeImage";
import { useToast, toastForApiError } from "../components/ui/toast";
import { formatVND } from "../lib/format";
import { Minus, Plus } from "lucide-react";

export function BookingPage() {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const [tour, setTour] = useState<TourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [adultQty, setAdultQty] = useState(1);
  const [childQty, setChildQty] = useState(0);
  const [supplementQty, setSupplementQty] = useState(0);

  const [fieldError, setFieldError] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
  const prices = current.prices ?? [];
  const images = [...(current.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const adultPrice = prices.find((p) => p.sourceName.toLowerCase() === "người lớn");
  const childPrice = prices.find((p) => p.sourceName.toLowerCase() === "trẻ em");
  const supplementPrice = prices.find((p) => p.sourceName.toLowerCase() === "phụ thu");

  const adultUnit = adultPrice?.priceValue ?? current.priceFrom ?? 0;
  const childUnit = childPrice?.priceValue ?? adultUnit;
  const supplementUnit = supplementPrice?.priceValue ?? 0;
  const totalAmount = adultUnit * adultQty + childUnit * childQty + supplementUnit * supplementQty;
  const totalQuantity = adultQty + childQty;

  if (doneId) {
    return (
      <div>
        <PageHeader title="Đặt tour" />
        <div className="mx-auto max-w-md rounded-xl border-2 border-[#A79F84] bg-[#fffaf2] p-6">
          <p className="mb-3 text-sm text-[#535041]">
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
        </div>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { setFieldError("Vui lòng nhập họ tên."); return; }
    if (!email.trim()) { setFieldError("Vui lòng nhập email."); return; }
    if (!phone.trim()) { setFieldError("Vui lòng nhập số điện thoại."); return; }
    if (totalQuantity <= 0) { setFieldError("Số lượng hành khách phải lớn hơn 0."); return; }
    if (totalQuantity > current.availableSeats) { setFieldError(`Chỉ còn ${current.availableSeats} chỗ, giảm số lượng.`); return; }
    setFieldError("");
    setSubmitting(true);
    try {
      const contactNote = [address.trim(), note.trim()].filter(Boolean).join(" | ");
      const booking = await createBooking({
        tourId: current.id,
        adultQty,
        childQty,
        supplementQty,
        contactName: fullName.trim(),
        contactEmail: email.trim(),
        contactPhone: phone.trim(),
        note: contactNote || undefined,
      });
      sessionStorage.setItem(`booked_${tourId}`, String(booking.id));
      push("Đặt tour thành công.", "success");
      navigate(`/checkout/${booking.id}`);
    } catch (err) {
      toastForApiError(push, err);
    } finally {
      setSubmitting(false);
    }
  }

  function Counter({ label, value, onChange, max }: { label: string; value: number; onChange: (v: number) => void; max?: number }) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-[#e0dbd0] bg-white px-4 py-3">
        <span className="text-sm font-medium text-[#535041]">{label}</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e0dbd0] text-[#535041] transition-colors hover:bg-[#f5f0e8]">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-6 text-center text-sm font-bold text-[#535041]">{value}</span>
          <button type="button" onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e0dbd0] text-[#535041] transition-colors hover:bg-[#f5f0e8]">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Đặt tour" />
      <form onSubmit={submit} className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* ---- Left: Form信息 ---- */}
        <div className="flex flex-col gap-6">
          {/* Thông tin liên lạc */}
          <div className="rounded-xl border-2 border-[#A79F84] bg-[#fffaf2] p-6">
            <h2 className="mb-4 text-base font-bold text-[#535041]">Thông tin liên lạc</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#535041]">Họ và tên *</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#535041]">Email *</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#535041]">Số điện thoại *</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912345678" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#535041]">Địa chỉ</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="TP. Hồ Chí Minh" />
              </div>
            </div>
          </div>

          {/* Hành khách */}
          <div className="rounded-xl border-2 border-[#A79F84] bg-[#fffaf2] p-6">
            <h2 className="mb-4 text-base font-bold text-[#535041]">Hành khách</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Counter label="Người lớn" value={adultQty} onChange={setAdultQty} max={current.availableSeats} />
              <Counter label="Trẻ em" value={childQty} onChange={setChildQty} max={current.availableSeats} />
              <Counter label="Phòng đơn" value={supplementQty} onChange={setSupplementQty} />
            </div>
          </div>

          {/* Ghi chú */}
          <div className="rounded-xl border-2 border-[#A79F84] bg-[#fffaf2] p-6">
            <h2 className="mb-4 text-base font-bold text-[#535041]">Ghi chú</h2>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Yêu cầu đặc biệt..." />
          </div>

          <FieldError message={fieldError} />
          <Button type="submit" loading={submitting} disabled={current.availableSeats <= 0} className="w-full rounded-lg bg-[#A79F84] px-6 py-3 text-base font-semibold uppercase text-white transition-colors hover:bg-[#968c73]">
            Xác nhận đặt
          </Button>
        </div>

        {/* ---- Right: Tóm tắt tour ---- */}
        <div className="flex flex-col rounded-xl border-2 border-[#A79F84] bg-[#fffaf2] p-6 lg:sticky lg:top-24 lg:self-start">
          <h2 className="mb-4 text-center text-base font-bold text-[#535041]">Tóm tắt tour</h2>
          <div className="mb-4 overflow-hidden rounded-lg border border-[#A79F84]/40">
            {images.length > 0 ? (
              <SafeImage src={images[0].imageUrl} alt={tour.tourName} className="h-48 w-full object-cover" />
            ) : (
              <div className="flex h-48 items-center justify-center bg-[#F1F5F9] text-sm text-[#64748B]">Chưa có ảnh</div>
            )}
          </div>
          <p className="mb-1 text-sm font-bold text-[#535041]">{tour.tourName}</p>
          {tour.duration && <p className="text-xs text-[#535041]">Thời gian: {tour.duration}</p>}
          {tour.departureLocation && <p className="text-xs text-[#535041]">Địa điểm: {tour.departureLocation}</p>}

          <div className="my-4 border-t border-[#A79F84]/30" />

          {/* Price breakdown */}
          <div className="flex flex-col gap-2 text-sm">
            {adultQty > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[#535041]">Người lớn:</span>
                <span className="font-bold text-[#A79F84]">{formatVND(adultUnit)} x{adultQty}</span>
              </div>
            )}
            {childQty > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[#535041]">Trẻ em:</span>
                <span className="font-bold text-[#A79F84]">{formatVND(childUnit)} x{childQty}</span>
              </div>
            )}
            {supplementQty > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[#535041]">Phòng đơn:</span>
                <span className="font-bold text-[#A79F84]">{formatVND(supplementUnit)} x{supplementQty}</span>
              </div>
            )}
          </div>

          <div className="my-4 border-t-2 border-[#A79F84]/30" />

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#535041]">TỔNG CỘNG:</span>
            <span className="text-lg font-bold text-[#A79F84]">{formatVND(totalAmount)}</span>
          </div>

          {current.availableSeats <= 0 && (
            <p className="mt-2 text-center text-xs font-medium text-red-500">Tour đã hết chỗ</p>
          )}
        </div>
      </form>
    </div>
  );
}
