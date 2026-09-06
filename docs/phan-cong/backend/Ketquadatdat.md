# BACKEND — Kết quả đã đạt (Ketquadatdat)

> Người làm điền sau mỗi bước B0-B5 trong `Cacbuoccanlam.md`. Một dòng 1 file/test, ghi PASS/FAIL + evidence.
> Evidence = ảnh Swagger / log terminal / link commit. Không ghi "xong" miệng.

## Thông tin chung

* Người thực hiện BE1: ... | BE2: ...
* Commit/nhánh: ...
* Ngày cập nhật: ...

---

## B0. Nhận khung

### File đã tạo/sửa

| File | Hành động (tạo/sửa) | Nội dung chính | Người | Trạng thái |
|---|---|---|---|---|
| `docker-compose.yml` | | | | ☐/☑ |
| | | | | ☐/☑ |

### Kết quả test theo checklist

| Checklist B0 | Kết quả (PASS/FAIL) | Evidence | Ghi chú |
|---|---|---|---|
| 3 container Up | | `docker compose ps` ... | |
| `GET /health` 200 | | | |
| Swagger mở được | | | |

**Ghi chú nếu có:** ...

---

## B1. DB + Seed + Index

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Người | Trạng thái |
|---|---|---|---|---|
| `Models/*.cs` (9 files) | | | | ☐/☑ |
| `Data/TravelaDbContext.cs` | | Quan hệ + Index + Restrict | | ☐/☑ |
| `Migrations/*` | | InitialCreate | | ☐/☑ |
| `Middleware/ExceptionMiddleware.cs` | | Lỗi chuẩn | | ☐/☑ |

### Kết quả test

| Checklist B1 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Migration fresh OK | | | |
| Seed đủ (users/destinations/tours/...) | | Đếm rows: ... | |
| Chặn cascade xóa Tour có Booking | | | |
| Index đủ | | `SHOW INDEX` ... | |

**Ghi chú:** ...

---

## B2. Auth + Users + Audit + Health

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Người | Trạng thái |
|---|---|---|---|---|
| `Controllers/AuthController.cs` | | register/login/refresh/logout/me | | ☐/☑ |
| `Controllers/UsersController.cs` | | list/role/lock | | ☐/☑ |
| `Controllers/AuditLogsController.cs` | | | | ☐/☑ |
| `Services/AuthService, UserService, AuditLogService` | | | | ☐/☑ |
| `Helpers/JwtHelper.cs` | | access 15p | | ☐/☑ |

### Kết quả test

| Checklist B2 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Trùng user -> 409 | | | |
| Login đúng/sai | | | |
| Không token -> 401, hết hạn -> 401 | | | |
| Customer GET /users -> 403 | | | |
| Tự khóa -> 400 SELF_ACTION_DENIED | | | |
| Reuse refresh cũ -> 401 | | | |
| Logout -> refresh fail | | | |
| Audit có log lock/unlock | | | |

**Ghi chú:** ...

---

## B3. Tours / Prices / Images / Destinations

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Người | Trạng thái |
|---|---|---|---|---|
| `Controllers/ToursController, PricesController, DestinationsController` | | | | ☐/☑ |
| `Services/TourService, DestinationService` | | priceFrom logic | | ☐/☑ |
| `DTOs/Tour/*` | | List/Detail/Create | | ☐/☑ |

### Kết quả test

| Checklist B3 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Paging/search/filter đúng | | | |
| Validation tour/prices/images | | | |
| priceFrom = min hiệu lực | | | |
| Customer POST tour -> 403 | | | |
| Audit Price.Update | | | |

**Ghi chú:** ...

---

## B4. Booking / Checkout / Tracking

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Người | Trạng thái |
|---|---|---|---|---|
| `Controllers/BookingsController, CheckoutsController` | | | | ☐/☑ |
| `Services/BookingService, CheckoutService` | | transaction + state machine | | ☐/☑ |

### Kết quả test

| Checklist B4 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Hết chỗ -> 409, không rác DB | | | |
| Đặt OK -> 201 booking+checkout Paid | | bookingId=..., checkoutId=... | |
| Tour Hidden không đặt được | | | |
| Sai thứ tự status -> 400 | | | |
| Cancel own / sai own | | | |
| Audit Booking.Status | | | |

**Ghi chú:** ...

---

## B5. NFR + Docker final

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Người | Trạng thái |
|---|---|---|---|---|
| `Program.cs, appsettings.json` | | CORS, Swagger Bearer, Pomelo | | ☐/☑ |
| `docs/api.md` | | Cập nhật khớp code | | ☐/☑ |
| `k6/tours-test.js` | | Script NFR | | ☐/☑ |

### Kết quả test

| Checklist B5 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Compose fresh 3 Up | | | |
| k6 p95 <500ms | | p95=...ms | |
| Full flow E2E Swagger | | | |
| .env không commit | | | |

**Ghi chú:** ...
