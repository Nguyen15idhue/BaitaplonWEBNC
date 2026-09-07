# FRONTEND — Kết quả đã đạt (Ketquadatdat)

> Người làm điền sau mỗi bước F0-F5 trong `Cacbuoccanlam.md`. Ghi PASS/FAIL + evidence (ảnh UI / log build / link commit).
> Đồng bộ với `Cacbuoccanlam.md` bản 2026-09-07 (lần 2): BE đã xong toàn bộ B0-B5 (`docs/phan-cong/backend/api.md`) → FE đấu API thật toàn bộ từ F1, không mock (trừ nhánh checkout Failed + trạng thái lỗi/rỗng).

## Thông tin chung

* Người thực hiện FE: agent (skeleton) + agent (F1 foundation + auth thật) + agent (F2 public pages) + agent (F3 admin)
* Nhánh/commit: main, chưa commit/push F3 (chờ bạn check thủ công)
* Ngày cập nhật: 2026-09-07 (F3 xong code + build + API; thao tác chờ click tay)
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

## F1. Foundation + Auth thật — XONG (code + build + API, chờ click tay visual)

> F1a giữ kế hoạch cũ. F1b đấu `register/login/refresh/logout/me` thật, xóa `loginMock`.

### File đã tạo/sửa (bám `Cacbuoccanlam.md` F1)

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| `package.json`, `vite.config.ts` | Sửa (F1a) | Thêm tailwindcss + @tailwindcss/vite + lucide-react + clsx + tailwind-merge; plugin tailwind | ☑ |
| `src/index.css` | Sửa (F1a) | `@import tailwindcss` + giữ token Inter/Primary/BG/Text/Muted/Border | ☑ |
| `src/lib/utils.ts` | Tạo (F1a) | `cn()` dùng chung ui | ☑ |
| `src/components/ui/*` | Tạo (F1a) | button, fields (Input/Textarea/Select/Checkbox/FieldError), card (Card/Badge), dialog, table (Table/Pagination), toast (ToastProvider/useToast/toastForApiError), tabs — style shadcn, token chốt, không Radix | ☑ |
| `src/components/layout/layouts.tsx` | Sửa (F1a) | Header (nav + user/logout) + Sidebar + PageContainer, Tailwind | ☑ |
| `src/components/common/common.tsx` | Sửa (F1a) | Thêm ConfirmDialog, Pagination; style Tailwind | ☑ |
| `src/types/index.ts` | Sửa (F1b) | Thêm `status` vào `User`; thêm `AuthResponse`, `ApiError` | ☑ |
| `src/services/authApi.ts` | Sửa (F1b) | `register/login/refresh/logout/me` thật; xóa `loginMock` | ☑ |
| `src/services/api.ts` | Sửa (F1b) | Bearer + interceptor 401 → refresh 1 lần → retry, fail → về /login | ☑ |
| `src/lib/auth-store.ts` | Sửa (F1b) | Session access+refresh+user, bỏ `role` rời | ☑ |
| `src/lib/auth-context.tsx` | Tạo (F1b) | AuthProvider + useAuth, persist F5 bằng GET /me | ☑ |
| `src/routes/guards.tsx` | Sửa (F1b) | Dùng context + loading; from-state khi đá về login | ☑ |
| `src/pages/Login.tsx`, `src/pages/Register.tsx` | Sửa/tạo (F1b) | Form validate + toast mã BE + quay lại trang trước | ☑ |
| `src/App.tsx` | Sửa (F1b) | ToastProvider + AuthProvider + route /register | ☑ |

### Kết quả test

| Checklist F1 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| `npm run dev` + `npm run build` sạch, không `any` tràn lan | PASS | `tsc && vite build` 1917 modules 0 lỗi; grep `: any` = 0 file; dev 5174 các route 200 | 5173 bị process cũ giữ nên dev chạy 5174 |
| Layout / và /admin đúng | PASS (code) | Sidebar/Header/PageContainer Tailwind đúng token; dev `/admin` serve shell, RoleGuard client-side | Chờ click tay chụp layout |
| Register trùng → 409 `DUPLICATE_USER`; login sai → 401 `INVALID_CREDENTIALS` | PASS | Đúng payload FE: 409 + 401; toastForApiError hiện message BE | — |
| Login đúng → vào `/my-bookings`; F5 giữ login; logout sạch | PASS (code+API) | login→user Admin, me 200, refresh 200, logout→refresh 401; context + persist me | Chờ click tay login/F5/logout |
| Chưa login → /login; Customer vào /admin → 403, không lộ data | PASS (code) | Guards dùng user.role từ me, from-state, /403 | Chờ click tay |
| Hết access tự refresh 1 lần; refresh hết/reuse cũ → văng login | PASS (code+API) | Interceptor `_retry` + trần axios; BE revoke chuỗi đã verify B2 | Chờ click tay xóa access test |
| Toast/Loading/Empty/Error + build Nginx không vỡ CSS | PASS | ToastProvider + common đủ; Docker rebuild: `/`, `/login`, `/api/tours` 200, CSS 13.68 kB trong bundle | Chờ click tay xem toast visual |

**Ghi chú:** ui theo pattern shadcn thủ công (chưa chạy CLI, không Radix) đúng token — đủ chuẩn agents.md. Token V1 localStorage + rủi ro XSS ghi báo cáo (cookie HttpOnly để V2).

