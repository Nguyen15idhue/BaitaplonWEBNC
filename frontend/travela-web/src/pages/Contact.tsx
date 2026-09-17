import { useState } from "react";
import { Phone, Mail } from "lucide-react";
import { useToast } from "../components/ui/toast";
import { Button } from "../components/ui/button";

export function Contact() {
  const { push } = useToast();
  const [form, setForm] = useState({ name: "", phone: "", address: "", email: "", content: "" });
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.content.trim()) {
      push("Vui lòng nhập họ tên và nội dung.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      push("Đã gửi thông tin liên hệ.", "success");
      setForm({ name: "", phone: "", address: "", email: "", content: "" });
    } catch {
      push("Gửi thất bại, thử lại sau.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Hero */}
      <div className="relative h-64 w-full overflow-hidden md:h-80">
        <img
          src="https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1400&h=400&fit=crop"
          alt="Ruộng bậc thang"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
        {/* Thông tin liên hệ */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:gap-8">
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-[#535041]" />
            <span className="text-sm text-[#535041]">1900 7356</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-[#535041]" />
            <span className="text-sm text-[#535041]">Travela@gmail.com</span>
          </div>
        </div>

        {/* Form liên hệ */}
        <h2 className="mb-4 text-xl font-bold text-[#535041]">Liên hệ với chúng tôi</h2>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <input
              placeholder="Họ và tên"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-full border border-[#e0dbd0] bg-white px-4 py-3 text-sm text-[#535041] placeholder:text-[#8a8576] focus:outline-none focus:ring-2 focus:ring-[#A79F84]"
            />
            <input
              placeholder="Số điện thoại"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-full border border-[#e0dbd0] bg-white px-4 py-3 text-sm text-[#535041] placeholder:text-[#8a8576] focus:outline-none focus:ring-2 focus:ring-[#A79F84]"
            />
            <input
              placeholder="Địa chỉ"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="rounded-full border border-[#e0dbd0] bg-white px-4 py-3 text-sm text-[#535041] placeholder:text-[#8a8576] focus:outline-none focus:ring-2 focus:ring-[#A79F84]"
            />
            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-full border border-[#e0dbd0] bg-white px-4 py-3 text-sm text-[#535041] placeholder:text-[#8a8576] focus:outline-none focus:ring-2 focus:ring-[#A79F84]"
            />
          </div>
          <div className="flex flex-col gap-3">
            <textarea
              placeholder="Nội dung"
              rows={5}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="rounded-[8px] border border-[#e0dbd0] bg-white px-4 py-3 text-sm text-[#535041] placeholder:text-[#8a8576] focus:outline-none focus:ring-2 focus:ring-[#A79F84]"
            />
            <Button type="submit" loading={submitting} className="rounded-full">
              Gửi thông tin
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
