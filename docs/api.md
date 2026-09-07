# API Contract — Travela (B5 final, khớp code 2026-09-07)

> Nguồn chốt: KE-HOACH-HOAN-THIEN-TRAVELA.md mục 8. File này là contract-first: code phải khớp, lệch thì sửa cả 2.
> Chi tiết trạng thái + JSON mẫu xem `docs/phan-cong/backend/api.md`.

## Quy ước chung
- Mọi list trả `PagedResult { items, page, pageSize, total }`.
- Mọi lỗi trả `{ error: CODE, message }`.
- JSON camelCase (`tourName`, `priceFrom`).

## Auth (B2 xong)
- [x] POST /api/auth/register
- [x] POST /api/auth/login
- [x] POST /api/auth/refresh
- [x] POST /api/auth/logout
- [x] GET /api/auth/me

## Tours / Prices / Images (B3 xong)
- [x] GET /api/tours (chỉ Published + filter/sort/page, kèm priceFrom)
- [x] GET /api/tours/{id}
- [x] POST/PUT/DELETE /api/tours (Admin, có booking thì Hidden)
- [x] GET /api/tours/{id}/prices, POST /api/tours/{id}/prices, PUT/DELETE /api/prices/{id} (Admin)
- [x] POST /api/tours/{id}/images, DELETE /api/images/{id} (Admin)

## Destinations (B3 xong)
- [x] GET /api/destinations, GET /api/destinations/{id}
- [x] POST/PUT/DELETE /api/destinations (Admin)

## Bookings / Checkouts (B4 xong)
- [x] POST /api/bookings (1 transaction Booking+Checkout, mock Paid)
- [x] GET /api/bookings, GET /api/bookings/{id}
- [x] PUT /api/bookings/{id}/status, PUT /api/bookings/{id}/cancel
- [x] GET /api/checkouts/{id}

## Users / Audit (B2 xong)
- [x] GET /api/users, PUT /api/users/{id}/role, PUT /api/users/{id}/lock (Admin)
- [x] GET /api/audit-logs (Admin)

## Health (B0+B1 xong)
- [x] GET /health -> `{ status, db, time }` (check MySQL thật, `db:up`)
- [x] GET /swagger (Swagger UI + JWT Bearer)
