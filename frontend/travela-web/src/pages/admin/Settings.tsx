import { useRef, useState } from "react";
import { useSliderImages, useRegionImages, type RegionName } from "../../lib/image-store";
import { Button } from "../../components/ui/button";
import { Trash2, Plus, RotateCcw, Upload } from "lucide-react";

function fileToUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export function AdminSettings() {
  const { images: sliderImages, update: updateSlider } = useSliderImages();
  const { regions, updateItem, addItem, removeItem, reset } = useRegionImages();
  const [newSliderUrl, setNewSliderUrl] = useState("");
  const [newRegionName, setNewRegionName] = useState("");
  const [newRegionUrl, setNewRegionUrl] = useState("");
  const [activeRegion, setActiveRegion] = useState<RegionName>("Miền Bắc");

  const sliderFileRef = useRef<HTMLInputElement>(null);
  const regionFileRef = useRef<HTMLInputElement>(null);

  async function handleSliderUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    const urls = await Promise.all(Array.from(files).map(fileToUrl));
    updateSlider([...sliderImages, ...urls]);
    e.target.value = "";
  }

  async function handleRegionUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    const url = await fileToUrl(files[0]);
    setNewRegionUrl(url);
    e.target.value = "";
  }

  async function handleEditUpload(e: React.ChangeEvent<HTMLInputElement>, region: RegionName, index: number) {
    const files = e.target.files;
    if (!files?.length) return;
    const url = await fileToUrl(files[0]);
    updateItem(region, index, url);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-[#535041]">Quản lý hình ảnh</h1>

      {/* ── Slider ── */}
      <section className="rounded-lg border border-[#e0dbd0] bg-white p-6">
        <h2 className="mb-4 text-lg font-bold text-[#535041]">Ảnh Slider (Trang chủ)</h2>
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {sliderImages.map((src, i) => (
            <div key={i} className="group relative overflow-hidden rounded-lg">
              <img src={src} alt="" className="h-32 w-full object-cover" />
              <button
                onClick={() => updateSlider(sliderImages.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            placeholder="Dán URL ảnh mới..."
            value={newSliderUrl}
            onChange={(e) => setNewSliderUrl(e.target.value)}
            className="flex-1 rounded-full border border-[#e0dbd0] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A79F84]"
          />
          <Button
            onClick={() => {
              if (!newSliderUrl.trim()) return;
              updateSlider([...sliderImages, newSliderUrl.trim()]);
              setNewSliderUrl("");
            }}
            className="rounded-full bg-[#A79F84] text-white hover:bg-[#A79F84]/90"
          >
            <Plus size={16} /> Thêm URL
          </Button>
          <input
            ref={sliderFileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleSliderUpload}
          />
          <Button
            onClick={() => sliderFileRef.current?.click()}
            variant="outline"
            className="gap-1 rounded-full border-[#A79F84] text-[#A79F84] hover:bg-[#A79F84]/10"
          >
            <Upload size={16} /> Tải từ máy
          </Button>
        </div>
      </section>

      {/* ── Region images ── */}
      <section className="rounded-lg border border-[#e0dbd0] bg-white p-6">
        <h2 className="mb-4 text-lg font-bold text-[#535041]">Ảnh Vùng miền</h2>

        <div className="mb-4 flex gap-4 border-b border-[#e0dbd0]">
          {(Object.keys(regions) as RegionName[]).map((r) => (
            <button
              key={r}
              onClick={() => setActiveRegion(r)}
              className={`pb-2 text-sm font-bold transition-colors ${
                activeRegion === r ? "border-b-2 border-[#535041] text-[#535041]" : "text-[#535041]/50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {regions[activeRegion].map((item, i) => (
            <div key={i} className="group relative overflow-hidden rounded-lg">
              <img src={item.image} alt={item.name} className="h-36 w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <span className="absolute bottom-2 left-2 text-xs font-semibold text-white">{item.name}</span>

              <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <label className="cursor-pointer rounded bg-white/80 px-1.5 py-0.5 text-xs text-[#535041] hover:bg-white">
                  Sửa
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleEditUpload(e, activeRegion, i)}
                  />
                </label>
                <button
                  onClick={() => removeItem(activeRegion, i)}
                  className="rounded bg-red-600 p-0.5 text-white hover:bg-red-700"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            placeholder="Tên tỉnh/thành..."
            value={newRegionName}
            onChange={(e) => setNewRegionName(e.target.value)}
            className="w-full rounded-full border border-[#e0dbd0] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A79F84] sm:w-40"
          />
          <input
            placeholder="URL ảnh..."
            value={newRegionUrl}
            onChange={(e) => setNewRegionUrl(e.target.value)}
            className="flex-1 rounded-full border border-[#e0dbd0] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A79F84]"
          />
          <Button
            onClick={() => {
              if (!newRegionName.trim() || !newRegionUrl.trim()) return;
              addItem(activeRegion, newRegionName.trim(), newRegionUrl.trim());
              setNewRegionName("");
              setNewRegionUrl("");
            }}
            className="rounded-full bg-[#A79F84] text-white hover:bg-[#A79F84]/90"
          >
            <Plus size={16} /> Thêm URL
          </Button>
          <input
            ref={regionFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleRegionUpload}
          />
          <Button
            onClick={() => regionFileRef.current?.click()}
            variant="outline"
            className="gap-1 rounded-full border-[#A79F84] text-[#A79F84] hover:bg-[#A79F84]/10"
          >
            <Upload size={16} /> Tải từ máy
          </Button>
        </div>

        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => {
              if (confirm("Khôi phục ảnh mặc định?")) reset();
            }}
            className="gap-1 text-[#535041]"
          >
            <RotateCcw size={14} /> Khôi phục mặc định
          </Button>
        </div>
      </section>
    </div>
  );
}
