# BACKEND — Kết quả đã đạt (Ketquadatdat)

> Người làm điền sau mỗi bước B0-B5 trong `Cacbuoccanlam.md`. Một dòng 1 file/test, ghi PASS/FAIL + evidence.
> Evidence = ảnh Swagger / log terminal / link commit. Không ghi "xong" miệng.

## Thông tin chung

* Người thực hiện BE1: agent (B0 kiểm tra) + agent (skeleton backend/docker) + agent (B1 DB) | BE2: chưa làm
* Commit/nhánh: main, chưa commit/push B0 skeleton + B1 (chờ bạn check thủ công)
* Ngày cập nhật: 2026-09-07 (B0 re-verify + B1 xong)

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

**Ghi chú nếu có:** Lần check trước B0 FAIL vì chưa có khung; lần skeleton PASS. Re-verify 2026-09-07 sau B1: vẫn PASS (swagger 200, tours placeholder 200, FE 200, health giờ `db=up`). Chưa push git. Shadcn/Tailwind đầy đủ để dành F1.

---

## B1. DB + Seed + Index

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Người | Trạng thái |
|---|---|---|---|---|
| `Models/` 9 files (User, Destination, Tour, Price, Image, Booking, Checkout, AuditLog, RefreshToken) | Tạo | POCO Entity, TrackingTrace dạng chuỗi JSON | agent (BE1) | ☑ |
| `Data/TravelaDbContext.cs` | Tạo | 9 DbSet, bảng lowercase, utf8mb4, FK Restrict toàn bộ, unique username/email/token_hash/booking_id, đủ index B1.3 | agent (BE1) | ☑ |
| `Data/DbSeeder.cs` | Tạo | Seed runtime khi DB trống: 3 users BCrypt, 10 destinations, 12 tours, 30 prices, 30 images, 5 bookings + 5 checkouts | agent (BE1) | ☑ |
| `Migrations/*InitialCreate*` + snapshot | Tạo (dotnet-ef 9) | Schema 9 bảng, FK RESTRICT, index | agent (BE1) | ☑ |
| `Middleware/ExceptionMiddleware.cs` (+ AppException) | Tạo | Lỗi chuẩn {error,message}, không stack trace | agent (BE1) | ☑ |
| `DTOs/Common/PagedResult.cs`, `Helpers/PaginationHelper.cs` | Tạo | Chuẩn list + normalize page/size (max 50) | agent (BE1) | ☑ |
| `Program.cs` | Sửa | DbContext Pomelo MySQL, auto Migrate+Seed khi khởi động, health check DB thật, CORS thêm localhost:3001 | agent (BE1) | ☑ |
| `appsettings.json` | Sửa | ConnectionStrings DefaultConnection local `localhost:3307` (Docker override `Server=mysql` qua env) | agent (BE1) | ☑ |
| `Travela.Api.csproj` | Sửa | Thêm Pomelo 9.0.0 (= EF Core 9), EF Design 9, BCrypt.Net-Next 4.2.0 | agent (BE1) | ☑ |

### Kết quả test

| Checklist B1 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Migration fresh OK | PASS | `down -v` rồi `up --build`: backend tự Migrate+Seed, `health=db:up`; `dotnet ef database update` từ host cũng Done | Pomelo 9 + EF 9 chạy trên net10.0 OK |
| Seed đủ (users/destinations/tours/...) | PASS | users=3, destinations=10, tours=12, prices=30, images=30, bookings=5, checkouts=5 | Join tours-destinations-prices-images ra đúng |
| Chặn cascade xóa Tour có Booking | PASS | `DELETE tours Id=1` báo `ERROR 1451 ... ON DELETE RESTRICT` | Đúng spec, không mất booking |
| Index đủ | PASS | Đủ 18 index: users(2 unique), tours(3), prices(2), images(1), bookings(3), checkouts(1 unique), audit(3), refresh(2) | Check INFORMATION_SCHEMA |

**Ghi chú:** Tài khoản seed: admin/Admin123!, customer1 + customer2/Customer123!. Chưa push git. B2 mới làm Auth/Users/Audit endpoints.

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
