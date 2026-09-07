import { Link } from "react-router-dom";
import { PageHeader } from "../components/common/common";
import { Button } from "../components/ui/button";

export function Forbidden() {
  return (
    <div>
      <PageHeader title="403 - Bạn không có quyền" />
      <p className="mb-3 text-sm text-[#64748B]">Trang này chỉ dành cho quản trị viên.</p>
      <Link to="/">
        <Button>Về trang chủ</Button>
      </Link>
    </div>
  );
}

export function NotFound() {
  return (
    <div>
      <PageHeader title="404 - Không tìm thấy trang" />
      <p className="mb-3 text-sm text-[#64748B]">Địa chỉ bạn mở không tồn tại.</p>
      <Link to="/">
        <Button>Về trang chủ</Button>
      </Link>
    </div>
  );
}
