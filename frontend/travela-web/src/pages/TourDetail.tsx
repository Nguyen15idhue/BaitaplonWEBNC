import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTourDetail } from "../services/tourApi";
import type { TourDetail } from "../types";
import { Loading, ErrorState } from "../components/common/common";
import { SafeImage } from "../components/common/SafeImage";
import { formatVND } from "../lib/format";

export function TourDetailPage() {
  const { id } = useParams();
  const [tour, setTour] = useState<TourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
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

  const images = [...tour.images].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-center text-3xl font-bold leading-tight text-[#535041] md:text-4xl">
        {tour.tourName}
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-xl border-2 border-[#A79F84]">
          {images.length === 0 ? (
            <div className="flex h-72 items-center justify-center bg-gray-100 text-gray-400">
              Chưa có ảnh
            </div>
          ) : (
            <>
              <SafeImage
                src={images[activeImg]?.imageUrl ?? ""}
                alt={tour.tourName}
                className="h-72 w-full object-cover md:h-96"
              />
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto bg-white p-2">
                  {images.map((img, i) => (
                    <button key={img.id} onClick={() => setActiveImg(i)} aria-label={`Xem ảnh ${i + 1}`}>
                      <SafeImage
                        src={img.imageUrl}
                        alt={img.caption}
                        className={`h-16 w-24 rounded object-cover ${i === activeImg ? "ring-2 ring-[#A79F84]" : ""}`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-xl border-2 border-[#A79F84] bg-white p-6">
          <div>
            <p className="text-sm text-[#535041]">Giá từ</p>
            <p className="text-3xl font-bold text-[#A79F84]">
              {formatVND(tour.priceFrom)} <span className="text-base font-normal text-[#535041]">/ khách</span>
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#A79F84]/30 pt-4">
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
                <span className="font-medium text-[#535041]">Địa điểm xuất phát:</span>
                <span className="text-[#535041]">{tour.departureLocation}</span>
              </div>
            )}
            {tour.duration && (
              <div className="flex gap-2">
                <span className="font-medium text-[#535041]">Thời gian:</span>
                <span className="text-[#535041]">{tour.duration}</span>
              </div>
            )}
          </div>

          <Link to={`/booking/${tour.id}`} className="mt-auto">
            <button className="w-full rounded-lg bg-[#A79F84] px-6 py-3 text-base font-semibold uppercase text-white transition-colors hover:bg-[#968c73]">
              Đặt ngay
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
