# BACKEND — Các bước cần làm (Cacbuoccanlam)

> Team: 2 người (BE1 + BE2). Người setup khung đã tạo sẵn `Travela.Api`, Dockerfile, compose, shadcn/FE.
> Nguồn chốt: `KE-HOACH-HOAN-THIEN-TRAVELA.md` mục 2-8, 10-11.
> Quy ước lỗi chuẩn mọi API: `{ "error": "CODE", "message": "..." }`. Mọi list trả `PagedResult { items, page, pageSize, total }`.

> Quy tắc tracking API (bắt buộc): làm xong mỗi nhóm API ở bước nào thì cập nhật ngay
> `docs/phan-cong/backend/api.md` — chuyển trạng thái endpoint đó thành Hoàn thành kèm
> evidence và ngày. Chưa cập nhật api.md coi như bước đó chưa xong.

## Phân công gợi ý

* **BE1:** B1 (DB nền) + B2 (Auth/Users/Audit/Health).
* **BE2:** B3 (Tour/Destination/Price/Image) + B4 (Booking/Checkout/Tracking).
* **B5:** cả 2 cùng làm + cùng rehearsal Docker.

---

## B0. Nhận khung (cả 2, 0.5 ngày)

**Công việc:**
1. Pull code khung, chạy `docker compose up --build`, mở `localhost:5000/swagger`.
2. Đọc `docs/api.md` + mục 3-6 bản hoàn thiện (state machine, transaction, refresh).
3. Thống nhất DTO <-> FE `types/` (tên field camelCase JSON: `tourName`, `priceFrom`).

**Yêu cầu đạt:** 3 container Up, Swagger mở được, hiểu contract.
**Checklist test:**
- [ ] `docker compose ps` = 3 Up
- [ ] `GET /health` = 200
- [ ] `GET /swagger` mở được
**Ghi chú:** Không đổi tên field tự ý. Đổi phải báo FE.

---

## B1. DB + DbContext + Seed + Index (BE1 chính, BE2 review)

**Công việc:**
1. Models: `User, Destination, Tour, Price, Image, Booking(tracking_trace JSON), Checkout, AuditLog, RefreshToken`.
2. `Data/TravelaDbContext.cs`: DbSet đủ 9, quan hệ `Users 1-N Bookings/RefreshTokens, Destinations 1-N Tours, Tours 1-N Prices/Images/Bookings, Bookings 1-1 Checkouts`, FK `Restrict`, unique `users.username/email`, `refresh_tokens.token_hash`, `checkouts.booking_id`.
3. Index: `users(username,email)`, `tours(tour_name,destination_id,status)`, `prices(tour_id,effective_date)`, `images(tour_id)`, `bookings(user_id,tour_id,status)`, `audit_logs(entity_type,entity_id,created_at)`.
4. `Helpers/PaginationHelper`, `Middleware/ExceptionMiddleware` trả lỗi chuẩn.
5. Migration `InitialCreate` + seed: 1 admin / 2 customer (BCrypt), 10 destinations theo vùng Bắc-Trung-Nam, 12 tours, mỗi tour 2-3 prices + 2-3 images, 5 bookings mẫu.
6. Cho phép auto-migrate khi dev (ghi rõ trong `Program.cs`).

**Yêu cầu đạt:** `dotnet ef database update` xong, MySQL có đủ data, quan hệ đúng.
**Checklist test:**
- [ ] Migration apply không lỗi trên container fresh (xóa volume test lại)
- [ ] `tours` join `destinations/prices/images` ra đủ seed
- [ ] Xóa Tour đã có Booking bị chặn (Restrict), không cascade mất booking
- [ ] Index tạo đủ (check `SHOW INDEX`)
**Ghi chú:** `password` lưu `password_hash` BCrypt, không lưu plain. `image_url` VARCHAR(500), không lưu blob.

---

## B2. Auth + Users + Audit + Health (BE1)

