import { PageHeader } from "../components/common/common";

export function Forbidden() {
  return <PageHeader title="403 - Không có quyền" />;
}

export function NotFound() {
  return <PageHeader title="404 - Không tìm thấy trang" />;
}
