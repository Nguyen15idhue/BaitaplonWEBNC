import { useEffect, useState } from "react";
import { listUsers, updateUserLock, updateUserRole } from "../../services/userApi";
import type { User } from "../../types";
import { useAuth } from "../../lib/auth-context";
import { Loading, EmptyState, ErrorState, PageHeader, Pagination, ConfirmDialog } from "../../components/common/common";
import { Card, Badge } from "../../components/ui/card";
import { Table } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input, Select, Field } from "../../components/ui/fields";
import { useToast, toastForApiError } from "../../components/ui/toast";
import { label, ROLE_LABEL, USER_STATUS_LABEL } from "../../lib/labels";

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
  const [pendingRole, setPendingRole] = useState<{ u: User; role: "Admin" | "Customer" } | null>(null);
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

  async function confirmRole() {
    if (!pendingRole || pendingRole.u.role === pendingRole.role) {
      setPendingRole(null);
      return;
    }
    try {
      await updateUserRole(pendingRole.u.id, pendingRole.role);
      push("Đã đổi quyền.", "success");
      setPendingRole(null);
      load(page, search);
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  return (
    <div>
      <PageHeader title="Quản lý người dùng" />
      <Card className="mb-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Field label="Tìm kiếm">
              <Input
                placeholder="Tên đăng nhập hoặc email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") load(1, search);
                }}
              />
            </Field>
          </div>
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
          <Table headers={["Mã", "Tên đăng nhập", "Email", "Quyền", "Trạng thái", "Thao tác"]}>
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
                      onChange={(e) => setPendingRole({ u, role: e.target.value as "Admin" | "Customer" })}
                    >
                      <option value="Admin">Quản trị (Admin)</option>
                      <option value="Customer">Khách hàng (Customer)</option>
                    </Select>
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={u.status === "Active" ? "success" : "danger"}>{label(USER_STATUS_LABEL, u.status)}</Badge>
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
      <ConfirmDialog
        open={!!pendingRole}
        title="Đổi quyền"
        message={`Đổi ${pendingRole?.u.username} sang ${pendingRole ? label(ROLE_LABEL, pendingRole.role) : ""}?`}
        onConfirm={confirmRole}
        onClose={() => setPendingRole(null)}
      />
    </div>
  );
}
