# FRONTEND — Kết quả đã đạt (Ketquadatdat)

> Người làm điền sau mỗi bước F0-F5 trong `Cacbuoccanlam.md`. Ghi PASS/FAIL + evidence (ảnh UI / log build / link commit).
> Đồng bộ với `Cacbuoccanlam.md` bản 2026-09-07 (lần 2): BE đã xong toàn bộ B0-B5 (`docs/phan-cong/backend/api.md`) → FE đấu API thật toàn bộ từ F1, không mock (trừ nhánh checkout Failed + trạng thái lỗi/rỗng).

## Thông tin chung

* Người thực hiện FE: agent (skeleton) + bạn (F1 tiếp theo)
* Nhánh/commit: main, chưa commit/push (chờ bạn check thủ công)
* Ngày cập nhật: 2026-09-07 (BE xong hết B0-B5; F0 giữ PASS, F1-F5 đấu thật)
* BE đối chiếu: Health, Auth, Users, Audit (B2), Tours, Prices, Images, Destinations (B3), Bookings, Checkouts (B4), NFR + rehearsal (B5) — Swagger đủ 23 paths, k6 p95=68.79ms
* Tài khoản test API thật: `admin/Admin123!`, `customer1/Customer123!`, `customer2/Customer123!`

---

## F0. Nhận khung — PASS (giữ nguyên, không làm lại)

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| `frontend/travela-web/` (Vite + React 19 + TS + Router + Axios) | Tạo (template vanilla bị sai nên dựng React thủ công) | main.tsx/App.tsx + vite.config.ts proxy /api | ☑ |
| `src/types/index.ts` | Tạo | PagedResult/User/Destination/Tour/Booking/Checkout camelCase khớp DTO | ☑ |
| `src/services/api.ts, tourApi.ts, authApi.ts` | Tạo | baseURL /api + interceptor Bearer; tourApi fallback mock rỗng | ☑ |
| `src/routes/guards.tsx`, `src/lib/auth-store.ts` | Tạo | ProtectedRoute/RoleGuard skeleton (mock token localStorage) | ☑ |
| `src/components/layout/layouts.tsx`, `src/components/common/common.tsx` | Tạo | AppLayout/AdminLayout + Loading/Empty/Error/PageHeader | ☑ |
| `src/pages/pages.tsx, Login.tsx` | Tạo | Home/Tours/MyBookings/Admin/403/404 + Login mock | ☑ |
| `docker/frontend/Dockerfile + nginx.conf` | Tạo | node build -> nginx; proxy /api và /health sang backend:8080 | ☑ |
| `docs/design-system.md` | Tạo | Token màu/font/radius/spacing (F1 làm full shadcn) | ☑ |

### Kết quả test

| Checklist F0 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| dev + build sạch TS | PASS | `npm run build`: `tsc && vite build`, 88 modules, 0 lỗi | Chưa chạy `npm run dev` nền vì đã verify qua build + Nginx |
| Gọi /api được (mock/thật) | PASS | `localhost:3001/api/tours` 200 qua Nginx; FE HTML 200 | Khi BE chưa có data thì tourApi fallback mock rỗng |
| Types khớp BE | PASS (có nợ) | Types từ DTO contract, build tsc không lỗi `any` | Nợ: `User` thiếu `status`, `authApi` còn `loginMock` → chuyển sang F1b |

**Ghi chú:** shadcn/ui full để dành F1. FE Docker mở ở host 3001 (3000 bị chiếm). Nợ F0 đã liệt kê ở `Cacbuoccanlam.md` mục F0 (5 mục), không sửa F0 nữa.

---

## F1. Foundation + Auth thật — CHƯA (làm tiếp theo, ưu tiên cao nhất)

> F1a giữ kế hoạch cũ. F1b MỚI vì BE B2 xong: xóa `loginMock`, đấu `register/login/refresh/logout/me` thật.

