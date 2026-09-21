# API Contract — Travela (khớp code sau đợt fix audit 2026-09-12)

> Nguồn chốt: KE-HOACH-HOAN-THIEN-TRAVELA.md mục 8. File này là contract-first: code phải khớp, lệch thì sửa cả 2.
> Đợt fix 2026-09-12 bổ sung: `GET /api/admin/stats`, `POST /api/bookings/{id}/pay`,
> `POST /api/auth/logout-all`, `PUT /api/auth/change-password`, filter `role/status` ở users,
> filter `action/from/to` ở audit-logs, `GET /api/tours/all`. V1 chỉ nhận `paymentMethod: Mock`.
> Đợt fix 2026-09-21 bổ sung: CRUD users (`POST/PUT/DELETE /api/users`), booking có breakdown
> loại khách + thông tin liên hệ (cột ContactName/ContactEmail/ContactPhone/Note), job nền dọn
> refresh token quá hạn (retention 30 ngày), `TourService.ListAsync` không kéo Bookings vào RAM.

## Quy ước chung
- Mọi list trả `PagedResult { items, page, pageSize, total }`.
- Mọi lỗi trả `{ error: CODE, message }` — kể cả 401/403 do framework và lỗi model-binding.
- JSON camelCase (`tourName`, `priceFrom`).
- Rate-limit auth theo IP: login 10/phút, register 5/phút → `429 TOO_MANY_REQUESTS`.
- Mã lỗi chuẩn: không token 401, sai role 403, tự khóa/tự hạ quyền 400, giá sai 422,
  hết chỗ 409, sai thứ tự trạng thái 400, quá 24h hủy 400 `CANCELLATION_WINDOW_EXPIRED`.

## Auth
- [x] POST /api/auth/register — validate username 3–100 `[a-zA-Z0-9._-]`, email regex, pass 8–72
- [x] POST /api/auth/login — khóa → `401 ACCOUNT_LOCKED`
- [x] POST /api/auth/refresh — xoay vòng atomic (1 token chỉ dùng 1 lần)
- [x] POST /api/auth/logout
- [x] POST /api/auth/logout-all (đăng nhập) — thu hồi mọi refresh
- [x] PUT /api/auth/change-password (đăng nhập) — verify cũ, thu hồi phiên khác
- [x] GET /api/auth/me — user Locked → 401 ngay (lock hiệu lực tức thì)

## Tours / Prices / Images
- [x] GET /api/tours (chỉ Published + filter/sort/page, kèm priceFrom + bookedSeats/availableSeats + startDate/endDate + departureDate/departureLocation/duration)
- [x] GET /api/tours/{id} (public: chỉ Published; Admin xem được Draft/Hidden)
- [x] GET /api/tours/all (Admin + filter status/sort/minPrice/maxPrice)
- [x] POST/PUT/DELETE /api/tours/{id} (Admin, có booking thì Hidden; hạ MaxSeats dưới số đã bán → 422; StartDate phải < EndDate; nội dung chi tiết: route/itinerary/transport/accommodation/meals/sightseeing/guide/included/excluded/audience/insurance/terms/contactInfo, ngắn ≤500, dài ≤10000)
- [x] GET /api/tours/{id}/prices — chỉ giá hiệu lực mới nhất từng nguồn
- [x] POST /api/tours/{id}/prices, PUT/DELETE /api/prices/{id} (Admin)
- [x] POST /api/tours/{id}/images (Admin, JSON imageUrl http/https, tối đa 10 ảnh), POST /api/tours/{id}/images/upload (Admin, multipart file ảnh ≤5MB: jpg/png/webp/gif, lưu /uploads), DELETE /api/images/{id} (Admin, ảnh upload cũng xóa file vật lý)

## Destinations
- [x] GET /api/destinations, GET /api/destinations/{id}
- [x] POST/PUT/DELETE /api/destinations (Admin)

## Bookings / Checkouts
- [x] POST /api/bookings (1 transaction Booking+Checkout, chỉ Mock, tour không giá → 422, tour quá EndDate → 400 TOUR_ENDED; header `Idempotency-Key` optional chống trùng đơn). Body: `{ tourId, adultQty, childQty, supplementQty, contactName?, contactEmail?, contactPhone?, note? }`; server tính tiền từ giá hiệu lực theo từng nguồn (Người lớn/Trẻ em/Phụ thu). Vẫn nhận `{ tourId, quantity }` legacy (dùng giá min).
- [x] GET /api/bookings, GET /api/bookings/{id}
- [x] POST /api/bookings/{id}/pay (chủ đơn hoặc Admin, chỉ từ PendingPayment)
- [x] PUT /api/bookings/{id}/status (chỉ Admin) — hủy đồng thời checkout → Refunded; concurrent → 409 CONCURRENT_UPDATE
- [x] PUT /api/bookings/{id}/cancel (customer, đơn mình, trong 24h từ BookingDate)
- [x] GET /api/checkouts/{id}

## Users / Audit / Stats
- [x] GET /api/users?search&role&status (Admin, PagedResult)
- [x] POST /api/users (Admin) — body `{ username, email, password, role, status }`; trùng username/email → 409 DUPLICATE_USER
- [x] PUT /api/users/{id} (Admin) — body `{ email, role, status, newPassword? }`; tự hạ quyền/tự khóa chính mình → 400 SELF_ACTION_DENIED; đổi mật khẩu thu hồi refresh
- [x] DELETE /api/users/{id} (Admin) — tự xóa chính mình → 400; user đã có booking → 409 HAS_RELATIONS; gỡ tham chiếu nullable + xóa refresh/idempotency
- [x] PUT /api/users/{id}/role, PUT /api/users/{id}/lock (Admin)
- [x] GET /api/audit-logs?action&entityType&entityId&from&to (Admin, trả actorUsername)
- [x] GET /api/admin/stats (Admin: usersTotal, toursTotal, bookingsTotal, revenuePaid, bookingsByStatus, topTours)

## Support (yêu cầu hỗ trợ / liên hệ)
- [x] POST /api/support-requests (public, cả khách vãng lai; đăng nhập thì tự gắn userId)
- [x] GET /api/support-requests?status&search (Admin, PagedResult)
- [x] GET /api/support-requests/mine (đăng nhập: yêu cầu của chính mình)
- [x] GET /api/support-requests/{id} (Admin)
- [x] PUT /api/support-requests/{id}/status (Admin: New -> InProgress -> Resolved, cho phép New -> Resolved; sai thứ tự 400; có audit Support.Status)

## Health
- [x] GET /health -> `{ status, db, time }` (DB down → 503)
- [x] GET /health/live -> liveness 200
- [x] GET /swagger (chỉ ngoài Production)
