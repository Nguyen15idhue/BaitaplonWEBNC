import { useEffect, useState } from "react";
import { me } from "../services/authApi";
import type { User } from "../types";
import { Loading, ErrorState, PageHeader } from "../components/common/common";
import { Card, Badge } from "../components/ui/card";

// Profile: BE chưa có endpoint sửa own nên chỉ hiển thị từ GET /me.
export function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => setError("Không tải được thông tin tài khoản."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error || !user) return <ErrorState message={error || "Không tải được thông tin tài khoản."} />;

  return (
    <div>
      <PageHeader title="Hồ sơ" />
      <Card className="max-w-md">
        <p className="text-sm">Username: <strong>{user.username}</strong></p>
        <p className="text-sm">Email: {user.email}</p>
        <p className="text-sm">
          Role: <Badge tone={user.role === "Admin" ? "primary" : "muted"}>{user.role}</Badge>
        </p>
        <p className="text-sm">
          Trạng thái: <Badge tone={user.status === "Active" ? "success" : "danger"}>{user.status}</Badge>
        </p>
      </Card>
    </div>
  );
}
