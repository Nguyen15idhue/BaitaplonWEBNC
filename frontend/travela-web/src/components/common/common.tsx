import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Pagination as UiPagination } from "../ui/table";

export function Loading() {
  return <p className="text-sm text-[#64748B]">Loading...</p>;
}

export function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-[#64748B]">{message}</p>;
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
