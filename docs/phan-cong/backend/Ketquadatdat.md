# BACKEND — Kết quả đã đạt (Ketquadatdat)

> Người làm điền sau mỗi bước B0-B5 trong `Cacbuoccanlam.md`. Một dòng 1 file/test, ghi PASS/FAIL + evidence.
> Evidence = ảnh Swagger / log terminal / link commit. Không ghi "xong" miệng.

## Thông tin chung

* Người thực hiện BE1: agent (B0 kiểm tra) + agent (skeleton backend/docker) | BE2: chưa làm
* Commit/nhánh: main, chưa commit/push skeleton (chờ bạn check thủ công)
* Ngày cập nhật: 2026-09-06 (B0 skeleton)

---

## B0. Nhận khung

### File đã tạo/sửa

| File | Hành động (tạo/sửa) | Nội dung chính | Người | Trạng thái |
|---|---|---|---|---|
| `backend/Travela.Api/Travela.Api.csproj` | Tạo (dotnet new webapi) + sửa (thêm Swashbuckle.AspNetCore 10.2.3) | Khung API .NET 10, Swagger UI | agent | ☑ |
| `backend/Travela.Api/Program.cs` | Sửa | Controllers + Swagger luôn bật + CORS FE + GET /health skeleton | agent | ☑ |
| `backend/Travela.Api/Controllers/ToursController.cs` | Tạo | GET /api/tours placeholder PagedResult rỗng (B3 thay bằng thật) | agent | ☑ |
| `backend/Travela.Api/{Models,DTOs/*,Services,Data,Middleware,Helpers}/` | Tạo thư mục rỗng | Giữ cấu trúc B1-B4, chưa code nghiệp vụ | agent | ☑ |
| `docker/backend/Dockerfile` | Tạo | Multi-stage sdk->aspnet, publish Release, EXPOSE 8080 | agent | ☑ |
| `docker-compose.yml` | Tạo | 3 services mysql 8.4 + backend 5000->8080 + frontend; MySQL host đổi 3307 do 3306 bị chiếm | agent | ☑ |
| `.dockerignore` | Tạo | Loại node_modules/bin/obj/.git khỏi context | agent | ☑ |
| `docs/api.md` | Tạo | Contract-first, skeleton tick [x] health/swagger/tours-rỗng | agent | ☑ |

### Kết quả test theo checklist

| Checklist B0 | Kết quả (PASS/FAIL) | Evidence | Ghi chú |
|---|---|---|---|
| `docker compose ps` = 3 Up | PASS | 3 Up: travela-backend, travela-frontend, travela-mysql | FE host 3001 (3000 bị chiếm), MySQL host 3307 (3306 bị chiếm) |
| `GET /health` = 200 | PASS | `curl localhost:5000/health` = `{"status":"ok","db":"not-configured",...}`; qua FE `localhost:3001/health` cũng 200 | `db=not-configured` là đúng skeleton, B2/B5 bổ sung check MySQL thật |
| `GET /swagger` mở được | PASS | `/swagger` 301 redirect chuẩn; `/swagger/index.html` 200; `/swagger/v1/swagger.json` 200 | Swagger bật luôn ở skeleton để demo Docker |
| `dotnet build` sạch | PASS | `Build succeeded, 0 Warning, 0 Error` | Đã fix lỗi `--no-restore` (NETSDK1064) bằng publish thường |
| `GET /api/tours` placeholder | PASS | Cả `localhost:5000/api/tours` và `localhost:3001/api/tours` đều 200 PagedResult rỗng | Chứng minh FE->BE qua Nginx proxy đã thông |

**Ghi chú nếu có:** Lần check trước B0 FAIL vì chưa có khung; lần này tạo skeleton nên PASS. Chưa push git. Không sang B1 khi chưa được bạn duyệt skeleton. Shadcn/Tailwind đầy đủ để dành F1.

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
