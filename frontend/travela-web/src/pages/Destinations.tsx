import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listDestinations } from "../services/destinationApi";
import type { Destination } from "../types";
import { Loading, EmptyState, ErrorState, PageHeader } from "../components/common/common";
import { Card } from "../components/ui/card";

const REGIONS = ["Bắc", "Trung", "Nam"];

export function Destinations() {
  const [items, setItems] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [params] = useSearchParams();
  const highlight = params.get("region") ?? "";

  useEffect(() => {
    listDestinations()
      .then(setItems)
      .catch(() => setError("Không tải được điểm đến."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader title="Danh sách điểm đến" />
      {REGIONS.map((r) => {
        const list = items.filter((d) => d.regionName === r);
        if (highlight && highlight !== r) return null;
        return (
          <section key={r} className="mb-6">
            <h2 className="mb-2 text-base font-semibold text-[#0F172A]">Miền {r}</h2>
            {list.length === 0 ? (
              <EmptyState message={`Chưa có điểm đến miền ${r}.`} />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {list.map((d) => (
                  <Link key={d.id} to={`/tours?destinationId=${d.id}`}>
                    <Card>
                      <h3 className="mb-1 text-sm font-semibold text-[#0F172A]">{d.name}</h3>
                      <p className="text-sm text-[#64748B]">{d.description}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
