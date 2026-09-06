# KẾ HOẠCH HOÀN THIỆN BÀI TẬP LỚN — TRAVELA (Web NC)

> Nguồn: `Tài liệu Phân tích Thiết kế Travela - V4.docx` + `Kế hoạch sơ bộ thực hiện web NC.docx`
> Đã vá các lỗ hổng a, b, c, d, e, f. Mục h: 1 người setup khung Docker + shadcn/ui từ đầu nên giữ nguyên làm sớm.

---

## 1. Chốt công nghệ (không thay đổi thêm)

| Thành phần | Chọn | Ghi chú |
|---|---|---|
| Backend | ASP.NET Core Web API (.NET 10 LTS) | Multi-stage Docker `sdk` build, `aspnet` runtime |
| ORM / Migration | EF Core + Pomelo.EntityFrameworkCore.MySql | `dotnet ef migrations add / database update`, cho phép auto-migrate khi dev |
| DB | MySQL 8.4 | Volume `mysql_data`, không mất data khi xóa container |
| Auth | JWT access ngắn + Refresh Token xoay vòng | Stateless, scale-out được |
| Authorization | RBAC + Default Deny | `Admin`, `Customer` |
| Frontend | React + TypeScript + Vite + Tailwind + shadcn/ui + Lucide + React Router | Axios service layer, không `fetch` rải rác |
| API | REST + Swagger | Contract-first, DTO mọi response |
| Container | Docker + Docker Compose | 3 services: `frontend:3000->80`, `backend:5000->8080`, `mysql:3306` |
| Khác | Pagination, Index, AuditLog, `/health` | Đủ BTL |
| Không dùng | Redis, Kafka/RabbitMQ, GraphQL, CQRS/MediatR, Microservice, K8s | Tránh phình scope |

Cấu trúc repo chốt ngay từ ngày 1:

```text
Travela/
├── backend/Travela.Api/
│   ├── Controllers/ (Auth, Tours, Destinations, Prices, Bookings, Users, AuditLogs, Health)
│   ├── Models/ (User, Destination, Tour, Price, Image, Booking, Checkout, AuditLog, RefreshToken)
│   ├── DTOs/ (Auth/, Tour/, Booking/, User/, Common/PagedResult)
│   ├── Services/ (Auth, Tour, Destination, Booking, Checkout, User, AuditLog + interfaces)
│   ├── Data/TravelaDbContext.cs
│   ├── Middleware/ (Exception, Audit)
│   ├── Migrations/
│   ├── Helpers/ (JwtHelper, PasswordHasher BCrypt, PaginationHelper)
│   ├── Program.cs / appsettings.json
├── frontend/travela-web/
│   └── src/ (components/ui,layout,common | features | pages | services | hooks | lib | types | routes | styles)
├── docker/backend/Dockerfile
├── docker/frontend/Dockerfile + nginx.conf
├── docker-compose.yml / .env(.example) / .gitignore / README.md
└── docs/ (architecture.md, api.md, design-system.md)
```

Người setup khung làm trước: `dotnet new webapi`, `npm create vite@latest`, Tailwind + shadcn init, 2 Dockerfile, `docker-compose.yml`, `.env.example`, `.gitignore`, chạy `docker compose up --build` lên 3 container xanh.

---

## 2. Database — thêm RefreshToken, chốt AuditLog

### 2.1. Bảng (theo V4 + bổ sung)

