import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Pagination as UiPagination } from "../ui/table";

// Chiếm sẵn chiều cao tối thiểu để khi tải trang không làm sụp layout / nhảy footer.
export function Loading({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center gap-2 text-sm text-[#64748B]">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#A79F84] border-t-transparent" />
      {label}
    </div>
  );
}

// Thanh tiến trình mảnh khi tải lại (lọc/tìm/phân trang) — không đổi layout nên không gây nháy.
export function LoadingBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-[#A79F84]/20">
      <div className="h-full w-1/3 animate-pulse rounded-full bg-[#A79F84]" />
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm text-[#64748B]">{message}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return <p className="text-sm text-red-600">{message}</p>;
}

export function PageHeader({ title }: { title: string }) {
  return <h1 className="mb-4 text-xl font-bold text-[#0F172A]">{title}</h1>;
}

export function Pagination(props: React.ComponentProps<typeof UiPagination>) {
  return <UiPagination {...props} />;
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <p className="mb-4 text-sm text-[#0F172A]">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Xác nhận
        </Button>
      </div>
    </Dialog>
  );
}
