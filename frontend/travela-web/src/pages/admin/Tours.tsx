import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  getTourDetail, adminListTours, createTour, updateTour, deleteTour,
  getTourPrices, createPrice, updatePrice, deletePrice, createImage, uploadImage, deleteImage,
  type TourForm,
} from "../../services/tourApi";
import { listDestinations } from "../../services/destinationApi";
import type { Tour, TourDetail, TourPrice, ItineraryDay, Destination } from "../../types";
import { Loading, LoadingBar, EmptyState, ErrorState, PageHeader, Pagination, ConfirmDialog } from "../../components/common/common";
import { Badge } from "../../components/ui/card";
import { Table } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input, Textarea, Select, Field, FieldError } from "../../components/ui/fields";
import { Dialog } from "../../components/ui/dialog";
import { Tabs, TabPanel } from "../../components/ui/tabs";
import { useToast, toastForApiError } from "../../components/ui/toast";
import { formatVND } from "../../lib/format";
import { label, TOUR_STATUS_LABEL } from "../../lib/labels";

const EMPTY_FORM: TourForm = {
  tourName: "",
  description: "",
  destinationId: 0,
  maxSeats: 20,
  status: "Draft",
  departureDate: "",
  departureLocation: "",
  duration: "",
  included: "",
  excluded: "",
  paymentTerms: "",
  cancellationPolicy: "",
  applicationConditions: "",
};

