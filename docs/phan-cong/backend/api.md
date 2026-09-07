# BACKEND — Theo dõi hoàn thành API (api.md)

> File này là bảng xác nhận từng endpoint đã hoàn thành hay chưa.
> Quy tắc: xong nhóm API ở bước nào thì cập nhật ngay bảng đó (trạng thái + evidence + ngày).
> Contract chi tiết xem `docs/api.md`. JSON luôn camelCase. Ngày cập nhật: 2026-09-07.

## Quy ước chung

- Base URL: `http://localhost:5000`, qua FE proxy: `http://localhost:3001/api`.
- Mọi list trả `PagedResult { items, page, pageSize, total }` (pageSize tối đa 50).
- Mọi lỗi trả `{ error: CODE, message }`, không stack trace.

## 1. Health — Xong (B0 skeleton, B1 nâng cấp)

| Endpoint | Quyền | Trạng thái | Evidence |
|---|---|---|---|
| GET /health -> `{ status, db, time }` | Public | Hoàn thành | curl 200 `db:up` sau B1 (skeleton là `not-configured`) |
| GET /swagger (Swagger UI + JSON) | Public | Hoàn thành | `/swagger/index.html` 200 |

## 2. Auth — Chưa (B2)

Chốt V1: refresh/logout nhận `{ refreshToken }` trong body, FE lưu token ở localStorage
(cookie HttpOnly để V2). Access dùng header `Authorization: Bearer <accessToken>`.

| Endpoint | Quyền | Request | Response | Lỗi | Trạng thái |
|---|---|---|---|---|---|
| POST /api/auth/register | Public | `{ username, email, password }` | 201 UserDto (role=Customer) | 409 trùng user | Chưa |
| POST /api/auth/login | Public | `{ usernameOrEmail, password }` | 200 `{ accessToken (15p), refreshToken (7d) }` | 401 sai pass | Chưa |
| POST /api/auth/refresh | Public | `{ refreshToken }` | 200 cặp token mới, revoke cũ | 401 token cũ đã xoay | Chưa |
| POST /api/auth/logout | Public | `{ refreshToken }` | 200, revoke token | — | Chưa |
| GET /api/auth/me | Đăng nhập | — | 200 UserDto `{ id, username, email, role }` | 401 không/hết token | Chưa |

## 3. Users — Chưa (B2, Admin)

| Endpoint | Request | Response | Lỗi | Trạng thái |
|---|---|---|---|---|
| GET /api/users?page&pageSize&search | search theo username/email | 200 PagedResult UserDto | 403 sai role | Chưa |
| PUT /api/users/{id}/role | `{ role: Admin\|Customer }` | 200 UserDto + audit | 400 tự hạ quyền mình, 403 | Chưa |
| PUT /api/users/{id}/lock | `{ locked: true\|false }` | 200 UserDto + audit | 400 tự khóa mình, 403 | Chưa |

## 4. Audit — Chưa (B2, Admin)

| Endpoint | Request | Response | Trạng thái |
|---|---|---|---|
| GET /api/audit-logs?entityType&entityId&page&pageSize | filter theo đối tượng | 200 PagedResult AuditLog | Chưa |

## 5. Destinations — Chưa (B3)

| Endpoint | Quyền | Ghi chú | Trạng thái |
|---|---|---|---|
| GET /api/destinations, GET /api/destinations/{id} | Public | Kèm vùng Bắc\|Trung\|Nam | Chưa |
| POST/PUT/DELETE /api/destinations | Admin | Xóa destination còn tour thì chặn | Chưa |

## 6. Tours — Một phần (placeholder B0, B3 làm thật)

| Endpoint | Quyền | Ghi chú | Trạng thái |
|---|---|---|---|
| GET /api/tours?search&destinationId&minPrice&maxPrice&page&pageSize&sort | Public | Hiện tại placeholder trả rỗng; B3 trả `TourListDto { id, tourName, thumbnail, priceFrom, destination, status }` | Tạm (chưa thật) |
| GET /api/tours/{id} | Public | B3: `TourDetailDto` kèm images + prices hiệu lực | Chưa |
| POST/PUT /api/tours | Admin | Validate tên max 200, destination tồn tại, maxSeats > 0 | Chưa |
| DELETE /api/tours/{id} | Admin | Có booking thì chuyển Hidden, không xóa cứng | Chưa |

## 7. Prices — Chưa (B3, Admin)

| Endpoint | Ghi chú | Lỗi | Trạng thái |
|---|---|---|---|
| GET /api/tours/{id}/prices | Giá theo tour | — | Chưa |
| POST /api/tours/{id}/prices `{ sourceName, priceValue>0, effectiveDate }` | Mọi đổi giá ghi audit | 422 giá sai | Chưa |
| PUT/DELETE /api/prices/{id} | Kèm audit | 422 | Chưa |

## 8. Images — Chưa (B3, Admin)

| Endpoint | Ghi chú | Lỗi | Trạng thái |
|---|---|---|---|
| POST /api/tours/{id}/images `{ imageUrl, caption, sortOrder }` | URL max 500 ký tự, tối đa 10 ảnh/tour | 422 URL sai | Chưa |
| DELETE /api/images/{id} | — | — | Chưa |

## 9. Bookings + Tracking — Chưa (B4)