### File đã tạo/sửa (dự kiến, bám `Cacbuoccanlam.md` F1)

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| `package.json`, `components/ui/*` | Sửa/tạo (F1a) | Cài/verify Tailwind + shadcn Button/Input/.../Toast + Lucide | ☐ |
| `src/index.css`, `docs/design-system.md` | Sửa/áp (F1a) | Inter, Primary #2563EB, BG #F8FAFC, Radius 4/6/8, Spacing 4-48; cấm gradient | ☐ |
| `src/components/layout/layouts.tsx` | Sửa (F1a) | AppLayout/AdminLayout/Header/Sidebar/PageContainer | ☐ |
| `src/components/common/common.tsx` | Sửa (F1a) | Thêm ConfirmDialog/Pagination/Toast dùng chung | ☐ |
| `src/types/index.ts` | Sửa (F1b) | Thêm `status` vào `User`; thêm `AuthResponse { accessToken, refreshToken, user }`, `ApiError { error, message }` | ☐ |
| `src/services/authApi.ts` | Sửa (F1b) | `register/login/refresh/logout/me` thật; xóa `loginMock`; lưu access+refresh+user localStorage | ☐ |
| `src/services/api.ts` | Sửa (F1b) | Giữ baseURL /api + Bearer; thêm interceptor 401 → refresh 1 lần → retry, fail → về /login | ☐ |
| `src/lib/auth-store.ts` | Sửa (F1b) | `getAccessToken/getRefreshToken/getUser/setSession/clearSession/isLoggedIn`, bỏ `role` rời | ☐ |
| `src/routes/guards.tsx` | Sửa (F1b) | ProtectedRoute → /login; RoleGuard Admin → /403; persist F5 bằng GET /me | ☐ |
| `src/pages/Login.tsx`, `src/pages/Register.tsx` | Sửa/tạo (F1b) | Form validate + toast theo mã BE + quay lại trang trước (`location.state.from`) | ☐ |
| `src/services/*mock tối thiểu*` | Tạo (F1a) | Chỉ mock nhánh checkout Failed + lỗi/rỗng (F2/F3 đấu thật) | ☐ |

### Kết quả test

| Checklist F1 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| `npm run dev` + `npm run build` sạch, không `any` tràn lan | | `npm run build` log ... | |
| Layout / và /admin đúng | | Ảnh ... | |
| Register trùng → 409 `DUPLICATE_USER`; login sai → 401 `INVALID_CREDENTIALS` | | Ảnh toast/log ... | Contract V1: refresh/logout body `{ refreshToken }` |
| Login đúng → vào `/my-bookings`; F5 giữ login; logout sạch | | ... | Seed admin/customer1 ở trên |
| Chưa login → /login; Customer vào /admin → 403, không lộ data | | Ảnh ... | |
| Hết access tự refresh 1 lần; refresh hết/reuse cũ → văng login | | Log network ... | BE revoke cả chuỗi khi reuse |
| Toast/Loading/Empty/Error + build Nginx không vỡ CSS | | Ảnh/build log ... | |

**Ghi chú:** Role FE chỉ là UX, bảo mật do BE `[Authorize]`. Token V1 localStorage + ghi rủi ro XSS vào báo cáo (cookie HttpOnly để V2).

---

## F2. Public pages — CHƯA (đấu thật toàn bộ vì B3/B4 xong)

### File đã tạo/sửa (dự kiến)

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| `src/pages/* (Home, TourList, TourDetail mở rộng từ pages.tsx)` | Sửa/tạo | Hero + tour nổi bật + destinations (thật) | ☐ |
| `src/pages/Tours, Destinations, Booking, Checkout, MyBookings, Profile?` | Tạo | Search/filter/sort/pagination thật; form quantity; timeline thật | ☐ |
| `src/services/tourApi.ts, bookingApi.ts, destinationApi.ts` | Sửa/tạo (thật) | Query `page,pageSize,search,destinationId,minPrice,maxPrice,sort` | ☐ |

### Kết quả test

