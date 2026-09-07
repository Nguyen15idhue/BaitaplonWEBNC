import { useEffect, useState } from "react";
import {
  listDestinations, createDestination, updateDestination, deleteDestination,
} from "../../services/destinationApi";
import type { Destination } from "../../types";
import { Loading, EmptyState, ErrorState, PageHeader, ConfirmDialog } from "../../components/common/common";
import { Table } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input, Textarea, Select, FieldError } from "../../components/ui/fields";
import { Dialog } from "../../components/ui/dialog";
import { useToast, toastForApiError } from "../../components/ui/toast";

const REGIONS = ["Bắc", "Trung", "Nam"];

export function AdminDestinations() {
  const { push } = useToast();
  const [items, setItems] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", regionName: "Bắc", description: "" });
  const [fieldError, setFieldError] = useState("");
  const [deleting, setDeleting] = useState<Destination | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setItems(await listDestinations());
    } catch {
      setError("Không tải được điểm đến.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ name: "", regionName: "Bắc", description: "" });
    setFieldError("");
    setOpen(true);
  }

  function openEdit(d: Destination) {
    setEditingId(d.id);
    setForm({ name: d.name, regionName: d.regionName, description: d.description });
    setFieldError("");
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      setFieldError("Tên điểm đến bắt buộc.");
      return;
    }
    try {
      if (editingId === null) await createDestination(form);
      else await updateDestination(editingId, form);
      push("Đã lưu điểm đến.", "success");
      setOpen(false);
      load();
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteDestination(deleting.id);
      push("Đã xóa điểm đến.", "success");
      setDeleting(null);
      load();
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  return (
    <div>
      <PageHeader title="Quản lý Destination" />
      <div className="mb-4">
        <Button onClick={openCreate}>Thêm điểm đến</Button>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : items.length === 0 ? (
        <EmptyState message="Chưa có điểm đến." />
      ) : (
        <Table headers={["ID", "Tên", "Vùng", "Thao tác"]}>
          {items.map((d) => (
            <tr key={d.id} className="border-b border-[#E2E8F0]">
              <td className="px-4 py-2">{d.id}</td>
              <td className="px-4 py-2">{d.name}</td>
              <td className="px-4 py-2">{d.regionName}</td>
              <td className="px-4 py-2">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openEdit(d)}>
                    Sửa
                  </Button>
                  <Button variant="danger" onClick={() => setDeleting(d)}>
                    Xóa
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Dialog open={open} title={editingId === null ? "Thêm điểm đến" : `Sửa #${editingId}`} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-3">
          <Input placeholder="Tên điểm đến" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select value={form.regionName} onChange={(e) => setForm({ ...form, regionName: e.target.value })}>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          <Textarea placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <FieldError message={fieldError} />
          <Button onClick={save}>Lưu</Button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        title="Xóa điểm đến"
        message={`Xóa "${deleting?.name}"? Điểm đến còn tour sẽ bị chặn.`}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
