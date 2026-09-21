import { Link } from "react-router-dom";
import type { Tour } from "../../types";
import { formatVND, formatDateTime } from "../../lib/format";
import { SafeImage } from "./SafeImage";
import { FileText, MapPin, Calendar, Clock } from "lucide-react";

interface TourCardProps {
  tour: Tour;
  showDetails?: boolean;
}

export function TourCard({ tour, showDetails = false }: TourCardProps) {
  return (
    <Link to={`/tours/${tour.id}`} className="flex h-full w-full">
      <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border-2 border-[#A79F84] bg-white transition-shadow hover:shadow-lg">
        <SafeImage src={tour.thumbnail} alt={tour.tourName} className="h-48 w-full object-cover" />
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="text-base font-bold text-[#535041] line-clamp-2">{tour.tourName}</h3>

          {showDetails && (
            <>
              <div className="flex items-center gap-2 text-sm text-[#535041]">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">{tour.description || `NDSGN${tour.id.toString().padStart(4, "0")}`}</span>
              </div>
              {tour.departureLocation && (
                <div className="flex items-center gap-2 text-sm text-[#535041]">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>Khởi hành: {tour.departureLocation}</span>
                </div>
              )}
              {tour.startDate && (
                <div className="flex items-center gap-2 text-sm text-[#535041]">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Khởi hành: {formatDateTime(tour.startDate)}</span>
                </div>
              )}
              {tour.duration && (
                <div className="flex items-center gap-2 text-sm text-[#535041]">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>{tour.duration}</span>
                </div>
              )}
            </>
          )}

          <div className="mt-auto flex items-center justify-between pt-2">
            <p className="text-sm text-[#535041]">
              Giá từ <span className="font-bold text-[#A79F84]">{formatVND(tour.priceFrom)}</span>
            </p>
            <span className="rounded-md bg-[#A79F84] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#968c73]">
              Chi tiết
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
