import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTourDetail } from "../services/tourApi";
import type { TourDetail } from "../types";
import { Loading, EmptyState, ErrorState, PageHeader } from "../components/common/common";
import { SafeImage } from "../components/common/SafeImage";
import { Card, Badge } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table } from "../components/ui/table";
import { formatVND } from "../lib/format";
import { label, TOUR_STATUS_LABEL } from "../lib/labels";

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
    <div className="flex flex-col gap-4">
      <PageHeader title={tour.tourName} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          {images.length === 0 ? (
            <EmptyState message="Tour chưa có ảnh." />
          ) : (
            <>
              <SafeImage
                src={images[activeImg]?.imageUrl ?? ""}
                alt={tour.tourName}
                className="h-56 w-full rounded-[6px] object-cover md:h-72"
              />
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setActiveImg(i)} aria-label={`Xem ảnh ${i + 1}`}>
                    <SafeImage
                      src={img.imageUrl}
                      alt={img.caption}
                      className={`h-16 w-24 rounded-[4px] object-cover ${i === activeImg ? "ring-2 ring-[#2563EB]" : ""}`}
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </Card>
        <Card className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Badge>{tour.destination?.regionName} · {tour.destination?.name}</Badge>
            <Badge tone="success">{label(TOUR_STATUS_LABEL, tour.status)}</Badge>
          </div>
          <p className="text-sm text-[#0F172A]">{tour.description}</p>
          <p className="text-sm text-[#64748B]">Số chỗ tối đa: {tour.maxSeats}</p>
          <p className="text-lg font-bold text-[#2563EB]">Từ {formatVND(tour.priceFrom)}</p>
          <Link to={`/booking/${tour.id}`}>
            <Button>Đặt ngay</Button>
          </Link>
        </Card>
      </div>
      <Card>
        <h2 className="mb-2 text-sm font-semibold text-[#0F172A]">Bảng giá theo nguồn</h2>
        {tour.prices.length === 0 ? (
          <EmptyState message="Chưa có giá hiệu lực." />
        ) : (
          <Table headers={["Nguồn", "Giá", "Hiệu lực từ"]}>
            {tour.prices.map((p) => (
              <tr key={p.id} className="border-b border-[#E2E8F0]">
                <td className="px-4 py-2">{p.sourceName}</td>
                <td className="px-4 py-2 font-medium">{formatVND(p.priceValue)}</td>
                <td className="px-4 py-2 text-[#64748B]">{new Date(p.effectiveDate).toLocaleDateString("vi-VN")}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