**Công việc:**
1. `Helpers/JwtHelper` (access 15p, payload `sub,username,role`), `PasswordHasher` BCrypt.
2. Endpoints:
   - `POST /api/auth/register {username,email,password}` -> 201 role=Customer
   - `POST /api/auth/login {usernameOrEmail,password}` -> 200 `{ accessToken, refreshToken }`
   - `POST /api/auth/refresh {refreshToken}` -> xoay vòng: revoke cũ, cấp cặp mới
   - `POST /api/auth/logout {refreshToken}` -> revoke
   - `GET /api/auth/me` -> UserDto (auth required)
   - `GET /api/users?page&pageSize&search` (Admin, search username/email)
   - `PUT /api/users/{id}/role {role}`, `PUT /api/users/{id}/lock {locked}` (Admin)
   - `GET /api/audit-logs?entityType&entityId&page&pageSize` (Admin)
   - `GET /health` public `{ status, db, time }`
3. `RefreshToken` lưu **hash** trong DB, raw chỉ trả 1 lần. Secret từ `JWT_SECRET` env.
4. RBAC Default Deny: mọi controller mặc định `[Authorize]`, chỉ `register/login/refresh`, `GET /tours*`, `/health` là `[AllowAnonymous]`. `[Authorize(Roles="Admin")]` cho Users/Audit/POST-PUT-DELETE Tour.
5. `Services/AuditLogService`: ghi mọi `User.Lock/Unlock/Role, Price.Update, Booking.Status`.

**Yêu cầu đạt:** Login/refresh/logout vòng tròn kín, phân quyền đúng ma trận V4.
**Checklist test:**
- [ ] Register trùng username/email -> 409
- [ ] Login sai pass -> 401, đúng -> có 2 token
- [ ] Không token gọi `/me` -> 401; token hết hạn -> 401
- [ ] Customer gọi `GET /users` -> 403
- [ ] Admin tự khóa/tự hạ role chính mình -> 400 SELF_ACTION_DENIED
- [ ] Refresh dùng lại token cũ (đã xoay) -> 401 + revoke chuỗi
- [ ] Logout rồi refresh -> 401
- [ ] Mỗi lock/unlock có row `audit_logs`
**Ghi chú:** Không bao giờ trả `password_hash` ra JSON. Dùng DTO.

---

## B3. Destinations + Tours + Prices + Images (BE2)

**Công việc:**
1. `Services/DestinationService, TourService` + Controllers CRUD.
2. `GET /api/tours?search&destinationId&minPrice&maxPrice&page&pageSize&sort` -> `TourListDto { id, tourName, thumbnail, priceFrom, destination, status }`. `priceFrom` = min giá hiệu lực (`effective_date <= NOW` mới nhất mỗi source).
3. `GET /api/tours/{id}` -> `TourDetailDto` kèm `images` + `prices` hiệu lực.
4. `POST/PUT /api/tours` validate: `tour_name required max 200`, `destination_id tồn tại`, `max_seats >0`, `status enum`. Xóa = chuyển `Hidden` nếu đã có booking.
5. `GET /api/tours/{id}/prices`, `POST /api/tours/{id}/prices {source_name, price_value>0, effective_date}`, `PUT/DELETE /api/prices/{id}`.
6. `POST /api/tours/{id}/images {image_url valid URL, caption, sort_order}` (max 10/tour), `DELETE /api/images/{id}`.
7. Destinations CRUD (Admin viết, public đọc).

**Yêu cầu đạt:** Admin tạo tour + giá + ảnh xong hiển thị ngay ở public list.
**Checklist test:**
- [ ] `GET /tours` page/size/total đúng, search theo tên ra kết quả
- [ ] Filter `destinationId/minPrice/maxPrice` lọc đúng
- [ ] `POST /tours` thiếu tên / sai destination -> 400/422 rõ field
- [ ] `POST /prices` với `price_value<=0` -> 422; `effective_date` quá khứ xa -> 422
- [ ] Giá hiệu lực tính đúng (bản mới nhất <= NOW), `priceFrom` = min
- [ ] `POST /images` URL sai / quá 10 ảnh -> 422/400
- [ ] Customer POST tour -> 403
- [ ] Mọi update giá ghi `audit_logs`
**Ghi chú:** Query list dùng `AsNoTracking`, `Include` tối thiểu để đạt NFR. Không trả full prices trong list.

