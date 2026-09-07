import { api } from "./api";
import type { PagedResult } from "../types";

// Audit thật (B2): tra cứu lịch sử đổi giá/status/role/lock.
export interface AuditLog {
  id: number;
  actorId: number | null;
  action: string;
  entityType: string;
  entityId: number;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

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
    },
  });
  return res.data;
}
