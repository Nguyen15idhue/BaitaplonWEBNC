import { PageHeader } from "../components/common/common";

export function Forbidden() {
  return <PageHeader title="403 - Không có quyền" />;
}

export function NotFound() {
  return <PageHeader title="404 - Không tìm thấy trang" />;
}

// Placeholder Admin cho F2 build qua. F3 thay bằng src/pages/Admin.tsx thật.
export function Admin() {
  return <PageHeader title="Admin dashboard (F3)" />;
}