| Endpoint | Quyền | Ghi chú | Lỗi | Trạng thái |
|---|---|---|---|---|
| POST /api/bookings `{ tourId, quantity, paymentMethod }` | Customer | 1 transaction tạo Booking + Checkout, amount server tính | 409 hết chỗ, 400 tour Hidden/Draft | Chưa |
| GET /api/bookings (filter status, page) | Admin all / Customer own | — | 403 xem ké | Chưa |
| GET /api/bookings/{id} | Own hoặc Admin | Kèm tracking_trace | 403 | Chưa |
| PUT /api/bookings/{id}/status `{ status, note }` | Admin (Customer chỉ cancel own) | Đúng state machine, mỗi lần đổi ghi trace + audit | 400 sai thứ tự | Chưa |
| PUT /api/bookings/{id}/cancel | Customer own | Chưa Completed/Cancelled | 400/403 | Chưa |

## 10. Checkouts — Chưa (B4)

| Endpoint | Quyền | Ghi chú | Trạng thái |
|---|---|---|---|
| GET /api/checkouts/{id} | Own hoặc Admin | Chỉ tra cứu, không tạo lẻ | Chưa |

## Tổng hợp tiến độ (2026-09-07)

- Hoàn thành: 2/2 Health (B0+B1).
- Tạm (placeholder): 1 (GET /api/tours).
- Chưa: toàn bộ Auth, Users, Audit, Destinations, Tours thật, Prices, Images, Bookings, Checkouts (làm ở B2-B4).

---

## Phụ lục A. JSON mẫu (FE dùng làm mock, BE trả đúng y hệt)

```text
PagedResult TourList:
{ "items": [{ "id": 2, "tourName": "Vịnh Hạ Long 2N1Đ", "thumbnail": "https://picsum.photos/seed/travela-2-1/800/600",
  "priceFrom": 2390000, "destination": { "id": 2, "name": "Hạ Long", "regionName": "Bắc" }, "status": "Published" }],
  "page": 1, "pageSize": 12, "total": 1 }

TourDetail:
{ "id": 2, "tourName": "Vịnh Hạ Long 2N1Đ", "description": "Du thuyền vịnh Hạ Long.", "maxSeats": 30,
  "status": "Published", "destination": { "id": 2, "name": "Hạ Long", "regionName": "Bắc" },
  "images": [{ "id": 1, "imageUrl": "https://...", "caption": "Ảnh 1", "sortOrder": 1 }],
  "prices": [{ "id": 1, "sourceName": "Khuyến mãi", "priceValue": 2390000, "effectiveDate": "2026-08-30T00:00:00Z" }] }

Booking kèm tracking:
{ "id": 1, "tourId": 2, "quantity": 2, "status": "Confirmed",
  "tracking": [{ "status": "PendingPayment", "at": "...", "by": "system", "note": "" },
               { "status": "Paid", "at": "...", "by": "system", "note": "" },
               { "status": "Confirmed", "at": "...", "by": "admin", "note": "Đã xác nhận" }] }

Checkout:
{ "id": 1, "bookingId": 1, "amount": 4780000, "status": "Paid" }

UserDto:
{ "id": 1, "username": "admin", "email": "admin@travela.local", "role": "Admin" }

Lỗi chuẩn:
{ "error": "NOT_ENOUGH_SEATS", "message": "Tour đã hết chỗ." }
```

## Phụ lục B. Enum và query param chốt (sai 1 chữ là lỗi)

- Role: `Admin`, `Customer`. User status: `Active`, `Locked`.
- Tour status: `Draft`, `Published`, `Hidden`.
- Booking status: `PendingPayment`, `Paid`, `Confirmed`, `Ongoing`, `Completed`, `Cancelled`.
- Checkout status: `Pending`, `Paid`, `Failed`. PaymentMethod: `Mock`, `Card`, `Transfer`.
- Region: `Bắc`, `Trung`, `Nam`.
- Query list: `page` (mặc định 1), `pageSize` (mặc định 12, tối đa 50), `search`, `destinationId`,
  `minPrice`, `maxPrice`, `sort`, `status`, `entityType`, `entityId`.
- Auth header: `Authorization: Bearer <accessToken>`.

## Phụ lục C. Mã lỗi → toast FE (F4 làm 1 lần)

| Mã | HTTP | Tình huống | Toast gợi ý |
|---|---|---|---|
| `DUPLICATE_USER` | 409 | Register trùng username/email | Tên đăng nhập hoặc email đã tồn tại. |
| `INVALID_CREDENTIALS` | 401 | Login sai | Sai tài khoản hoặc mật khẩu. |
| `UNAUTHORIZED` | 401 | Không token / token hết hạn | Phiên hết hạn, tự refresh; fail thì về login. |
| `FORBIDDEN` | 403 | Sai role, xem ké booking | Bạn không có quyền. |
| `SELF_ACTION_DENIED` | 400 | Tự khóa / tự hạ quyền mình | Không thể thao tác trên chính mình. |
| `VALIDATION_ERROR` | 422 | Giá sai, URL ảnh sai, field thiếu | Hiện lỗi đúng field BE trả về. |
| `NOT_ENOUGH_SEATS` | 409 | Đặt quá chỗ còn | Tour đã hết chỗ. |
| `INVALID_STATUS_TRANSITION` | 400 | Chuyển trạng thái sai thứ tự | Chuyển trạng thái không hợp lệ. |
| `INTERNAL_ERROR` | 500 | Lỗi server | Đã có lỗi, thử lại sau. |