export function AdminTours() {
  const { push } = useToast();
  const [items, setItems] = useState<Tour[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState<TourForm>(EMPTY_FORM);
  const [fieldError, setFieldError] = useState("");
  const [prices, setPrices] = useState<TourPrice[]>([]);
  const [images, setImages] = useState<TourDetail["images"]>([]);
  const [itineraryDaysList, setItineraryDaysList] = useState<ItineraryDay[]>([]);
  const [priceForm, setPriceForm] = useState({ sourceName: "Người lớn", priceValue: "" });
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [imageForm, setImageForm] = useState({ imageUrl: "", caption: "", sortOrder: "1" });
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<Tour | null>(null);
  const [saving, setSaving] = useState(false);
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
    // Điểm đến cho select khi tạo/sửa tour (BE bắt buộc destinationId hợp lệ).
    listDestinations()
      .then(setDestinations)
      .catch(() => setDestinations([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFieldError("");
    setTab(0);
    setPrices([]);
    setImages([]);
    setItineraryDaysList([]);
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
        departureDate: (d.departureDate ?? "").slice(0, 10),
        departureLocation: d.departureLocation ?? "",
        duration: d.duration ?? "",
        included: d.included ?? "",
        excluded: d.excluded ?? "",
        paymentTerms: d.paymentTerms ?? "",
        cancellationPolicy: d.cancellationPolicy ?? "",
        applicationConditions: d.applicationConditions ?? "",
      });
      // Parse itineraryDays JSON nếu có
      if (d.itineraryDays) {
        try { setItineraryDaysList(JSON.parse(d.itineraryDays)); } catch { setItineraryDaysList([]); }
      } else {
        setItineraryDaysList([]);
      }
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
    if (form.maxSeats <= 0) {
      setFieldError("Số chỗ phải lớn hơn 0.");
      return false;
    }
    if (!form.destinationId || form.destinationId <= 0) {
      setFieldError("Vui lòng chọn điểm đến.");
      return false;
    }
    setFieldError("");
    return true;
  }

  async function saveTour() {
    if (!validate()) return;
    setSaving(true);
    // Validate độ dài nội dung trùng BE (dài ≤10000).
    const longs: [string, string | null | undefined][] = [
      ["Bao gồm", form.included], ["Không bao gồm", form.excluded],
    ];
    for (const [name, v] of longs)
      if ((v?.trim().length ?? 0) > 10000) {
        setFieldError(`${name} tối đa 10000 ký tự.`);
        return;
      }
    const opt = (v: string | null | undefined) => (v?.trim() ? v.trim() : null);
    // date-only -> UTC, rỗng -> null.
    const body: TourForm = {
      ...form,
      departureDate: form.departureDate ? new Date(`${form.departureDate}T00:00:00Z`).toISOString() : null,
      departureLocation: opt(form.departureLocation),
      duration: opt(form.duration),
      included: opt(form.included),
      excluded: opt(form.excluded),
      paymentTerms: opt(form.paymentTerms),
      cancellationPolicy: opt(form.cancellationPolicy),
      applicationConditions: opt(form.applicationConditions),
      itineraryDays: itineraryDaysList.length > 0 ? JSON.stringify(itineraryDaysList) : null,
    };
    try {
      if (editingId === null) {
        const created = await createTour(body);
        setEditingId(created.id);
        push("Đã tạo tour.", "success");
      } else {
        await updateTour(editingId, body);
        push("Đã lưu tour.", "success");
      }
      load(page);
    } catch (err) {
      toastForApiError(push, err);
    } finally {
      setSaving(false);
    }
  }

  async function addPrice() {
    if (editingId === null) return;
    const raw = priceForm.priceValue.replace(/\./g, "").replace(/,/g, "");
    const value = Number(raw);
    if (!priceForm.sourceName.trim() || !(value > 0)) {
      push("Nhập nguồn và giá > 0.", "error");
      return;
    }
    try {
      const effectiveDate = new Date().toISOString();
      if (editingPriceId === null) {
        await createPrice(editingId, {
          sourceName: priceForm.sourceName.trim(),
          priceValue: value,
          effectiveDate,
        });
        push("Đã thêm giá.", "success");
      } else {
        // H03: sửa giá qua PUT /prices/{id}.
        await updatePrice(editingPriceId, {
          sourceName: priceForm.sourceName.trim(),
          priceValue: value,
          effectiveDate,
        });
        push("Đã cập nhật giá.", "success");
        setEditingPriceId(null);
      }
      setPriceForm({ sourceName: "Người lớn", priceValue: "" });
      setPrices(await getTourPrices(editingId));
      load(page);
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  function startEditPrice(p: TourPrice) {
    setEditingPriceId(p.id);
    setPriceForm({
      sourceName: p.sourceName,
      priceValue: String(p.priceValue),
    });
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

  async function uploadFile(f: File | undefined) {
    if (editingId === null || !f) return;
    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
      push("Chỉ chấp nhận file jpg, png, webp, gif.", "error");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      push("File tối đa 5MB.", "error");
      return;
    }
    setUploading(true);
    try {
      await uploadImage(editingId, f, imageForm.caption, Number(imageForm.sortOrder) || 1);
      push("Đã tải ảnh lên.", "success");
      setImages((await getTourDetail(editingId)).images);
      load(page);
    } catch (err) {
      toastForApiError(push, err);
    } finally {
      setUploading(false);
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
      <LoadingBar active={loading && items.length > 0} />
      <div className="mb-4">
        <Button onClick={openCreate}>Thêm tour</Button>
      </div>

      {loading && items.length === 0 ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : items.length === 0 ? (
        <EmptyState message="Chưa có tour." />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <Table headers={["ID", "Tên", "Giá từ", "Trạng thái", "Thao tác"]}>
            {items.map((t) => (
              <tr key={t.id} className="border-b border-[#E2E8F0]">
                <td className="px-4 py-2">{t.id}</td>
                <td className="px-4 py-2">{t.tourName}</td>
                <td className="px-4 py-2">{formatVND(t.priceFrom)}</td>
                <td className="px-4 py-2">
                  <Badge tone={t.status === "Published" ? "success" : "muted"}>{label(TOUR_STATUS_LABEL, t.status)}</Badge>
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
            total={total}
            onPage={load}
          />
        </div>
      )}

      <Dialog open={dialogOpen} title={editingId === null ? "Thêm tour" : `Sửa tour #${editingId}`} onClose={() => setDialogOpen(false)} dismissible={false}>
        <Tabs tabs={["Thông tin", "Nội dung", "Giá", "Ảnh"]} active={tab} onChange={setTab} />
        {tab === 0 && (
          <TabPanel>
            <div className="flex flex-col gap-3">
              <Field label="Tên tour (tối đa 200 ký tự)">
                <Input placeholder="VD: Vịnh Hạ Long 2N1Đ" value={form.tourName} onChange={(e) => setForm({ ...form, tourName: e.target.value })} />
              </Field>
              <Field label="Mã tour / Mô tả">
                <Textarea placeholder="VD: NDSGN612-061-210925XE-V — Giới thiệu tour" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
              <Field label="Điểm đến">
                <Select value={form.destinationId || ""} onChange={(e) => setForm({ ...form, destinationId: Number(e.target.value) })}>
                  <option value="">-- Chọn điểm đến --</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.regionName})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Số chỗ tối đa">
                <Input type="number" min={1} placeholder="VD: 30" value={form.maxSeats} onChange={(e) => setForm({ ...form, maxSeats: Number(e.target.value) })} />
              </Field>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="Ngày khởi hành">
                  <Input type="date" value={form.departureDate ?? ""} onChange={(e) => setForm({ ...form, departureDate: e.target.value || null })} />
                </Field>
                <Field label="Địa điểm xuất phát">
                  <Input placeholder="VD: TP. Hồ Chí Minh" value={form.departureLocation ?? ""} onChange={(e) => setForm({ ...form, departureLocation: e.target.value || null })} />
                </Field>
                <Field label="Thời gian du lịch">
                  <Input placeholder="VD: 5N4D" value={form.duration ?? ""} onChange={(e) => setForm({ ...form, duration: e.target.value || null })} />
                </Field>
              </div>
              <Field label="Trạng thái">
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="Draft">Nháp (Draft)</option>
                  <option value="Published">Đang bán (Published)</option>
                  <option value="Hidden">Tạm ẩn (Hidden)</option>
                </Select>
              </Field>
              <FieldError message={fieldError} />
              <Button onClick={saveTour} loading={saving}>Lưu tour</Button>
            </div>
          </TabPanel>
        )}
        {tab === 1 && (
          <TabPanel>
            <div className="flex flex-col gap-3">

              {/* ---- Lịch trình chi tiết (từng ngày) ---- */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#535041]">Lịch trình chi tiết</span>
                  <Button
                    variant="outline"
                    onClick={() => setItineraryDaysList([...itineraryDaysList, { day: itineraryDaysList.length + 1, title: "", meals: "", content: "" }])}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Thêm ngày
                  </Button>
                </div>
                {itineraryDaysList.length === 0 && (
                  <p className="text-xs text-[#535041]/50">Chưa có ngày nào. Nhấn "Thêm ngày" để bắt đầu.</p>
                )}
                {itineraryDaysList.map((day, idx) => (
                  <div key={idx} className="rounded-lg border border-[#A79F84]/30 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-[#535041]">Ngày {day.day}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = itineraryDaysList.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 }));
                          setItineraryDaysList(next);
                        }}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <Input
                        placeholder="Tên ngày / tiêu đề"
                        value={day.title}
                        onChange={(e) => {
                          const next = [...itineraryDaysList];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setItineraryDaysList(next);
                        }}
                      />
                      <Input
                        placeholder="Bữa ăn (VD: 03 bữa ăn sáng, trưa, chiều)"
                        value={day.meals}
                        onChange={(e) => {
                          const next = [...itineraryDaysList];
                          next[idx] = { ...next[idx], meals: e.target.value };
                          setItineraryDaysList(next);
                        }}
                      />
                    </div>
                    <Textarea
                      rows={3}
                      placeholder="Nội dung chi tiết ngày..."
                      value={day.content}
                      onChange={(e) => {
                        const next = [...itineraryDaysList];
                        next[idx] = { ...next[idx], content: e.target.value };
                        setItineraryDaysList(next);
                      }}
                    />
                  </div>
                ))}
              </div>
              <Field label="Bao gồm">
                <Textarea rows={3} placeholder="VD: Xe, khách sạn, ăn uống, vé, bảo hiểm..." value={form.included ?? ""} onChange={(e) => setForm({ ...form, included: e.target.value || null })} />
              </Field>
              <Field label="Không bao gồm">
                <Textarea rows={3} placeholder="VD: Đồ uống, chi phí cá nhân, tip..." value={form.excluded ?? ""} onChange={(e) => setForm({ ...form, excluded: e.target.value || null })} />
              </Field>
              <Field label="Điều kiện thanh toán">
                <Textarea rows={2} placeholder="VD: Đặt cọc 30% khi đăng ký, thanh toán còn lại trước ngày khởi hành 3 ngày" value={form.paymentTerms ?? ""} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value || null })} />
              </Field>
              <Field label="Lưu ý chuyển hoặc hủy tour">
                <Textarea rows={2} placeholder="VD: Hủy trước 7 ngày: hoàn 100%; trước 3 ngày: mất cọc 30%..." value={form.cancellationPolicy ?? ""} onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value || null })} />
              </Field>
              <Field label="Điều kiện áp dụng">
                <Textarea rows={2} placeholder="VD: Trẻ em dưới 5 tuổi miễn phí; từ 12 tuổi tính giá người lớn" value={form.applicationConditions ?? ""} onChange={(e) => setForm({ ...form, applicationConditions: e.target.value || null })} />
              </Field>
              <FieldError message={fieldError} />
              <Button onClick={saveTour} loading={saving}>Lưu tour</Button>
            </div>
          </TabPanel>
        )}
        {tab === 2 && (
          <TabPanel>
            {editingId === null ? (
              <EmptyState message="Lưu tour trước rồi thêm giá." />
            ) : (
              <div className="flex flex-col gap-2">
                {prices.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1">
                      <span className="font-medium">{p.sourceName}</span> · {formatVND(p.priceValue)}
                    </span>
                    <Button variant="outline" onClick={() => startEditPrice(p)}>
                      Sửa
                    </Button>
                    <Button variant="danger" onClick={() => removePrice(p.id)}>
                      Xóa
                    </Button>
                  </div>
                ))}
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <Select value={priceForm.sourceName} onChange={(e) => setPriceForm({ ...priceForm, sourceName: e.target.value })}>
                    <option value="Người lớn">Người lớn (Từ 12 tuổi trở lên)</option>
                    <option value="Trẻ em">Trẻ em (Dưới 12 tuổi)</option>
                    <option value="Phụ thu">Phụ thu (Phụ thu phòng đơn)</option>
                  </Select>
                  <Input placeholder="Giá (VD: 3590000)" value={priceForm.priceValue} onChange={(e) => setPriceForm({ ...priceForm, priceValue: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addPrice}>{editingPriceId === null ? "Thêm giá" : "Lưu giá"}</Button>
                  {editingPriceId !== null && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingPriceId(null);
                        setPriceForm({ sourceName: "Người lớn", priceValue: "" });
                      }}
                    >
                      Hủy sửa
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabPanel>
        )}
        {tab === 3 && (
          <TabPanel>
            {editingId === null ? (
              <EmptyState message="Lưu tour trước rồi thêm ảnh." />
            ) : (
              <div className="flex flex-col gap-2">
                {images.map((img) => (
                  <div key={img.id} className="flex items-center gap-2 text-sm">
                    <img
                      src={img.imageUrl}
                      alt={img.caption || ""}
                      className="h-12 w-12 flex-shrink-0 rounded border border-[#e0dbd0] object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <span className="flex-1 truncate">{img.imageUrl}</span>
                    <Button variant="danger" onClick={() => removeImage(img.id)}>
                      Xóa
                    </Button>
                  </div>
                ))}
                <div className="rounded-[6px] border border-dashed border-[#CBD5E1] p-3">
                  <p className="mb-2 text-sm font-medium">Tải ảnh từ máy (jpg/png/webp/gif, ≤5MB)</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={uploading}
                      className="block w-full text-sm text-[#535041] file:mr-3 file:rounded-[4px] file:border-0 file:bg-[#A79F84] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-[#968e76]"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        void uploadFile(f);
                      }}
                    />
                    {uploading && <span className="text-sm text-[#64748B]">Đang tải...</span>}
                  </div>
                  <p className="mt-1 text-xs text-[#64748B]">Dùng chung chú thích + thứ tự bên dưới.</p>
                </div>
                <p className="text-sm font-medium">hoặc thêm bằng link URL</p>
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