* `users(id PK, username unique, email unique, password_hash BCrypt, role [Admin|Customer], status [Active|Locked], created_at)` — Index `username, email`.
* `destinations(id PK, name, region_name [Bắc|Trung|Nam], description)` — seed sẵn ~10 điểm.
* `tours(id PK, destination_id FK -> destinations, tour_name indexed, description, max_seats, status [Draft|Published|Hidden], created_at)` — Index `tour_name, destination_id, status`.
* `prices(id PK, tour_id FK, source_name, price_value DECIMAL >0, effective_date, created_at)` — Index `tour_id, effective_date`. Mỗi tour có N giá đa nguồn, giá hiệu lực = bản ghi `effective_date <= NOW` mới nhất theo từng source; giá hiển thị = min trong các giá hiệu lực.
* `images(id PK, tour_id FK, image_url VARCHAR(500), caption, sort_order)` — Index `tour_id`.
* `bookings(id PK, user_id FK, tour_id FK, booking_date, quantity, status, tracking_trace JSON, created_at)` — Index `user_id, tour_id, status`. `quantity` bắt buộc để trừ chỗ.
* `checkouts(id PK, booking_id FK UNIQUE 1-1, payment_method [Mock/Card/Transfer], amount DECIMAL, status [Pending|Paid|Failed], transaction_ref, created_at)`.
* `audit_logs(id PK, actor_id FK nullable, action [User.Lock|User.Unlock|Tour.Update|Price.Update|Booking.Status], entity_type, entity_id, old_value JSON nullable, new_value JSON nullable, created_at)` — Index `entity_type+entity_id, created_at`.
* `refresh_tokens(id PK, user_id FK, token_hash unique, expires_at, revoked_at nullable, replaced_by nullable)` — Index `token_hash, user_id`. Phục vụ ADR consequence.

Quan hệ: `Users 1-N Bookings, Users 1-N RefreshTokens, Destinations 1-N Tours, Tours 1-N Prices/Images/Bookings, Bookings 1-1 Checkouts`.

### 2.2. Quy ước

* Mọi FK `DeleteBehavior.Restrict` (không xóa cascade Tour đã có Booking).
* Xóa Tour = chuyển `Hidden`, không xóa cứng nếu đã có Booking.
* Seed: 3 user (`admin/admin123`, 2 customer), 10 destinations, 12 tours, mỗi tour 2-3 prices + 2-3 images, 5 bookings mẫu.

---

## 3. (a) State Machine Tracking — chốt cứng

Trạng thái `Booking.status`:

```text
PendingPayment -> Paid -> Confirmed -> Ongoing -> Completed
     |              |          |           |
     +--> Cancelled <---------+-----------+  (Cancelled là trạng thái cuối)
     Paid --Failed--> PendingPayment (thanh toán mock thất bại cho retry)
```

| Chuyển | Ai | Điều kiện |
|---|---|---|
| `PendingPayment -> Paid` | Hệ thống (sau mock payment OK) | `Checkout.status=Paid` |
| `PendingPayment -> Cancelled` | Customer (own) / Admin | Chưa quá 24h hoặc Admin luôn được |
| `Paid -> Confirmed` | Admin | Mặc định sau khi rà soát |
| `Confirmed -> Ongoing` | Admin | Đến ngày khởi hành |
| `Ongoing -> Completed` | Admin | Kết thúc tour |
| Bất kỳ (trừ Completed/Cancelled) `-> Cancelled` | Admin | Ghi lý do vào trace |

* Backend validate ma trận chuyển, sai -> `400 { "error": "INVALID_STATUS_TRANSITION" }`.
* Mỗi lần chuyển: push vào `tracking_trace` JSON: `[{status, at, by, note}]` + ghi `audit_logs`.
* `PUT /api/bookings/{id}/status` body: `{ "status": "Confirmed", "note": "..." }`.

---

## 4. (b) Booking + Checkout — 1 transaction (sửa mâu thuẫn cũ)

Không còn `POST /api/checkouts` rời rạc cho flow chính.

```text
POST /api/bookings { tourId, quantity, paymentMethod }
 ↓ BookingsController -> BookingService (EF transaction)
 1. Check Tour Published + Prices hiệu lực + còn chỗ (max_seats - SUM(quantity active))
 2. Tạo Booking status=PendingPayment + tracking_trace[PendingPayment]
 3. Tạo Checkout status=Pending amount = price_hienthi * quantity
 4. Mock payment (luôn Paid trừ khi amount<=0 hoặc test Failed)
 5. Booking -> Paid, Checkout -> Paid, trace += Paid
 6. Commit. Fail ở đâu rollback hết.
 ↓ 201 { booking, checkout, tracking }
```

