import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTourDetail } from "../services/tourApi";
import type { TourDetail, ItineraryDay } from "../types";
import { Loading, ErrorState } from "../components/common/common";
import { SafeImage } from "../components/common/SafeImage";
import { formatVND } from "../lib/format";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Utensils } from "lucide-react";

export function TourDetailPage() {
  const { id } = useParams();
  const [tour, setTour] = useState<TourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [openItineraryDay, setOpenItineraryDay] = useState<number | null>(0);
  const [openCondition, setOpenCondition] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    getTourDetail(Number(id))
      .then((t) => { setTour(t); setActiveImg(0); })
      .catch(() => setError("Không tìm thấy tour."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (error || !tour) return <ErrorState message={error || "Không tìm thấy tour."} />;

  const images = [...(tour.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const prices = tour.prices ?? [];

  let itineraryDays: ItineraryDay[] = [];
  if (tour.itineraryDays) {
    try { itineraryDays = JSON.parse(tour.itineraryDays); } catch { itineraryDays = []; }
  }

  function prevImg() { setActiveImg((i) => (i === 0 ? images.length - 1 : i - 1)); }
  function nextImg() { setActiveImg((i) => (i === images.length - 1 ? 0 : i + 1)); }
  function toggleItinerary(day: number) { setOpenItineraryDay(openItineraryDay === day ? null : day); }
  function toggleCondition(key: string) { setOpenCondition(openCondition === key ? null : key); }

  const adultPrice = prices.find((p) => p.sourceName.toLowerCase() === "người lớn");
  const childPrice = prices.find((p) => p.sourceName.toLowerCase() === "trẻ em");
  const supplementPrice = prices.find((p) => p.sourceName.toLowerCase() === "phụ thu");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* ---- 1. Ảnh + Thông tin tour (sidebar) ---- */}
      <div className="mb-6 rounded-xl border-2 border-[#A79F84] bg-[#fffaf2] p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <div className="overflow-hidden rounded-xl border-2 border-[#A79F84] bg-white">
            {images.length === 0 ? (
              <div className="flex h-80 items-center justify-center text-[#535041]/50">Chưa có ảnh</div>
            ) : (
              <>
                <div className="relative h-72 md:h-[420px]">
                  <SafeImage src={images[activeImg]?.imageUrl ?? ""} alt={tour.tourName} className="h-full w-full object-cover" />
                  {images.length > 1 && (
                    <>
                      <button onClick={prevImg} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60">
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button onClick={nextImg} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60">
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto p-3">
                    {images.map((img, i) => (
                      <button key={img.id} onClick={() => setActiveImg(i)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${i === activeImg ? "border-[#A79F84]" : "border-transparent"}`}>
                        <SafeImage src={img.imageUrl} alt={img.caption} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col rounded-xl border-2 border-[#A79F84] bg-white p-6">
            <div className="flex flex-1 flex-col gap-3">
              <h1 className="text-xl font-bold text-[#535041]">{tour.tourName}</h1>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex gap-2">
                  <span className="font-medium text-[#535041]">Mã tour:</span>
                  <span className="text-[#535041]">NDSGN{tour.id.toString().padStart(4, "0")}</span>
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
                {typeof tour.maxSeats === "number" && (
                  <div className="flex gap-2">
                    <span className="font-medium text-[#535041]">Số chỗ:</span>
                    <span className="text-[#535041]">Tối đa {tour.maxSeats}{typeof tour.availableSeats === "number" ? ` · Còn ${tour.availableSeats}` : ""}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-[#A79F84]/10 p-4 text-center">
              <p className="text-sm text-[#535041]">Giá từ</p>
              <p className="text-2xl font-bold text-[#A79F84]">{formatVND(adultPrice ? adultPrice.priceValue : tour.priceFrom)} <span className="text-sm font-normal text-[#535041]">/ khách</span></p>
            </div>
            <Link to={`/booking/${tour.id}`} className="mt-4">
              <button className="w-full rounded-lg bg-[#A79F84] px-6 py-3 text-base font-semibold uppercase text-white transition-colors hover:bg-[#968c73]">Đặt ngay</button>
            </Link>
          </div>
        </div>
      </div>

      {/* ---- 2. Lịch trình tour (JSON hoặc text) ---- */}
      {itineraryDays.length > 0 && (
        <div className="mb-6 rounded-xl border-2 border-[#A79F84] bg-[#fffaf2] p-6">
          <h2 className="mb-4 text-base font-bold text-[#535041]">Lịch trình tour</h2>
          <div className="space-y-2">
            {itineraryDays.map((day) => (
              <div key={day.day} className="overflow-hidden rounded-xl border border-[#A79F84]/40 bg-white">
                <button onClick={() => toggleItinerary(day.day)} className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#A79F84]/5">
                  <span className="text-sm font-bold text-[#535041]">
                    Ngày {day.day}: {day.title}
                  </span>
                  <div className="flex items-center gap-3">
                    {day.meals && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-[#A79F84]">
                        <Utensils className="h-3.5 w-3.5" />
                        {day.meals}
                      </span>
                    )}
                    {openItineraryDay === day.day
                      ? <ChevronUp className="h-5 w-5 shrink-0 text-[#A79F84]" />
                      : <ChevronDown className="h-5 w-5 shrink-0 text-[#A79F84]" />}
                  </div>
                </button>
                {openItineraryDay === day.day && (
                  <div className="border-t border-[#A79F84]/20 px-5 py-4 text-sm leading-relaxed text-[#535041]">
                    {day.content.split("\n").map((line, i) => {
                      const trimmed = line.trim();
                      if (!trimmed) return null;
                      return (
                        <div key={i} className="flex gap-2 py-1">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#A79F84]" />
                          <span>{trimmed}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {itineraryDays.length === 0 && tour.itinerary && (
        <div className="mb-6 rounded-xl border-2 border-[#A79F84] bg-[#fffaf2] p-6">
          <h2 className="mb-2 text-base font-bold text-[#535041]">Lịch trình</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-[#535041]">{tour.itinerary}</p>
        </div>
      )}

      {/* ---- 4. Giá tour ---- */}
      {prices.length > 0 && (
        <div className="mb-6 rounded-xl border-2 border-[#A79F84] bg-[#fffaf2] p-6">
          <h2 className="mb-4 text-base font-bold text-[#535041]">Giá tour</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#A79F84]/30 text-left text-[#535041]">
                  <th className="px-4 py-3">Đối tượng</th>
                  <th className="px-4 py-3">Giá</th>
                </tr>
              </thead>
              <tbody>
                {adultPrice && (
                  <tr className="border-b border-[#A79F84]/20">
                    <td className="px-4 py-3 font-medium text-[#535041]">Người lớn <span className="font-normal text-[#535041]/70">(Từ 12 tuổi trở lên)</span></td>
                    <td className="px-4 py-3 font-bold text-[#A79F84]">{formatVND(adultPrice.priceValue)}</td>
                  </tr>
                )}
                {childPrice && (
                  <tr className="border-b border-[#A79F84]/20">
                    <td className="px-4 py-3 font-medium text-[#535041]">Trẻ em <span className="font-normal text-[#535041]/70">(Dưới 12 tuổi)</span></td>
                    <td className="px-4 py-3 font-bold text-[#A79F84]">{formatVND(childPrice.priceValue)}</td>
                  </tr>
                )}
                {supplementPrice && (
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#535041]">Phụ thu phòng <span className="font-normal text-[#535041]/70">(Phụ thu phòng đơn)</span></td>
                    <td className="px-4 py-3 font-bold text-[#A79F84]">{formatVND(supplementPrice.priceValue)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- 6. Điều kiện tour ---- */}
      {(tour.included || tour.excluded || tour.paymentTerms || tour.cancellationPolicy || tour.applicationConditions || tour.terms) && (
        <div className="mb-6 rounded-xl border-2 border-[#A79F84] bg-[#fffaf2] p-6">
          <h2 className="mb-4 text-base font-bold text-[#535041]">Điều kiện tour</h2>
          <div className="space-y-2">
            {tour.included && (
              <ConditionItem title="Giá tour bao gồm" content={tour.included} isOpen={openCondition === "included"} onToggle={() => toggleCondition("included")} />
            )}
            {tour.excluded && (
              <ConditionItem title="Giá tour không bao gồm" content={tour.excluded} isOpen={openCondition === "excluded"} onToggle={() => toggleCondition("excluded")} />
            )}
            {tour.paymentTerms && (
              <ConditionItem title="Điều kiện thanh toán" content={tour.paymentTerms} isOpen={openCondition === "paymentTerms"} onToggle={() => toggleCondition("paymentTerms")} />
            )}
            {tour.cancellationPolicy && (
              <ConditionItem title="Lưu ý chuyển hoặc hủy tour" content={tour.cancellationPolicy} isOpen={openCondition === "cancellationPolicy"} onToggle={() => toggleCondition("cancellationPolicy")} />
            )}
            {tour.applicationConditions && (
              <ConditionItem title="Điều kiện áp dụng" content={tour.applicationConditions} isOpen={openCondition === "applicationConditions"} onToggle={() => toggleCondition("applicationConditions")} />
            )}
            {tour.terms && (
              <ConditionItem title="Điều kiện (đặt cọc, hủy, đổi lịch)" content={tour.terms} isOpen={openCondition === "terms"} onToggle={() => toggleCondition("terms")} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ConditionItem({ title, content, isOpen, onToggle }: { title: string; content: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-lg border border-[#A79F84]/30 bg-white">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[#A79F84]/5">
        <span className="font-semibold text-[#535041]">{title}</span>
        {isOpen ? <ChevronUp className="h-5 w-5 shrink-0 text-[#A79F84]" /> : <ChevronDown className="h-5 w-5 shrink-0 text-[#A79F84]" />}
      </button>
      {isOpen && (
        <div className="border-t border-[#A79F84]/20 px-4 py-3 text-sm leading-relaxed text-[#535041]">
          {content.split("\n").map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return null;
            return (
              <div key={i} className="flex gap-2 py-1">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#A79F84]" />
                <span>{trimmed}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