| Checklist F2 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Search/filter/page giữ filter (thật) | | | Query đúng Phụ lục B, pageSize 12/max 50 |
| Tour hết chỗ/Hidden chặn đặt | | | Đối chiếu Swagger |
| Validation quantity + toast 409 | | | FE chặn trước, BE `NOT_ENOUGH_SEATS` sau |
| Checkout Paid timeline; Failed mock | | | Mock payment V1 luôn Paid |
| Chưa login -> login -> quay lại | | | Nhờ F1b `location.state.from` |
| Empty/Error đúng component | | | Search không ra + tắt backend |

**Ghi chú:** Giá = `priceFrom` BE trả, không tự tính. Enum đúng Phụ lục B (`Draft/Published/Hidden`, `PendingPayment...Cancelled`).

---

## F3. Admin pages — CHƯA (đấu thật toàn bộ vì B2+B3+B4 xong)

### File đã tạo/sửa (dự kiến)

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| `src/pages/admin/Dashboard` | Tạo | Cards tổng tour/booking/users/doanh thu + bảng mới nhất (thật) | ☐ |
| `src/services/userApi.ts` | Tạo (đấu thật) | `list({page,pageSize,search})`, `updateRole(id,{role})`, `updateLock(id,{locked})` | ☐ |
| `src/pages/admin/Users` | Tạo (đấu thật) | Table + search + pagination + lock/unlock + đổi role; disable tự khóa + toast 400 `SELF_ACTION_DENIED` | ☐ |
| `src/pages/admin/Tours, Destinations` | Tạo (đấu thật) | CRUD Dialog, edit gộp tab Prices+Images; validate trùng BE | ☐ |
| `src/pages/admin/Bookings` | Tạo (đấu thật) | Filter status + đổi status đúng state machine + trace + audit `GET /audit-logs?entityType&entityId` | ☐ |

### Kết quả test

| Checklist F3 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Users search/lock/role thật, chặn tự khóa | | Log + ảnh ... | Test bằng seed admin |
| Customer vào admin -> 403 | | | Kế thừa F1b |
| CRUD tour/prices/images thật | | | Đổi giá xong list cập nhật ngay |
| Đổi status sai -> toast đẹp `INVALID_STATUS_TRANSITION` | | | Không crash |
| Pagination giữ filter | | | |

**Ghi chú:** Dùng chung `Table + Pagination + ConfirmDialog`. Audit role/lock đã có BE, gắn view nếu còn giờ.

---

## F4. Hoàn thiện luồng — CHƯA (mỏng: F2/F3 đã đấu thật, chỉ chuẩn hóa + E2E)

### File đã tạo/sửa (dự kiến)

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| Xóa mock sót (giữ mock Failed + lỗi/rỗng) | Sửa | Không sửa component | ☐ |
| `src/services/api.ts + common Toast` | Sửa | Chuẩn hóa toast Phụ lục C, không stack trace | ☐ |
| Audit view + health check | Tạo/sửa | `GET /audit-logs` lịch sử giá/status/role/lock; `/health db:up` ở footer/admin | ☐ |

### Kết quả test

| Checklist F4 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Toast đúng mã BE, không stack trace | | | |
| E2E đặt -> duyệt -> tracking | | bookingId=... | BE B4 xong, làm được ngay |
| F5 giữ login; refresh hết mới văng (re-test F1b) | | | |

**Ghi chú:** Đổi contract phải sửa đồng thời `docs/api.md` + DTO BE + Types FE.

---

## F5. Polish + Demo — CHƯA

### File đã tạo/sửa (dự kiến)

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| Fix responsive/CSS | Sửa | Mobile/tablet/desktop, bảng admin scroll ngang, rà design-system | ☐ |

### Kết quả test

| Checklist F5 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Không error console, build sạch | | `npm run build` + console log ... | |
| Mobile không vỡ | | Ảnh ... | |
| Docker fresh demo mượt | | Video/ảnh ... | `docker compose up -d --build`, demo `localhost:3001` |

**Ghi chú:** Đóng băng tính năng ở F5, chỉ fix bug.