---

## B4. Booking + Checkout + Tracking state machine (BE2 chính, BE1 review)

**Công việc:**
1. `Services/BookingService, CheckoutService` — **1 transaction** cho `POST /api/bookings { tourId, quantity, paymentMethod }`:
   check Published + còn chỗ (`max_seats - SUM quantity active`) -> tạo Booking `PendingPayment` + trace -> tạo Checkout `Pending` (`amount = priceFrom*quantity`) -> mock payment -> cả 2 thành `Paid` -> commit.
2. `GET /api/bookings` (Admin all / Customer own, filter status, page), `GET /api/bookings/{id}` (own hoặc Admin), `GET /api/checkouts/{id}`.
3. `PUT /api/bookings/{id}/status {status, note}` theo ma trận chốt:
   `PendingPayment->Paid->Confirmed->Ongoing->Completed`, `*->Cancelled` (trừ cuối), `Paid-Failed->PendingPayment`. Sai -> 400 INVALID_STATUS_TRANSITION. Mỗi chuyển push `{status,at,by,note}` vào `tracking_trace` + audit.
4. `PUT /api/bookings/{id}/cancel` cho Customer (chỉ own + chưa Completed/Cancelled).

**Yêu cầu đạt:** End-to-end đặt -> trả tiền mock -> tracking đúng, không oversell.
**Checklist test:**
- [ ] Đặt tour hết chỗ -> 409 NOT_ENOUGH_SEATS, DB không tạo booking/checkout lẻ
- [ ] Đặt thành công -> 201 có cả booking(Paid) + checkout(Paid) + trace 2 mốc
- [ ] Tour Hidden/Draft không cho đặt -> 400
- [ ] `PUT status` sai thứ tự (Pending->Completed) -> 400
- [ ] Customer đổi status của người khác -> 403; Customer tự cancel own -> 200
- [ ] Admin cancel -> 200 + audit; booking Cancelled không chuyển tiếp được
- [ ] Concurrent 2 booking cùng lúc hết chỗ: 1 thành công, 1 báo 409 (test tay 2 Swagger)
**Ghi chú:** Transaction `Serializable` hoặc `FOR UPDATE` cho check chỗ. `amount` tính server-side, không tin client.

---

## B5. Cứng hóa + NFR + Docker final (cả 2)

**Công việc:**
1. Chuẩn hóa `Program.cs`: CORS cho FE, JSON camelCase, Swagger JWT Bearer, EF MySQL Pomelo, auto-migrate dev.
2. Chạy k6: script `GET /api/tours` 30 VUs ~1000 req/phút 2 phút, mục tiêu p95 <500ms. Nếu rớt: cắt `Include`, thêm cache memory destinations.
3. Rehearsal `docker compose up -d --build` từ volume trắng, cập nhật `docs/api.md` khớp code.
4. Chuẩn bị tài khoản demo + dữ liệu demo cho buổi chấm.

**Yêu cầu đạt:** Build Docker sạch chạy được, có ảnh k6 + ảnh 401/403/400/409 để dán báo cáo.
**Checklist test:**
- [ ] `docker compose up --build` từ đầu -> 3 Up, `/health` db=up, Swagger đủ endpoints mục 8 bản hoàn thiện
- [ ] k6 p95 <500ms (lưu ảnh/log)
- [ ] Full flow Swagger: register -> login -> đặt -> admin confirm -> tracking -> audit có log
- [ ] `.env` không commit, `.env.example` đủ biến
**Ghi chú:** Đóng băng thêm lib ở B5. Lỗi phát hiện thì fix, không thêm tính năng mới.
