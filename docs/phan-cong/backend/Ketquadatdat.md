# BACKEND — Kết quả đã đạt (Ketquadatdat)

> Người làm điền sau mỗi bước B0-B5 trong `Cacbuoccanlam.md`. Một dòng 1 file/test, ghi PASS/FAIL + evidence.
> Evidence = ảnh Swagger / log terminal / link commit. Không ghi "xong" miệng.

## Thông tin chung

* Người thực hiện BE1: agent (B0 kiểm tra) + agent (skeleton backend/docker) + agent (B1 DB) + agent (B2 Auth) | BE2: agent (B3 Tours) + agent (B4 Booking) | B5: agent (cả 2)
* Commit/nhánh: main, chưa commit/push B5 (chờ bạn check thủ công)
* Ngày cập nhật: 2026-09-07 (B5 xong, backend hoàn tất B0-B5)

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
| `Controllers/AuthController.cs` | Tạo | register/login/refresh/logout AllowAnonymous, me cần auth | agent (BE1) | ☑ |
| `Controllers/UsersController.cs` | Tạo | Admin only: list/search/page, PUT role/lock | agent (BE1) | ☑ |
| `Controllers/AuditLogsController.cs` | Tạo | Admin tra cứu theo entityType/entityId + page | agent (BE1) | ☑ |
| `Controllers/ToursController.cs` | Sửa | Thêm [AllowAnonymous] giữ public sau khi bật Default Deny | agent (BE1) | ☑ |
| `Services/AuthService, UserService, AuditLogService` | Tạo | Refresh xoay vòng + revoke chuỗi, SELF_ACTION_DENIED, audit mọi lock/role | agent (BE1) | ☑ |
| `Helpers/JwtHelper.cs` | Tạo | Access 15p (sub/username/role), refresh raw 48 byte + hash SHA256 | agent (BE1) | ☑ |
| `Helpers/PasswordHasher.cs` | Tạo | Bọc BCrypt hash/verify | agent (BE1) | ☑ |
| `DTOs/Auth/AuthDtos.cs, DTOs/User/UserDtos.cs` | Tạo | Không bao giờ trả password_hash | agent (BE1) | ☑ |
| `Program.cs` | Sửa | JWT Bearer, Default Deny toàn cục, Swagger Bearer, đăng ký 4 services | agent (BE1) | ☑ |
| `docker-compose.yml` | Sửa | Thêm JWT_SECRET env cho backend | agent (BE1) | ☑ |
| `Travela.Api.csproj` | Sửa | Thêm System.IdentityModel.Tokens.Jwt 8.22 + JwtBearer 10.0.11 | agent (BE1) | ☑ |

### Kết quả test

| Checklist B2 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Trùng user -> 409 | PASS | register lại `admin` = 409 DUPLICATE_USER | user test đã xóa, DB còn 3 seed |
| Login đúng/sai | PASS | sai pass 401 INVALID_CREDENTIALS; đúng 200 đủ accessToken + refreshToken + user | Không lộ password_hash |
| Không token -> 401, hết hạn -> 401 | PASS | me không token 401, token giả 401 | Hết hạn cùng đường 401 (ValidateLifetime, access 15p) |
| Customer GET /users -> 403 | PASS | customer1 gọi = 403 | Default Deny + Roles=Admin |
| Tự khóa -> 400 SELF_ACTION_DENIED | PASS | lock + role chính id=1 đều 400 SELF_ACTION_DENIED | — |
| Reuse refresh cũ -> 401 | PASS | dùng lại R1 sau xoay = 401, R2 cũng 401 (revoke cả chuỗi) | Chống replay |
| Logout rồi refresh -> 401 | PASS | logout 200 rồi refresh = 401 INVALID_REFRESH | Thu hồi đúng |
| Audit có log lock/unlock | PASS | GET /audit-logs User/3 có row User.Lock Active->Locked | Unlock cũng audit |

**Ghi chú:** Lỗi fix khi làm: Swagger security API của Microsoft.OpenApi 2.7 + Swashbuckle 10 đổi kiểu (dùng OpenApiSecuritySchemeReference + Func). Chưa push git. FE đấu được login/me từ giờ.

---

## B3. Tours / Prices / Images / Destinations

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Người | Trạng thái |
|---|---|---|---|---|
| `Controllers/ToursController, PricesController, DestinationsController, ImagesController` | Tạo/sửa (Tours ghi đè placeholder) | Đọc public, ghi Admin; prices/images route lồng theo tour | agent (BE2) | ☑ |
| `Services/TourService, DestinationService` | Tạo | priceFrom min giá hiệu lực, filter/sort/page, validate, audit tour + giá | agent (BE2) | ☑ |
| `DTOs/Tour/TourDtos.cs, DTOs/Destination/DestinationDtos.cs` | Tạo | List/Detail/Create/Update khớp Types FE | agent (BE2) | ☑ |
| `Program.cs` | Sửa | Đăng ký 2 services | agent (BE2) | ☑ |

### Kết quả test

