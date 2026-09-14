import { api } from "./api";
import type { AuditLog, PagedResult } from "../types";

// Audit thật (B2): tra cứu lịch sử đổi giá/status/role/lock. Dùng chung type với BE.
export type { AuditLog };

export async function listAuditLogs(entityType: string, entityId: number): Promise<AuditLog[]> {
  const res = await api.get<{ items: AuditLog[] }>("/audit-logs", {
    params: { entityType, entityId, page: 1, pageSize: 50 },
  });
  return res.data.items;
}

// Trang /admin/audit-logs: lọc + phân trang đầy đủ.
export interface AuditQuery {
  entityType?: string;
  entityId?: number;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function pageAuditLogs(q: AuditQuery = {}): Promise<PagedResult<AuditLog>> {
  const res = await api.get<PagedResult<AuditLog>>("/audit-logs", {
    params: {
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 12,
      ...(q.entityType ? { entityType: q.entityType } : {}),
      ...(q.entityId !== undefined ? { entityId: q.entityId } : {}),
      ...(q.action ? { action: q.action } : {}),
      ...(q.from ? { from: q.from } : {}),
      ...(q.to ? { to: q.to } : {}),
    },
  });
  return res.data;
}
