import { useEffect, useState } from "react";
import { getTours } from "../services/tourApi";
import { listDestinations } from "../services/destinationApi";
import type { Destination, Tour } from "../types";
import { Loading, EmptyState, ErrorState, PageHeader, Pagination } from "../components/common/common";
import { TourCard } from "../components/common/TourCard";
import { Input, Select } from "../components/ui/fields";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export function TourList() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [total, setTotal] = useState(0);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    listDestinations().then(setDestinations).catch(() => {});
  }, []);

  async function load(p: number) {
    setLoading(true);
    setError("");
    try {
      const res = await getTours({
        search: search || undefined,
        destinationId: destinationId ? Number(destinationId) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort: sort || undefined,
        page: p,
        pageSize,
      });
      setTours(res.items);
      setTotal(res.total);
      setPage(res.page);
    } catch {
      setError("Không tải được danh sách tour.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function apply() {
    load(1);
  }

  function reset() {
    setSearch("");
    setDestinationId("");
    setMinPrice("");
    setMaxPrice("");
    setSort("");
    setPage(1);
    getTours({ page: 1, pageSize })
      .then((res) => {
        setTours(res.items);
        setTotal(res.total);
      })
      .catch(() => setError("Không tải được danh sách tour."));
  }

  return (
    <div>
      <PageHeader title="Danh sách tour" />
      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <Input placeholder="Tìm theo tên tour" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={destinationId} onChange={(e) => setDestinationId(e.target.value)}>
            <option value="">Tất cả điểm đến</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.regionName})
              </option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="">Mới nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="name">Tên A-Z</option>
          </Select>
          <Input
            type="number"
            min={0}
            placeholder="Giá tối thiểu"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <Input
            type="number"
            min={0}
            placeholder="Giá tối đa"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={apply}>Tìm</Button>
            <Button variant="outline" onClick={reset}>
              Xóa lọc
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : tours.length === 0 ? (
        <EmptyState message="Không tìm thấy tour phù hợp." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {tours.map((t) => (
              <TourCard key={t.id} tour={t} />
            ))}
          </div>
          <Pagination page={page} pageSize={pageSize} total={total} onPage={load} />
        </>
      )}
    </div>
  );
}
