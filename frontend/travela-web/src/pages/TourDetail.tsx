import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTourDetail } from "../services/tourApi";
import type { TourDetail } from "../types";
import { Loading, EmptyState, ErrorState } from "../components/common/common";
import { SafeImage } from "../components/common/SafeImage";
import { formatVND } from "../lib/format";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function TourDetailPage() {
  const { id } = useParams();
  const [tour, setTour] = useState<TourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError("");
    getTourDetail(Number(id))
      .then((t) => {
        setTour(t);
        setActiveImg(0);
      })
      .catch(() => setError("Không tìm thấy tour."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (error || !tour) return <ErrorState message={error || "Không tìm thấy tour."} />;

  const images = [...(tour.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const prices = tour.prices ?? [];

  function prevImg() {
    setActiveImg((i) => (i === 0 ? images.length - 1 : i - 1));
  }

  function nextImg() {
    setActiveImg((i) => (i === images.length - 1 ? 0 : i + 1));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-center text-3xl font-bold leading-tight text-[#535041] md:text-4xl">
        {tour.tourName}
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="overflow-hidden rounded-xl border-2 border-[#A79F84] bg-[#fffaf2]">
          {images.length === 0 ? (
            <div className="flex h-96 items-center justify-center text-[#535041]/50">
              Chưa có ảnh
            </div>
          ) : (
            <>
              <div className="relative h-80 md:h-[480px]">
                <SafeImage
                  src={images[activeImg]?.imageUrl ?? ""}
                  alt={tour.tourName}
                  className="h-full w-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImg}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImg}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImg(i)}
                      className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                        i === activeImg ? "border-[#A79F84]" : "border-transparent"
                      }`}
                    >
                      <SafeImage
                        src={img.imageUrl}
                        alt={img.caption}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col rounded-xl border-2 border-[#A79F84] bg-[#fffaf2] p-6">
          <div className="flex flex-1 flex-col gap-4">
            <h2 className="text-lg font-bold text-[#535041]">{tour.tourName}</h2>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex gap-2">
                <span className="font-medium text-[#535041]">Mã tour:</span>
                <span className="text-[#535041]">{tour.description || `NDSGN${tour.id.toString().padStart(4, "0")}`}</span>
              </div>
              {tour.departureDate && (
                <div className="flex gap-2">
                  <span className="font-medium text-[#535041]">Khởi hành:</span>
                  <span className="text-[#535041]">{new Date(tour.departureDate).toLocaleDateString("vi-VN")}</span>
                </div>
              )}
              {tour.departureLocation && (
                <div className="flex gap-2">
                  <span className="font-medium text-[#535041]">Địa điểm:</span>
                  <span className="text-[#535041]">{tour.departureLocation}</span>
                </div>
              )}
              {tour.duration && (
                <div className="flex gap-2">
                  <span className="font-medium text-[#535041]">Thời gian:</span>
                  <span className="text-[#535041]">{tour.duration}</span>
                </div>
              )}
              {(tour.startDate || tour.endDate) && (
                <div className="flex gap-2">
                  <span className="font-medium text-[#535041]">Lịch tour:</span>
                  <span className="text-[#535041]">
                    {tour.startDate ? new Date(tour.startDate).toLocaleDateString("vi-VN") : "?"}
                    {" → "}
                    {tour.endDate ? new Date(tour.endDate).toLocaleDateString("vi-VN") : "?"}
                  </span>
                </div>
              )}
              {typeof tour.maxSeats === "number" && (
                <div className="flex gap-2">
                  <span className="font-medium text-[#535041]">Số chỗ:</span>
                  <span className="text-[#535041]">
                    Tối đa {tour.maxSeats}
                    {typeof tour.availableSeats === "number" ? ` · Còn ${tour.availableSeats}` : ""}
                  </span>
                </div>
              )}
              {tour.destination && (
                <div className="flex gap-2">
                  <span className="font-medium text-[#535041]">Điểm đến:</span>
                  <span className="text-[#535041]">{tour.destination.regionName} · {tour.destination.name}</span>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-lg bg-[#A79F84]/10 p-4 text-center">
              <p className="text-sm text-[#535041]">Giá từ</p>
              <p className="text-2xl font-bold text-[#A79F84]">
                {formatVND(tour.priceFrom)} <span className="text-sm font-normal text-[#535041]">/ khách</span>
              </p>
            </div>
          </div>

          <Link to={`/booking/${tour.id}`} className="mt-6">
            <button className="w-full rounded-lg bg-[#A79F84] px-6 py-3 text-base font-semibold uppercase text-white transition-colors hover:bg-[#968c73]">
              Đặt ngay
            </button>
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-xl border-2 border-[#A79F84] bg-[#fffaf2] p-6">
        <h2 className="mb-2 text-sm font-semibold text-[#535041]">Bảng giá theo nguồn</h2>
        {prices.length === 0 ? (
          <EmptyState message="Chưa có giá hiệu lực." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#A79F84]/30 text-left text-[#535041]">
                  <th className="px-4 py-2">Nguồn</th>
                  <th className="px-4 py-2">Giá</th>
                  <th className="px-4 py-2">Hiệu lực từ</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p) => (
                  <tr key={p.id} className="border-b border-[#A79F84]/20">
                    <td className="px-4 py-2">{p.sourceName}</td>
                    <td className="px-4 py-2 font-medium">{formatVND(p.priceValue)}</td>
                    <td className="px-4 py-2 text-[#535041]/70">{new Date(p.effectiveDate).toLocaleDateString("vi-VN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
