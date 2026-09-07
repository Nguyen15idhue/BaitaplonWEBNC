import { useEffect, useState } from "react";
import { listUsers, updateUserLock, updateUserRole } from "../../services/userApi";
import type { User } from "../../types";
import { useAuth } from "../../lib/auth-context";
import { Loading, EmptyState, ErrorState, PageHeader, Pagination, ConfirmDialog } from "../../components/common/common";
import { Card, Badge } from "../../components/ui/card";
import { Table } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input, Select } from "../../components/ui/fields";
import { useToast, toastForApiError } from "../../components/ui/toast";

export function AdminUsers() {
  const { user: me } = useAuth();
  const { push } = useToast();
  const [items, setItems] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [locking, setLocking] = useState<User | null>(null);
  const pageSize = 12;

  async function load(p: number, s: string) {
    setLoading(true);
    setError("");
    try {
      const res = await listUsers({ search: s || undefined, page: p, pageSize });
      setItems(res.items);
      setTotal(res.total);
      setPage(res.page);
    } catch {
      setError("Không tải được users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleLock() {
    if (!locking) return;
    const locked = locking.status !== "Locked";
    try {
      await updateUserLock(locking.id, locked);
      push(locked ? "Đã khóa user." : "Đã mở khóa user.", "success");
      setLocking(null);
      load(page, search);
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  async function changeRole(u: User, role: "Admin" | "Customer") {
    if (u.role === role) return;
    try {
      await updateUserRole(u.id, role);
      push("Đã đổi role.", "success");
      load(page, search);
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  return (
    <div>
      <PageHeader title="Quản lý User" />
      <Card className="mb-4">
        <div className="flex gap-2">
          <Input
            placeholder="Tìm username hoặc email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={() => load(1, search)}>Tìm</Button>
        </div>
      </Card>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : items.length === 0 ? (
        <EmptyState message="Không có user." />
      ) : (
        <>
          <Table headers={["ID", "Username", "Email", "Role", "Trạng thái", "Thao tác"]}>
            {items.map((u) => {
              const isMe = me?.id === u.id;
              return (
                <tr key={u.id} className="border-b border-[#E2E8F0]">
                  <td className="px-4 py-2">{u.id}</td>
                  <td className="px-4 py-2">{u.username}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">
                    <Select
                      value={u.role}
                      disabled={isMe}
                      onChange={(e) => changeRole(u, e.target.value as "Admin" | "Customer")}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Customer">Customer</option>
                    </Select>
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={u.status === "Active" ? "success" : "danger"}>{u.status}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Button variant="outline" disabled={isMe} onClick={() => setLocking(u)} title={isMe ? "Không thể tự khóa" : ""}>
                      {u.status === "Locked" ? "Mở khóa" : "Khóa"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </Table>
          <Pagination page={page} pageSize={pageSize} total={total} onPage={(p) => load(p, search)} />
        </>
      )}

      <ConfirmDialog
        open={!!locking}
        title={locking?.status === "Locked" ? "Mở khóa user" : "Khóa user"}
        message={`Xác nhận thao tác với ${locking?.username}?`}
        onConfirm={toggleLock}
        onClose={() => setLocking(null)}
      />
    </div>
  );
}
