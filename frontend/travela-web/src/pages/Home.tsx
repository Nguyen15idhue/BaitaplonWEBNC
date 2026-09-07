import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTours } from "../services/tourApi";
import { listDestinations } from "../services/destinationApi";
import type { Destination, Tour } from "../types";
import { Loading, EmptyState, ErrorState, PageHeader } from "../components/common/common";
import { TourCard } from "../components/common/TourCard";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

export function Home() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getTours({ page: 1, pageSize: 3 }), listDestinations()])
      .then(([t, d]) => {
        setTours(t.items);
        setDestinations(d);
      })
      .catch(() => setError("Không tải được dữ liệu trang chủ."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  const regions = ["Bắc", "Trung", "Nam"];
  return (
    <div className="flex flex-col gap-8">
      <Card className="p-6 text-center md:p-8">
        <h1 className="mb-2 text-xl font-bold text-[#0F172A] md:text-2xl">Khám phá Việt Nam cùng Travela</h1>
        <p className="mb-4 text-sm text-[#64748B]">Tìm kiếm, so sánh và đặt tour trực tuyến nhanh chóng.</p>
        <div className="flex justify-center gap-2">
          <Link to="/tours">
            <Button>Xem tour</Button>
          </Link>
          <Link to="/destinations">
            <Button variant="outline">Điểm đến</Button>
          </Link>
        </div>
      </Card>

      <section>
        <PageHeader title="Tour nổi bật" />
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

      <section>
        <PageHeader title="Điểm đến theo vùng" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {regions.map((r) => (
            <Link key={r} to={`/destinations?region=${encodeURIComponent(r)}`}>
              <Card>
                <h3 className="mb-1 text-sm font-semibold text-[#0F172A]">Miền {r}</h3>
                <p className="text-sm text-[#64748B]">
                  {destinations
                    .filter((d) => d.regionName === r)
                    .slice(0, 3)
                    .map((d) => d.name)
                    .join(", ")}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