* `GET /api/checkouts/{id}` giữ lại để tra cứu. Không cho client tự tạo checkout lẻ (trừ test).
* Chống oversell: check chỗ trong transaction với `IsolationLevel.Serializable` hoặc `SELECT ... FOR UPDATE` qua Pomelo; hết chỗ -> `409 { "error": "NOT_ENOUGH_SEATS" }`.

---

## 5. (c) Validation + AC cho UC3/UC4 + AuditLog API

### UC3 — Quản lý User (Admin only)

* `GET /api/users?page&size&search` (search theo username/email, pagination).
* `PUT /api/users/{id}/role {role}`, `PUT /api/users/{id}/lock {locked:true|false}`.
* AC: tự khóa/tự hạ role chính mình -> `400 SELF_ACTION_DENIED`. Khóa user đã có booking active vẫn cho khóa (không cho login mới) + audit.
* Mọi thao tác ghi `audit_logs`.

### UC4 — Tour + Giá đa nguồn + Ảnh

* `POST/PUT /api/tours` validate: `tour_name required max 200`, `destination_id tồn tại`, `max_seats >0`, `status enum`.
* `POST /api/tours/{id}/prices {source_name, price_value>0, effective_date}` — sai -> `422` chỉ rõ field. `effective_date` không được quá khứ quá 1 ngày (trừ seed).
* `POST /api/tours/{id}/images` — xem mục 7.
* `PUT/DELETE /api/prices/{id}` + audit `Price.Update`.
* `GET /api/tours?search&destinationId&minPrice&maxPrice&page&size&sort` — response `PagedResult<TourListDto>` gồm `priceFrom` (min giá hiệu lực), `thumbnail`.

### AuditLog API

* `GET /api/audit-logs?entityType&entityId&page&size` (Admin only). Dùng để demo truy vết đổi giá / đổi trạng thái.

---

## 6. (d) Auth + RBAC Default Deny — đầy đủ Refresh

### Endpoints

```text
POST /api/auth/register {username,email,password} -> 201 (role=Customer, BCrypt hash)
POST /api/auth/login {usernameOrEmail,password} -> 200 { accessToken(15p), refreshToken(7d) }
POST /api/auth/refresh {refreshToken} -> xoay vòng: revoke cũ, cấp cặp mới
POST /api/auth/logout {refreshToken} -> revoke
GET  /api/auth/me -> 200 UserDto (cần accessToken)
```

* Access JWT payload: `sub, username, role, exp 15p`. Secret từ `JWT_SECRET` trong `.env`, không commit.
* RefreshToken lưu **hash** trong DB, gửi client bản raw 1 lần. Cookie `HttpOnly Secure SameSite=Lax` nếu cùng site qua Nginx proxy, fallback `localStorage` + ghi rõ rủi ro XSS trong báo cáo.
* Frontend: axios interceptor tự gắn `Authorization: Bearer`, tự gọi `/refresh` khi `401` một lần, logout khi refresh cũng hết hạn. `ProtectedRoute` + `RoleGuard(Admin)`.

### RBAC ma trận (Default Deny: không gắn `[AllowAnonymous]` là 401)

|  | Tours | Bookings | Users | Audit/Health |
|---|---|---|---|---|
| Admin | CRUD | Read all + Update status | CRUD + lock/unlock | Read audit + health |
| Customer | Read published | Create + Read own + Cancel own | Read/Update own | health public |
| Anonymous | Read published | — | register/login | health public |

* Test bắt buộc: không token -> `401`, token hết hạn -> `401`, Customer gọi Admin API -> `403`, Admin tự khóa -> `400`.

---

## 7. (f) Ảnh + Threat Model + Health

### Ảnh (chốt để tránh bottleneck)

* V1 BTL: **không upload binary lên MySQL**. `image_url` là `VARCHAR(500)`: nhập URL ngoài hoặc file tĩnh trong `frontend/public` / `backend/wwwroot/uploads` mount volume. `POST /images` chỉ validate URL + `sort_order`, giới hạn 10 ảnh/tour.
* Ghi trong báo cáo: V2 dùng S3/CDN khi traffic lớn (đúng giới hạn V4 đã nêu).

