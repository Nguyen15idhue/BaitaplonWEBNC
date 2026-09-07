# API Contract — Travela skeleton (M1)

> Nguồn chốt: KE-HOACH-HOAN-THIEN-TRAVELA.md mục 8. File này là contract-first: code phải khớp, lệch thì sửa cả 2.
> Skeleton M1 chỉ có các endpoint đánh dấu [x]. Các endpoint còn lại làm ở B2-B4.

## Quy ước chung
- Mọi list trả `PagedResult { items, page, pageSize, total }`.
- Mọi lỗi trả `{ error: CODE, message }`.
- JSON camelCase (`tourName`, `priceFrom`).

## Auth (B2)
- [ ] POST /api/auth/register
- [ ] POST /api/auth/login
- [ ] POST /api/auth/refresh
- [ ] POST /api/auth/logout
- [ ] GET /api/auth/me

## Tours / Prices / Images (B3)
- [x] GET /api/tours (skeleton: trả PagedResult rỗng; B3 thay bằng data thật)
- [ ] GET /api/tours/{id}
- [ ] POST/PUT/DELETE /api/tours (Admin)
- [ ] GET /api/tours/{id}/prices, POST /api/tours/{id}/prices, PUT/DELETE /api/prices/{id} (Admin)
- [ ] POST /api/tours/{id}/images, DELETE /api/images/{id} (Admin)

## Destinations (B3)
- [ ] GET /api/destinations, GET /api/destinations/{id}
- [ ] POST/PUT/DELETE /api/destinations (Admin)

## Bookings / Checkouts (B4)
- [ ] POST /api/bookings (1 transaction Booking+Checkout)
- [ ] GET /api/bookings, GET /api/bookings/{id}
- [ ] PUT /api/bookings/{id}/status, PUT /api/bookings/{id}/cancel
- [ ] GET /api/checkouts/{id}

## Users / Audit (B2)
- [ ] GET /api/users, PUT /api/users/{id}/role, PUT /api/users/{id}/lock (Admin)
- [ ] GET /api/audit-logs (Admin)

## Health (B0, đã có)
- [x] GET /health -> `{ status, db, time }` (skeleton `db=not-configured`; B2/B5 bổ sung check MySQL thật)
- [x] GET /swagger (Swagger UI skeleton)
