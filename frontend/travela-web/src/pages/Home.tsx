import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTours } from "../services/tourApi";
import type { Tour } from "../types";
import { Loading, EmptyState, ErrorState } from "../components/common/common";
import { TourCard } from "../components/common/TourCard";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { useRegionImages, type RegionName } from "../lib/image-store";

function ExploreSection() {
  const { regions } = useRegionImages();
  const tabs = Object.keys(regions) as RegionName[];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const items = regions[activeTab];

  return (
    <section className="py-8">
      <h2 className="mb-6 text-center text-3xl font-bold text-[#535041] md:text-4xl">
        Khám phá Việt Nam cùng Travela
      </h2>

      <div className="mb-8 flex justify-center gap-8 border-b border-[#e0dbd0]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 text-lg font-bold transition-colors",
              activeTab === tab
                ? "border-b-3 border-[#535041] text-[#535041]"
                : "text-[#535041]/50 hover:text-[#535041]/80",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.name}
            to={`/destinations?search=${encodeURIComponent(item.name)}`}
            className="group relative block h-48 overflow-hidden rounded-xl"
          >
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 rounded-md bg-[#535041]/80 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function Home() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getTours({ page: 1, pageSize: 3 })
      .then((t) => setTours(t.items))
      .catch(() => setError("Không tải được dữ liệu trang chủ."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <ExploreSection />

      {!loading && !error && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-[#535041]">Tour nổi bật</h2>
          {tours.length === 0 ? (
            <EmptyState message="Chưa có tour." />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {tours.map((t) => (
                <TourCard key={t.id} tour={t} />
              ))}
            </div>
          )}
        </section>
      )}

      {loading && <Loading />}
      {error && <ErrorState message={error} />}

      <section className="text-center">
        <Link to="/tours">
          <Button className="rounded-full bg-[#A79F84] px-8 text-white hover:bg-[#A79F84]/90">
            Xem tất cả tour
          </Button>
        </Link>
      </section>
    </div>
  );
}