### Threat Model tối thiểu

* Broken Access Control -> Default Deny + test 401/403 trên mọi controller.
* Token theft -> access 15p + refresh xoay vòng + revoke khi logout.
* SQLi/XSS -> EF parameterized + DTO, React escape mặc định, validate mọi input, BCrypt password.
* Oversell -> transaction + 409.

### Health

* `GET /health` public trả `{ status, db: "up", time }`. Dùng cho `docker compose ps` + kiểm tra DB connected khi demo.

---

## 8. API Contract đầy đủ (contract-first, viết `docs/api.md` trước code)

```text
Auth:        POST /api/auth/register, POST /api/auth/login, POST /api/auth/refresh, POST /api/auth/logout, GET /api/auth/me
Destinations:GET /api/destinations, GET /api/destinations/{id}, POST/PUT/DELETE /api/destinations (Admin)
Tours:       GET /api/tours (public, filter+page), GET /api/tours/{id} (kèm images+prices hiệu lực), POST/PUT/DELETE /api/tours (Admin)
Prices:      GET /api/tours/{id}/prices, POST /api/tours/{id}/prices, PUT/DELETE /api/prices/{id} (Admin)
Images:      POST /api/tours/{id}/images, DELETE /api/images/{id} (Admin)
Bookings:    POST /api/bookings (Customer), GET /api/bookings (Admin all / Customer own), GET /api/bookings/{id} (own hoặc Admin), PUT /api/bookings/{id}/status (Admin + Customer cancel own), PUT /api/bookings/{id}/cancel
Checkouts:   GET /api/checkouts/{id} (own/Admin)
Users:       GET /api/users, PUT /api/users/{id}/role, PUT /api/users/{id}/lock (Admin)
Audit:       GET /api/audit-logs (Admin)
Health:      GET /health (public)
```

Mọi list trả `PagedResult { items, page, pageSize, total }`. Lỗi chuẩn `{ error: CODE, message }`.

---

## 9. Frontend — giữ shadcn làm sớm

* Setup: Vite React-TS, Tailwind, shadcn/ui (`Button, Input, Textarea, Select, Checkbox, Dialog, Dropdown, Badge, Card, Table, Pagination, Tabs, Toast`), Lucide.
* `docs/design-system.md`: Font Inter, Primary `#2563EB`, BG `#F8FAFC`, Text `#0F172A`, Muted `#64748B`, Border `#E2E8F0`, Radius 4/6/8, Spacing 4/8/12/16/24/32/48. Cấm gradient/glassmorphism/màu-radius-spacing ngẫu nhiên.
* Cấu trúc `src`: `components/ui|layout(AppLayout,AdminLayout,Header,Sidebar,PageContainer)|common(Loading,EmptyState,ErrorState,ConfirmDialog,PageHeader)`, `features(auth,tours,destinations,bookings,checkout,users)`, `pages`, `services(api.ts,authApi,tourApi,bookingApi,destinationApi,userApi)`, `types`, `routes(ProtectedRoute,RoleGuard)`, `hooks,lib,styles`.
* Pages: Public `/, /tours, /tours/:id, /destinations, /booking/:tourId, /checkout/:bookingId, /my-bookings, /profile`; Admin `/admin, /admin/users, /admin/tours, /admin/destinations, /admin/bookings` (gộp prices vào Tour edit, không làm `/admin/prices` riêng để tiết kiệm giờ).
* Service layer + types `User, Tour{priceFrom,thumbnail}, Destination, Booking{tracking}, Checkout` để TS bắt lỗi.

---

## 10. Docker — làm ngày 1 (người setup khung)

