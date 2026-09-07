import { Link } from "react-router-dom";
import type { Tour } from "../../types";
import { Card, Badge } from "../ui/card";
import { formatVND } from "../../lib/format";
import { SafeImage } from "./SafeImage";

// Card tour dùng chung Home + TourList (đúng token, không custom riêng).
export function TourCard({ tour }: { tour: Tour }) {
  return (
    <Link to={`/tours/${tour.id}`}>
      <Card className="overflow-hidden p-0 transition-shadow hover:shadow-md">
        <SafeImage src={tour.thumbnail} alt={tour.tourName} className="h-44 w-full object-cover" />
        <div className="flex flex-col gap-2 p-4">
          <h3 className="text-sm font-semibold text-[#0F172A]">{tour.tourName}</h3>
          <div>
            <Badge>{tour.destination?.regionName ?? ""} · {tour.destination?.name ?? ""}</Badge>
          </div>
          <p className="text-sm font-bold text-[#2563EB]">Từ {formatVND(tour.priceFrom)}</p>
        </div>
      </Card>
    </Link>
  );
}
