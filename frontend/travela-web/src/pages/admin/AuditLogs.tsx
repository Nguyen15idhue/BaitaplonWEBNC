import { useEffect, useState } from "react";
import { pageAuditLogs, type AuditLog } from "../../services/auditApi";
import { Loading, EmptyState, ErrorState, PageHeader, Pagination } from "../../components/common/common";
import { Card } from "../../components/ui/card";
import { Table } from "../../components/ui/table";
import { Input, Select } from "../../components/ui/fields";
import { Button } from "../../components/ui/button";

const ENTITY_TYPES = ["", "User", "Tour", "Price", "Booking", "Destination"];

// Trang riêng xem lịch sử hoạt động (F4 theo yêu cầu): lọc entity + phân trang.
export function AuditLogs() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  async function load(p: number, t: string, id: string) {
    setLoading(true);
    setError("");
    try {
      const res = await pageAuditLogs({
        entityType: t || undefined,
        entityId: id ? Number(id) : undefined,
        page: p,
        pageSize,
      });
      setItems(res.items);
      setTotal(res.total);
      setPage(res.page);
    } catch {
      setError("Không tải được audit log.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, "", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function apply() {
    load(1, entityType, entityId);
  }

  function reset() {
    setEntityType("");
    setEntityId("");
    load(1, "", "");
  }

  return (
    <div>
      <PageHeader title="Lịch sử hoạt động" />
      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <Select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
            <option value="">Tất cả loại</option>
            {ENTITY_TYPES.filter(Boolean).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Input
            type="number"
            min={1}
            placeholder="ID đối tượng"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={apply}>Lọc</Button>
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
      ) : items.length === 0 ? (
        <EmptyState message="Chưa có audit log." />
      ) : (
        <>
          <Table headers={["ID", "Hành động", "Đối tượng", "ID", "Cũ → Mới", "Lúc"]}>
            {items.map((a) => (
              <tr key={a.id} className="border-b border-[#E2E8F0]">
                <td className="px-4 py-2">{a.id}</td>
                <td className="px-4 py-2">{a.action}</td>
                <td className="px-4 py-2">{a.entityType}</td>
                <td className="px-4 py-2">{a.entityId}</td>
                <td className="px-4 py-2 text-[#64748B]">
                  {a.oldValue ?? "-"} → {a.newValue ?? "-"}
                </td>
                <td className="px-4 py-2 text-[#64748B]">
                  {new Date(a.createdAt).toLocaleString("vi-VN")}
                </td>
              </tr>
            ))}
          </Table>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPage={(p) => load(p, entityType, entityId)}
          />
        </>
      )}
    </div>
  );
}