* `docker/backend/Dockerfile` multi-stage `sdk:10.0 -> aspnet:10.0`, `EXPOSE 8080`, `ENTRYPOINT dotnet Travela.Api.dll`.
* `docker/frontend/Dockerfile` `node:22-alpine build -> nginx:alpine`, copy `dist` + `nginx.conf` proxy `/api/* -> http://backend:8080`.
* `docker-compose.yml`: `mysql:8.4` + `mysql_data`, backend `Server=mysql`, frontend `:3000->80`, backend `:5000->8080`. `.env` + `.env.example` (`MYSQL_*, JWT_SECRET`), `.gitignore` (`node_modules, dist, bin, obj, .env`).
* Hiểu đúng: trong container dùng `Server=mysql`; ngoài browser gọi `http://localhost:5000/api/...` hoặc `/api/...` qua Nginx, không gọi `http://backend:8080` từ browser.
* Lệnh chuẩn: `docker compose up --build`, check `docker compose ps` 3 Up, `logs backend/mysql`, mở `localhost:3000`, `localhost:5000/swagger`, `localhost:3306`.

---

## 11. (e) NFR + kiểm thử

* NFR01 `GET /api/tours <500ms @1000 req/phút`: đã có pagination (default 12, max 50) + index. Test bằng `k6` script 30 VUs ~1000 req/phút chạy 2 phút trước buổi demo, chụp kết quả `p95 <500ms` dán vào báo cáo. Nếu rớt: giảm `Include` (chỉ lấy thumbnail + priceFrom, detail mới lấy full), thêm `AsNoTracking`, cache memory cho destinations.
* Test chức năng: Swagger + checklist `[401 không token, 403 sai role, 400 tự khóa, 422 giá sai, 409 hết chỗ, 400 chuyển trạng thái sai]`.
* Responsive + validation FE/BE trùng nhau.

---

## 12. Lộ trình 8 Milestones (làm cuốn chiếu, không waterfall)

1. **M1 Khung:** 3 container Up + Swagger + Nginx. Done: mở được 2 URL.
2. **M2 DB:** Entity + DbContext + Migration + Seed + Index. Done: MySQL có data mẫu.
3. **M3 Thông luồng:** `GET /tours -> Tour List`. Done: FE gọi BE thật.
4. **M4 Auth/RBAC:** login JWT + refresh + guards Admin/Customer. Done: 401/403 đúng.
5. **M5 Admin Tour:** CRUD Tour + Destination + Prices + Images. Done: tạo tour hiển thị ngay.
6. **M6 Customer:** Detail -> Booking -> Checkout mock -> My Bookings. Done: 1 booking end-to-end (điểm chính).
7. **M7 Tracking:** Admin đổi status + Customer xem trace timeline + audit. Done: flow quan trọng nhất của đề.
8. **M8 Hoàn thiện:** pagination/search/validation/audit/health/responsive + k6 + `docker compose up -d --build` rehearsal.

Checklist 9 phase gốc giữ nguyên để tick (Project/Structure/Docker/Database/Backend/FE-foundation/FE/Integration/Final).

---

## 13. Gợi ý phân công 3 người (đổi tên tùy)

* **Bạn (khung + BE nền):** Docker, DbContext, Auth/refresh, Health, API Contract.
* **Nguyễn Hải Anh (BE nghiệp vụ):** Tours/Prices/Images/Destinations + Booking transaction + Users lock + Audit.
* **Đỗ Thanh Thảo (FE):** design-system + layout + public pages + admin pages + interceptor/guards.
* Cuối mỗi milestone merge + `docker compose up --build` chung 1 lần.

---

## 14. Definition of Done khi nộp

* [ ] `docker compose up -d --build` chạy 3 container, demo được full flow Customer đặt -> Admin confirm -> Customer tracking.
* [ ] Swagger đủ endpoints mục 8, `docs/api.md` khớp code.
* [ ] Ảnh k6 p95, ảnh 401/403/400/409, video demo <5p.
* [ ] README: cách chạy Docker + local, tài khoản demo admin/customer, state diagram.

> File này là bản chốt. Code theo đúng thứ tự M1->M8, việc nào vướng state/auth thì quay lại mục 3/4/6, không tự đẻ thêm công nghệ.
