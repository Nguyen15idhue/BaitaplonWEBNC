import { useEffect, useState } from "react";
import {
  getTourDetail, adminListTours, createTour, updateTour, deleteTour,
  getTourPrices, createPrice, deletePrice, createImage, deleteImage,
  type TourForm,
} from "../../services/tourApi";import { listDestinations } from "../../services/destinationApi";
import type { Destination, Tour, TourDetail, TourPrice } from "../../types";
import { Loading, EmptyState, ErrorState, PageHeader, Pagination, ConfirmDialog } from "../../components/common/common";
import { Badge } from "../../components/ui/card";
import { Table } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input, Textarea, Select, FieldError } from "../../components/ui/fields";
import { Dialog } from "../../components/ui/dialog";
import { Tabs, TabPanel } from "../../components/ui/tabs";
import { useToast, toastForApiError } from "../../components/ui/toast";
import { formatVND } from "../../lib/format";

const EMPTY_FORM: TourForm = { tourName: "", description: "", destinationId: 0, maxSeats: 20, status: "Draft" };

export function AdminTours() {
  const { push } = useToast();
  const [items, setItems] = useState<Tour[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState<TourForm>(EMPTY_FORM);
  const [fieldError, setFieldError] = useState("");
  const [prices, setPrices] = useState<TourPrice[]>([]);
  const [images, setImages] = useState<TourDetail["images"]>([]);
  const [priceForm, setPriceForm] = useState({ sourceName: "Website", priceValue: "", effectiveDate: "" });
  const [imageForm, setImageForm] = useState({ imageUrl: "", caption: "", sortOrder: "1" });
  const [deleting, setDeleting] = useState<Tour | null>(null);
  const pageSize = 12;

  async function load(p: number) {
    setLoading(true);
    setError("");
    try {
      // Admin xem tất cả trạng thái qua /tours/all (public chỉ Published).
      const res = await adminListTours({ page: p, pageSize });
      setItems(res.items);
      setTotal(res.total);
      setPage(res.page);
    } catch {
      setError("Không tải được tours.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    listDestinations().then(setDestinations).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFieldError("");
    setTab(0);
    setPrices([]);
    setImages([]);
    setDialogOpen(true);
  }

  async function openEdit(t: Tour) {
    setEditingId(t.id);
    setFieldError("");
    setTab(0);
    setDialogOpen(true);
    try {
      // Admin xem được cả Draft/Hidden qua cùng endpoint detail.
      const d = await getTourDetail(t.id);
      setForm({
        tourName: d.tourName,
        description: d.description,
        destinationId: d.destinationId,
        maxSeats: d.maxSeats,
        status: d.status,
      });
      setPrices(d.prices);
      setImages(d.images);
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  function validate(): boolean {
    if (!form.tourName.trim() || form.tourName.trim().length > 200) {
      setFieldError("Tên tour bắt buộc, tối đa 200 ký tự.");
      return false;
    }
    if (!form.destinationId) {
      setFieldError("Chọn điểm đến.");
      return false;
    }
    if (form.maxSeats <= 0) {
      setFieldError("Số chỗ phải lớn hơn 0.");
      return false;
    }
    setFieldError("");
    return true;
  }

  async function saveTour() {
    if (!validate()) return;
    try {
      if (editingId === null) {
        const created = await createTour(form);
        setEditingId(created.id);
        push("Đã tạo tour.", "success");
      } else {
        await updateTour(editingId, form);
        push("Đã lưu tour.", "success");
      }
      load(page);
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  async function addPrice() {
    if (editingId === null) return;
    const value = Number(priceForm.priceValue);
    if (!priceForm.sourceName.trim() || !(value > 0) || !priceForm.effectiveDate) {
      push("Nhập nguồn, giá > 0 và ngày hiệu lực.", "error");
      return;
    }
    try {
      await createPrice(editingId, {
        sourceName: priceForm.sourceName.trim(),
        priceValue: value,
        effectiveDate: new Date(priceForm.effectiveDate).toISOString(),
      });
      push("Đã thêm giá.", "success");
      setPriceForm({ sourceName: "Website", priceValue: "", effectiveDate: "" });
      setPrices(await getTourPrices(editingId));
      load(page);
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  async function removePrice(id: number) {
    try {
      await deletePrice(id);
      push("Đã xóa giá.", "success");
      if (editingId !== null) setPrices(await getTourPrices(editingId));
      load(page);
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  async function addImage() {
    if (editingId === null) return;
    if (!imageForm.imageUrl.trim()) {
      push("Nhập URL ảnh.", "error");
      return;
    }
    try {
      await createImage(editingId, {
        imageUrl: imageForm.imageUrl.trim(),
        caption: imageForm.caption,
        sortOrder: Number(imageForm.sortOrder) || 1,
      });
      push("Đã thêm ảnh.", "success");
      setImageForm({ imageUrl: "", caption: "", sortOrder: "1" });
      setImages((await getTourDetail(editingId)).images);
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  async function removeImage(id: number) {
    try {
      await deleteImage(id);
      push("Đã xóa ảnh.", "success");
      if (editingId !== null) {
        setImages((await getTourDetail(editingId)).images);
      }
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      const res = await deleteTour(deleting.id);
      push(res.message, "success");
      setDeleting(null);
      load(page);
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  return (
    <div>
      <PageHeader title="Quản lý Tour" />
      <div className="mb-4">
        <Button onClick={openCreate}>Thêm tour</Button>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : items.length === 0 ? (
        <EmptyState message="Chưa có tour." />
      ) : (
        <>
          <Table headers={["ID", "Tên", "Giá từ", "Trạng thái", "Thao tác"]}>
            {items.map((t) => (
              <tr key={t.id} className="border-b border-[#E2E8F0]">
                <td className="px-4 py-2">{t.id}</td>
                <td className="px-4 py-2">{t.tourName}</td>
                <td className="px-4 py-2">{formatVND(t.priceFrom)}</td>
                <td className="px-4 py-2">
                  <Badge tone={t.status === "Published" ? "success" : "muted"}>{t.status}</Badge>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => openEdit(t)}>
                      Sửa
                    </Button>
                    <Button variant="danger" onClick={() => setDeleting(t)}>
                      Xóa
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={Math.max(total, items.length)}
            onPage={load}
          />
        </>
      )}

      <Dialog open={dialogOpen} title={editingId === null ? "Thêm tour" : `Sửa tour #${editingId}`} onClose={() => setDialogOpen(false)}>
        <Tabs tabs={["Thông tin", "Giá", "Ảnh"]} active={tab} onChange={setTab} />
        {tab === 0 && (
          <TabPanel>
            <div className="flex flex-col gap-3">
              <Input placeholder="Tên tour (max 200)" value={form.tourName} onChange={(e) => setForm({ ...form, tourName: e.target.value })} />
              <Textarea placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Select value={form.destinationId} onChange={(e) => setForm({ ...form, destinationId: Number(e.target.value) })}>
                <option value={0}>Chọn điểm đến</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.regionName})
                  </option>
                ))}
              </Select>
              <Input type="number" min={1} placeholder="Số chỗ" value={form.maxSeats} onChange={(e) => setForm({ ...form, maxSeats: Number(e.target.value) })} />
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Hidden">Hidden</option>
              </Select>
              <FieldError message={fieldError} />
              <Button onClick={saveTour}>Lưu tour</Button>
            </div>
          </TabPanel>
        )}
        {tab === 1 && (
          <TabPanel>
            {editingId === null ? (
              <EmptyState message="Lưu tour trước rồi thêm giá." />
            ) : (
              <div className="flex flex-col gap-2">
                {prices.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1">
                      {p.sourceName} · {formatVND(p.priceValue)}
                    </span>
                    <Button variant="danger" onClick={() => removePrice(p.id)}>
                      Xóa
                    </Button>
                  </div>
                ))}
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                  <Input placeholder="Nguồn" value={priceForm.sourceName} onChange={(e) => setPriceForm({ ...priceForm, sourceName: e.target.value })} />
                  <Input type="number" min={1} placeholder="Giá > 0" value={priceForm.priceValue} onChange={(e) => setPriceForm({ ...priceForm, priceValue: e.target.value })} />
                  <Input type="date" value={priceForm.effectiveDate} onChange={(e) => setPriceForm({ ...priceForm, effectiveDate: e.target.value })} />
                </div>
                <Button onClick={addPrice}>Thêm giá</Button>
              </div>
            )}
          </TabPanel>
        )}
        {tab === 2 && (
          <TabPanel>
            {editingId === null ? (
              <EmptyState message="Lưu tour trước rồi thêm ảnh." />
            ) : (
              <div className="flex flex-col gap-2">
                {images.map((img) => (
                  <div key={img.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{img.imageUrl}</span>
                    <Button variant="danger" onClick={() => removeImage(img.id)}>
                      Xóa
                    </Button>
                  </div>
                ))}
                <Input placeholder="URL ảnh http/https (≤500 ký tự)" value={imageForm.imageUrl} onChange={(e) => setImageForm({ ...imageForm, imageUrl: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Chú thích" value={imageForm.caption} onChange={(e) => setImageForm({ ...imageForm, caption: e.target.value })} />
                  <Input type="number" min={1} placeholder="Thứ tự" value={imageForm.sortOrder} onChange={(e) => setImageForm({ ...imageForm, sortOrder: e.target.value })} />
                </div>
                <Button onClick={addImage}>Thêm ảnh</Button>
              </div>
            )}
          </TabPanel>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        title="Xóa tour"
        message={`Xóa "${deleting?.tourName}"? Tour có booking sẽ chuyển Hidden thay vì xóa cứng.`}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