| Checklist B3 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Paging/search/filter đúng | PASS | list total=10 (chỉ Published), search Hạ Long=1, dest2=1, min3m=4, max1m=2 | Ẩn đúng Draft/Hidden |
| Validation tour/prices/images | PASS | thiếu tên/sai destination 400; giá 0 + date quá khứ 422; URL sai 422 | Rõ field |
| priceFrom = min hiệu lực | PASS | tour2=2490000 (list+detail khớp), tour1=790000 (min 3 nguồn) | Bản mới nhất từng nguồn |
| Customer POST tour -> 403 | PASS | customer1 POST = 403 | — |
| Audit Price.Update | PASS | audit-logs Price/31 có Price.Create + Price.Update | Tour hide/restore cũng audit |
| Limit 10 ảnh + xóa tour có booking | PASS | ảnh 11 = 400 TOO_MANY_IMAGES; xóa tour1 = hidden:true; tour trống xóa cứng | Tour1 đã restore Published, DB về seed 12/30/30 |

**Ghi chú:** Lỗi test gặp (không phải lỗi server): PowerShell 5.1 gửi body UTF-8 sai gây 400 giả — fix bằng bytes UTF-8 + script Python. Dữ liệu test + audit rác đã dọn. Chưa push git. FE đấu được Tours/Destinations thật.

---

## B4. Booking / Checkout / Tracking

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Người | Trạng thái |
|---|---|---|---|---|
| `Controllers/BookingsController, CheckoutsController` | Tạo | POST/list/detail/status/cancel; checkout chỉ tra cứu own/Admin | agent (BE2) | ☑ |
| `Services/BookingService, CheckoutService` | Tạo | Transaction Serializable + retry deadlock, trừ chỗ, state machine, amount server tính | agent (BE2) | ☑ |
| `DTOs/Booking/BookingDtos.cs` | Tạo | Create/Status/Tracking/Checkout DTO khớp Types FE | agent (BE2) | ☑ |
| `Middleware/ExceptionMiddleware.cs` | Sửa | Log unhandled error (nhờ đó bắt được 2 bug B4) | agent (BE2) | ☑ |
| `Program.cs`, `Travela.Api.csproj` | Sửa | Đăng ký 2 services; thêm MySqlConnector 2.4.0 | agent (BE2) | ☑ |

### Kết quả test

| Checklist B4 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Hết chỗ -> 409, không rác DB | PASS | tour 2 chỗ đặt 2 rồi đặt thêm = 409 NOT_ENOUGH_SEATS, số booking không tăng | Transaction rollback |
| Đặt OK -> 201 booking+checkout Paid | PASS | 201 Paid/Paid, amount=priceFrom×qty (200000), trace 2 mốc | Mock payment V1 |
| Tour Hidden không đặt được | PASS | tour Draft = 400 TOUR_NOT_AVAILABLE | Hidden tương tự |
| Sai thứ tự status -> 400 | PASS | customer Paid->Completed = 400 INVALID_STATUS_TRANSITION; Cancelled terminal cũng 400 | Validate trước check quyền |
| Cancel own / sai own | PASS | C2 sửa/hủy đơn C1 = 403; C1 hủy own = 200 Cancelled | — |
| Audit Booking.Status | PASS | audit-logs Booking có Create + Status (Confirm/Cancel) | Mọi chuyển ghi trace+audit |
| Concurrent 2 booking | PASS | 3 request song song vào 2 chỗ = [201,201,409], tổng đúng 2, không 500 | Retry deadlock 1213/1205 |

**Ghi chú:** 2 bug thật đã fix: (1) string[].Contains trong LINQ crash runtime .NET 10 -> so sánh trực tiếp; (2) deadlock concurrent -> retry tối đa 3 lần (EF bọc DbUpdate trong InvalidOperation nên phải bóc inner). DB đã dọn về seed 12/30/30/5/5. Chưa push git. FE đấu được Booking/Checkout thật.

---

## B5. NFR + Docker final

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Người | Trạng thái |
|---|---|---|---|---|
| `Program.cs` | Sửa | JSON camelCase chốt rõ (khớp Types FE) | agent (BE) | ☑ |
| `docs/api.md` | Sửa | Lật toàn bộ endpoint sang [x] khớp code B2-B4 | agent (BE) | ☑ |
| `k6/tours-test.js` | Tạo | NFR 30 VUs ~1000 req/phút 2 phút, ngưỡng p95<500ms | agent (BE) | ☑ |
| `.env.example` | Sửa | Ghi rõ cổng host thực tế (MySQL 3307, BE 5000, FE 3001) | agent (BE) | ☑ |

### Kết quả test

| Checklist B5 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Compose fresh 3 Up | PASS | `down -v` rồi `up --build`: 3 Up, `/health` db=up, seed đủ | Rehearsal từ volume trắng |
| k6 p95 <500ms | PASS | p95=68.79ms, 83869 req, 0 failed, 100% check | k6 v2.2.0 portable (máy chưa có sẵn) |
| Full flow E2E Swagger | PASS | register->login->book Paid trace2->Confirm->Ongoing->Completed->tracking 5 mốc->audit 4 rows | Dữ liệu E2E đã dọn, DB về seed |
| .env không commit | PASS | Không có file .env, `.env.example` đủ MYSQL_* + JWT_SECRET | `git status` sạch secret |

**Ghi chú:** Swagger có đủ 23 paths (22 API + /health). Không thêm lib mới ở B5 (k6 là tool ngoài). Backend xong toàn bộ B0-B5.
