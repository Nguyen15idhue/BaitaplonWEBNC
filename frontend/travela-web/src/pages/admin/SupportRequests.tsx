import { useEffect, useState } from "react";
import { adminListSupports, getSupport, updateSupportStatus } from "../../services/supportApi";
import type { SupportRequest } from "../../types";
import { Loading, LoadingBar, EmptyState, ErrorState, PageHeader, Pagination } from "../../components/common/common";
import { Badge } from "../../components/ui/card";
import { Table } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input, Textarea, Select, Field } from "../../components/ui/fields";
import { Dialog } from "../../components/ui/dialog";
import { useToast, toastForApiError } from "../../components/ui/toast";
import { label, SUPPORT_STATUS_LABEL } from "../../lib/labels";

const STATUSES = ["", "New", "InProgress", "Resolved"];
// Gợi ý chuyển tiếp đúng state machine từ trạng thái hiện tại.
const NEXT: Record<string, string[]> = {
  New: ["InProgress", "Resolved"],
  InProgress: ["Resolved"],
  Resolved: [],
};

function tone(s: string): "success" | "primary" | "muted" {
  if (s === "Resolved") return "success";
  if (s === "InProgress") return "primary";
  return "muted";
}

export function AdminSupports() {
  const { push } = useToast();
  const [items, setItems] = useState<SupportRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<SupportRequest | null>(null);
  const [nextStatus, setNextStatus] = useState("");
  const [note, setNote] = useState("");
  const pageSize = 12;

  async function load(p: number, s: string, q: string) {
    setLoading(true);
    setError("");
    try {
      const res = await adminListSupports(s || undefined, q || undefined, p, pageSize);
      setItems(res.items);
      setTotal(res.total);
      setPage(res.page);
    } catch {
      setError("Không tải được yêu cầu hỗ trợ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, "", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeStatus(s: string) {
    setStatus(s);
    load(1, s, search);
  }

  function submitSearch() {
    load(1, status, search);
  }

  async function openDetail(id: number) {
    try {
      const d = await getSupport(id);
      setDetail(d);
      setNextStatus("");
      setNote(d.adminNote ?? "");
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  async function applyStatus() {
    if (!detail || !nextStatus) {
      push("Chọn trạng thái mới.", "error");
      return;
    }
    try {
      const updated = await updateSupportStatus(detail.id, { status: nextStatus, adminNote: note });
      setDetail(updated);
      push(`Đã chuyển sang ${label(SUPPORT_STATUS_LABEL, nextStatus)}.`, "success");
      load(page, status, search);
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  return (
    <div>
      <PageHeader title="Yêu cầu hỗ trợ" />
      <LoadingBar active={loading && items.length > 0} />
      <div className="mb-4 grid max-w-2xl grid-cols-1 gap-2 md:grid-cols-2">
        <Field label="Trạng thái">
          <Select value={status} onChange={(e) => changeStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {label(SUPPORT_STATUS_LABEL, s)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tìm theo tên, email, chủ đề">
          <div className="flex gap-2">
            <Input
              placeholder="VD: tour, gmail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch();
              }}
            />
            <Button onClick={submitSearch}>Tìm</Button>
          </div>
        </Field>
      </div>

      {loading && items.length === 0 ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : items.length === 0 ? (
        <EmptyState message="Chưa có yêu cầu hỗ trợ." />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <Table headers={["Mã", "Người gửi", "Email", "Chủ đề", "Trạng thái", "Ngày gửi", "Thao tác"]}>
            {items.map((s) => (
              <tr key={s.id} className="border-b border-[#E2E8F0]">
                <td className="px-4 py-2">{s.id}</td>
                <td className="px-4 py-2">{s.name}</td>
                <td className="px-4 py-2">{s.email}</td>
                <td className="px-4 py-2">{s.subject}</td>
                <td className="px-4 py-2">
                  <Badge tone={tone(s.status)}>{label(SUPPORT_STATUS_LABEL, s.status)}</Badge>
                </td>
                <td className="px-4 py-2">{new Date(s.createdAt).toLocaleDateString("vi-VN")}</td>
                <td className="px-4 py-2">
                  <Button variant="outline" onClick={() => openDetail(s.id)}>
                    Xem / Xử lý
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} pageSize={pageSize} total={total} onPage={(p) => load(p, status, search)} />
        </div>
      )}

      <Dialog open={!!detail} title={`Yêu cầu #${detail?.id}`} onClose={() => setDetail(null)}>
        {detail && (
          <div className="flex flex-col gap-3 text-sm">
            <p>
              <strong>{detail.name}</strong> · {detail.email}
              {detail.phone ? ` · ${detail.phone}` : ""}
            </p>
            <p>
              Chủ đề: <strong>{detail.subject}</strong>
            </p>
            <p className="whitespace-pre-line rounded-[6px] bg-[#F8FAFC] p-3">{detail.message}</p>
            <p>
              Trạng thái hiện tại: <Badge tone={tone(detail.status)}>{label(SUPPORT_STATUS_LABEL, detail.status)}</Badge>
            </p>
            {NEXT[detail.status].length > 0 ? (
              <>
                <Field label="Chuyển sang">
                  <Select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                    <option value="">Chọn trạng thái</option>
                    {NEXT[detail.status].map((s) => (
                      <option key={s} value={s}>
                        {label(SUPPORT_STATUS_LABEL, s)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Ghi chú xử lý (≤1000 ký tự)">
                  <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
                </Field>
                <Button onClick={applyStatus}>Lưu xử lý</Button>
              </>
            ) : (
              <p className="text-[#64748B]">Yêu cầu đã xử lý xong.</p>
            )}
            {detail.adminNote && (
              <p className="text-[#64748B]">Ghi chú: {detail.adminNote}</p>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