---

## F2. Public pages — XONG (đấu thật, chờ click tay luồng đặt)

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| `src/services/tourApi.ts` | Sửa (thật) | getTours đủ query Phụ lục B, getTourDetail, getTourPrices; bỏ fallback mock | ☑ |
| `src/services/destinationApi.ts, bookingApi.ts` | Tạo (thật) | list/get destinations; create/my-bookings/detail/cancel/checkout | ☑ |
| `src/types/index.ts` | Sửa | TourDetail + TourImage/TourPrice; Booking đủ tourName/username/checkout | ☑ |
| `src/lib/format.ts` | Tạo | formatVND + bookingTone dùng chung | ☑ |
| `src/components/common/TourCard.tsx` | Tạo | Card tour dùng chung Home + TourList | ☑ |
| `src/pages/Home/TourList/TourDetail/Destinations` | Tạo | Hero + featured + vùng; filter/search/sort/page; gallery + bảng giá + nút Đặt | ☑ |
| `src/pages/Booking/Checkout/MyBookings/Profile` | Tạo | Form quantity + amount live; 2 card checkout; filter + timeline Dialog + hủy Confirm; Profile từ /me (chỉ xem, BE chưa có sửa own) | ☑ |
| `src/pages/pages.tsx`, `src/App.tsx` | Sửa | Chỉ giữ Forbidden/NotFound + Admin placeholder F3; thêm 8 routes (booking/checkout/my-bookings/profile protected) | ☑ |
| `src/components/layout/layouts.tsx` | Sửa | Thêm link Điểm đến vào nav | ☑ |

### Kết quả test

| Checklist F2 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Build sạch | PASS | `tsc && vite build` 1929 modules 0 lỗi (fix 3 lỗi: import trùng, path types, null trong closure) | — |
| Routes serve | PASS | dev 10/10 routes 200 (/, /tours, /tours/2, /destinations, /booking/2, /checkout/1, /my-bookings, /profile, /login, /register) | Guard chạy client-side |
| Search/filter/page giữ filter (thật) | PASS | list total 10, search 1, filter+sort 1, Pagination giữ state | Query đúng Phụ lục B |
| Tour hết chỗ/Hidden chặn đặt | PASS (code+API) | detail 404 → ErrorState; đặt Hidden/Draft BE 400 đã verify B4 | Chờ click tay |
| Validation quantity + toast 409 | PASS (code+API) | FE chặn qty≤0; oversell 409; toastForApiError | Chờ click tay đặt thật |
| Checkout Paid timeline; Failed mock | PASS (code+API) | book 201 Paid amount đúng, tracking 2 mốc; Failed không live được | Đúng V1 |
| Chưa login -> login -> quay lại | PASS (code) | ProtectedRoute from-state (F1b) | Chờ click tay |
| Empty/Error đúng component | PASS | search rác total 0 → EmptyState; tour 999 → 404 ErrorState | Chưa test tắt backend |

**Ghi chú:** Booking test (tour 8) + audit đã dọn, DB về seed 5/5. Chưa push git.

---

## F3. Admin pages — XONG (đấu thật, chờ click tay thao tác)

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| `src/services/userApi.ts, auditApi.ts` | Tạo (thật) | Users search/role/lock; audit theo entity | ☑ |
| `src/services/tourApi.ts, destinationApi.ts, bookingApi.ts` | Sửa (thêm hàm admin) | CRUD tour/giá/ảnh, destinations, bookings status; `adminListTours` qua `/tours/all` | ☑ |
| `src/pages/admin/Dashboard/Users/Tours/Destinations/Bookings` | Tạo (thật) | Cards + bảng mới nhất; table search/lock/role + chặn tự khóa; CRUD tab Giá/Ảnh; CRUD vùng; filter + đổi status + trace + audit | ☑ |
| `src/App.tsx`, `src/pages/pages.tsx` | Sửa | 5 routes /admin/*; xóa Admin placeholder | ☑ |
| BE `ToursController` + `TourService` | Sửa (lấp thiếu) | Thêm `GET /tours/all` Admin + detail cho Admin xem Draft/Hidden; ListAsync thêm filter status | ☑ |

### Kết quả test

| Checklist F3 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Users search/lock/role thật, chặn tự khóa | PASS | search total 3; lock/unlock c2 200; tự khóa + tự hạ quyền 400 | Disable nút row chính mình ở UI |
| Customer vào admin -> 403 | PASS (code) | RoleGuard kế thừa F1b | Chờ click tay |
| CRUD tour/prices/images thật | PASS | create 201 → update → add giá/ảnh 201 → delete cứng; validation 400/422 | Dữ liệu test đã dọn |
| Đổi status sai -> toast đẹp `INVALID_STATUS_TRANSITION` | PASS (code+API) | BE 400 đã verify; UI chỉ liệt kê bước kế hợp lệ + toast lỗi | Chờ click tay |
| Pagination giữ filter | PASS (code) | load(p, search/status) giữ filter | Chờ click tay |
| Admin xem Draft/Hidden + audit view | PASS | `/tours/all` admin total 12, customer 403; audit Booking 2 rows | Endpoint BE bổ sung cho F3 |

**Ghi chú:** Dọn sạch booking/tour/destination/audit test, DB về seed. Chưa push git.

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
