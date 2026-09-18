import { api } from "./api";
import type { PagedResult, SupportRequest } from "../types";

// Gửi yêu cầu hỗ trợ: public, kể cả khách vãng lai (đăng nhập thì tự gắn userId).
export interface SupportForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export async function createSupport(body: SupportForm): Promise<SupportRequest> {
  const res = await api.post<SupportRequest>("/support-requests", body);
  return res.data;
}

// Yêu cầu của chính mình (cần đăng nhập).
export async function mySupports(page = 1, pageSize = 12): Promise<PagedResult<SupportRequest>> {
  const res = await api.get<PagedResult<SupportRequest>>("/support-requests/mine", {
    params: { page, pageSize },
  });
  return res.data;
}

// Admin: xem mọi yêu cầu + lọc trạng thái/tìm kiếm.
export async function adminListSupports(
  status?: string,
  search?: string,
  page = 1,
  pageSize = 12,
): Promise<PagedResult<SupportRequest>> {
  const res = await api.get<PagedResult<SupportRequest>>("/support-requests", {
    params: {
      page,
      pageSize,
      ...(status ? { status } : {}),
      ...(search ? { search } : {}),
    },
  });
  return res.data;
}

export async function getSupport(id: number): Promise<SupportRequest> {
  const res = await api.get<SupportRequest>(`/support-requests/${id}`);
  return res.data;
}

// Admin: chuyển trạng thái New -> InProgress -> Resolved (+ ghi chú xử lý).
export async function updateSupportStatus(
  id: number,
  body: { status: string; adminNote: string },
): Promise<SupportRequest> {
  const res = await api.put<SupportRequest>(`/support-requests/${id}/status`, body);
  return res.data;
}
