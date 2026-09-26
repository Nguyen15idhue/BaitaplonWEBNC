import { useEffect, useState } from "react";
import { listUsers, createUser, updateUser, deleteUser, updateUserLock } from "../../services/userApi";
import type { User } from "../../types";
import { useAuth } from "../../lib/auth-context";
import { Loading, LoadingBar, EmptyState, ErrorState, PageHeader, Pagination, ConfirmDialog } from "../../components/common/common";
import { Card, Badge } from "../../components/ui/card";
import { Table } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input, Select, Field, FieldError } from "../../components/ui/fields";
import { Dialog } from "../../components/ui/dialog";
import { useToast, toastForApiError } from "../../components/ui/toast";
import { label, ROLE_LABEL, USER_STATUS_LABEL } from "../../lib/labels";

type Form = {
  username: string;
  email: string;
  password: string;
  newPassword: string;
  role: "Admin" | "Customer";
  status: "Active" | "Locked";
};

const EMPTY_FORM: Form = {
  username: "",
  email: "",
  password: "",
  newPassword: "",
  role: "Customer",
  status: "Active",
};

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,100}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AdminUsers() {
  const { user: me } = useAuth();
  const { push } = useToast();
  const [items, setItems] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [locking, setLocking] = useState<User | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [fieldError, setFieldError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<User | null>(null);

  const pageSize = 12;

  async function load(p: number, s: string, r = role, st = status) {
    setLoading(true);
    setError("");
    try {
      const res = await listUsers({
        search: s || undefined, role: r || undefined, status: st || undefined,
        page: p, pageSize,
      });
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

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFieldError("");
    setDialogOpen(true);
  }

  function openEdit(u: User) {
    setEditingId(u.id);
    setForm({
      username: u.username,
      email: u.email,
      password: "",
      newPassword: "",
      role: u.role,
      status: u.status === "Locked" ? "Locked" : "Active",
    });
    setFieldError("");
    setDialogOpen(true);
  }

  function validate(): boolean {
    if (editingId === null) {
      if (!USERNAME_RE.test(form.username.trim())) {
        setFieldError("Tên đăng nhập 3-100 ký tự, chỉ gồm chữ/số và . _ -");
        return false;
      }
      if (!form.password || form.password.length < 8 || form.password.length > 72) {
        setFieldError("Mật khẩu 8-72 ký tự.");
        return false;
      }
    } else if (form.newPassword && (form.newPassword.length < 8 || form.newPassword.length > 72)) {
      setFieldError("Mật khẩu mới 8-72 ký tự (để trống nếu không đổi).");
      return false;
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setFieldError("Email chưa đúng định dạng.");
      return false;
    }
    setFieldError("");
    return true;
  }

  async function save() {
    if (!validate()) return;
    if (editingId === me?.id && (form.role !== "Admin" || form.status !== "Active")) {
      setFieldError("Không thể tự hạ quyền hoặc tự khóa chính mình.");
      return;
    }
    setSaving(true);
    try {
      if (editingId === null) {
        await createUser({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          status: form.status,
        });
        push("Đã thêm người dùng.", "success");
      } else {
        await updateUser(editingId, {
          email: form.email.trim(),
          role: form.role,
          status: form.status,
          newPassword: form.newPassword || undefined,
        });
        push("Đã lưu người dùng.", "success");
      }
      setDialogOpen(false);
      load(page, search);
    } catch (err) {
      toastForApiError(push, err);
    } finally {
      setSaving(false);
    }
  }

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

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteUser(deleting.id);
      push("Đã xóa người dùng.", "success");
      setDeleting(null);
      load(page, search);
    } catch (err) {
      toastForApiError(push, err);
    }
  }

  return (
    <div>
      <PageHeader title="Quản lý người dùng" />
      <LoadingBar active={loading && items.length > 0} />

      <div className="mb-4">
        <Button onClick={openCreate}>Thêm người dùng</Button>
      </div>

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
          <div className="flex items-end gap-2">
            <Field label="Quyền">
              <Select value={role} onChange={(e) => { setRole(e.target.value); load(1, search, e.target.value, status); }}>
                <option value="">Tất cả</option>
                <option value="Admin">Admin</option>
                <option value="Customer">Customer</option>
              </Select>
            </Field>
            <Field label="Trạng thái">
              <Select value={status} onChange={(e) => { setStatus(e.target.value); load(1, search, role, e.target.value); }}>
                <option value="">Tất cả</option>
                <option value="Active">Active</option>
                <option value="Locked">Locked</option>
              </Select>
            </Field>
          </div>
          <Button onClick={() => load(1, search)}>Tìm</Button>
        </div>
      </Card>

      <div className="min-h-[50vh]">
        {loading && items.length === 0 ? (
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
                      <Badge tone={u.role === "Admin" ? "primary" : "muted"}>{label(ROLE_LABEL, u.role)}</Badge>
                    </td>
                    <td className="px-4 py-2">
                      <Badge tone={u.status === "Active" ? "success" : "danger"}>{label(USER_STATUS_LABEL, u.status)}</Badge>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => openEdit(u)}>Sửa</Button>
                        <Button variant="outline" disabled={isMe} onClick={() => setLocking(u)} title={isMe ? "Không thể tự khóa" : ""}>
                          {u.status === "Locked" ? "Mở khóa" : "Khóa"}
                        </Button>
                        <Button variant="danger" disabled={isMe} onClick={() => setDeleting(u)} title={isMe ? "Không thể tự xóa" : ""}>
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>
            <Pagination page={page} pageSize={pageSize} total={total} onPage={(p) => load(p, search)} />
          </>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        title={editingId === null ? "Thêm người dùng" : `Sửa người dùng #${editingId}`}
        onClose={() => setDialogOpen(false)}
        dismissible={false}
      >
        <div className="flex flex-col gap-3">
          <Field label="Tên đăng nhập (3-100 ký tự: chữ, số, . _ -)">
            <Input
              value={form.username}
              disabled={editingId !== null}
              placeholder="VD: customer3"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              placeholder="email@example.com"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          {editingId === null ? (
            <Field label="Mật khẩu (8-72 ký tự)">
              <Input
                type="password"
                value={form.password}
                placeholder="••••••••"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
          ) : (
            <Field label="Mật khẩu mới (để trống nếu không đổi)">
              <Input
                type="password"
                value={form.newPassword}
                placeholder="••••••••"
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              />
            </Field>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Quyền">
              <Select
                value={form.role}
                disabled={editingId === me?.id}
                onChange={(e) => setForm({ ...form, role: e.target.value as Form["role"] })}
              >
                <option value="Admin">Quản trị (Admin)</option>
                <option value="Customer">Khách hàng (Customer)</option>
              </Select>
            </Field>
            <Field label="Trạng thái">
              <Select
                value={form.status}
                disabled={editingId === me?.id}
                onChange={(e) => setForm({ ...form, status: e.target.value as Form["status"] })}
              >
                <option value="Active">Đang hoạt động</option>
                <option value="Locked">Đã khóa</option>
              </Select>
            </Field>
          </div>
          <FieldError message={fieldError} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={save} loading={saving}>Lưu</Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!locking}
        title={locking?.status === "Locked" ? "Mở khóa user" : "Khóa user"}
        message={`Xác nhận thao tác với ${locking?.username}?`}
        onConfirm={toggleLock}
        onClose={() => setLocking(null)}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Xóa người dùng"
        message={`Xóa ${deleting?.username}? Thao tác không thể hoàn tác.`}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
