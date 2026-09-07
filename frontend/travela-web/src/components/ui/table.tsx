import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

// Table dùng chung cho mọi trang admin. Scroll ngang trên mobile.
export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[8px] border border-[#E2E8F0] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-left text-[#64748B]">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  function go(p: number) {
    onPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  return (
    <div className="mt-4 flex items-center gap-2 text-sm text-[#64748B]">
      <button
        className={cn("rounded-[4px] border border-[#E2E8F0] px-3 py-1", page <= 1 && "opacity-50")}
        disabled={page <= 1}
        onClick={() => go(page - 1)}
      >
        Trước
      </button>
      <span>
        Trang {page}/{pages} (tổng {total})
      </span>
      <button
        className={cn("rounded-[4px] border border-[#E2E8F0] px-3 py-1", page >= pages && "opacity-50")}
        disabled={page >= pages}
        onClick={() => go(page + 1)}
      >
        Sau
      </button>
    </div>
  );
}
