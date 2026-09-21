# FRONTEND — Kết quả đã đạt (Ketquadatdat)

> Người làm điền sau mỗi bước F0-F5 trong `Cacbuoccanlam.md`. Ghi PASS/FAIL + evidence (ảnh UI / log build / link commit).
> Đồng bộ với `Cacbuoccanlam.md` bản 2026-09-07 (lần 2): BE đã xong toàn bộ B0-B5 (`docs/phan-cong/backend/api.md`) → FE đấu API thật toàn bộ từ F1, không mock (trừ nhánh checkout Failed + trạng thái lỗi/rỗng).

## Thông tin chung

* Người thực hiện FE: agent (skeleton) + agent (F1 foundation + auth thật) + agent (F2 public pages) + agent (F3 admin) + agent (F4 hoàn thiện) + agent (F4.1 UI/UX) + agent (F5 rehearsal)
* Nhánh/commit: main, chưa commit/push F5 docs (chờ bạn check thủ công)
* Ngày cập nhật: 2026-09-07 (F5 xong; FE hoàn tất F0-F5)
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

## F4. Hoàn thiện luồng — XONG (audit page + footer health + E2E, chờ click tay)

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| Rà mock + toast | Kiểm tra | Chỉ còn `paymentMethod: "Mock"` đúng contract; mọi catch dùng toastForApiError, không console/stack | ☑ |
| `src/services/auditApi.ts` | Sửa | Thêm `pageAuditLogs` lọc + phân trang đầy đủ | ☑ |
| `src/pages/admin/AuditLogs.tsx` | Tạo | Trang lịch sử hoạt động: lọc entityType/entityId + Table + Pagination | ☑ |
| `src/components/layout/layouts.tsx` | Sửa | Sidebar thêm Audit logs; Footer hiện DB status từ /health ở cả 2 layout | ☑ |
| `src/App.tsx` | Sửa | Route /admin/audit-logs | ☑ |

### Kết quả test

| Checklist F4 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Toast đúng mã BE, không stack trace | PASS | Grep: mọi catch pages dùng toastForApiError, 0 console.log/error | Đã chuẩn từ F1-F3 |
| Audit page + footer health | PASS | `/admin/audit-logs` 200; audit-all/filter 200, customer 403; `/health` qua Nginx db:up | Footer render client-side |
| E2E đặt -> duyệt -> tracking | PASS | register→book Paid→Confirm→Ongoing→Completed→tracking 5 mốc→audit 4 rows (bookingId=10) | Dữ liệu E2E + user rác đã dọn, DB về seed |
| F5 giữ login; refresh hết mới văng (re-test F1b) | PASS (code) | Interceptor + persist me không đổi từ F1b | Chờ click tay |

**Ghi chú:** Chưa push git.

---

## F4.1. Cải thiện UI/UX — XONG (code + build + bundle, chờ click tay)

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| `src/lib/labels.ts` | Tạo | Map nhãn Việt booking/tour/role/user/audit + fallback mã gốc | ☑ |
| `src/lib/format.ts`, `index.html`, `common.tsx` | Sửa | Giá 0 → Liên hệ; tab `Travela – Đặt tour du lịch` + lang vi; Đang tải; Empty có action | ☑ |
| `src/components/ui/*` | Sửa/tạo | Button loading; Field + PasswordInput toggle; Dialog Esc + dismissible; Pagination scroll-top; SafeImage onError | ☑ |
| Nav/sidebar/titles/badges | Sửa | Việt hóa toàn bộ + nhãn audit; select role/status hiện song ngữ mã + Việt | ☑ |
| Login/Register/Booking/filters | Sửa | Field labels, focus ô lỗi, email regex, min≤max, Enter tìm, loading submit | ☑ |
| Users role + Destinations/Tours dialog | Sửa | Confirm đổi role; dismissible form dài; loading lưu | ☑ |
| Booking đặt trùng | Sửa | Khóa form sau đặt xong (sessionStorage flag + nút Đặt thêm) | ☑ |

### Vướng backend (để dành, không làm trong F4.1)

| Mục | Nội dung | Trạng thái |
|---|---|---|
| BE-1 | `TourDetail` thêm `availableSeats` để hiện số chỗ còn | ☐ để dành |
| BE-2 | Register validate định dạng email + 422 | ☐ để dành |

### Kết quả test

| Checklist F4.1 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Build sạch, hết mã Anh hiện cho user | PASS | build 0 lỗi; grep còn mã thô chỉ ở `value=` option; bundle demo có map nhãn Việt | — |
| Click tay full luồng tiếng Việt | PASS (code) | Mọi badge/filter/timeline/nav dùng labels.ts | Chờ click tay |
| Dialog/ảnh/mobile đúng | PASS (code+bundle) | Esc + dismissible + scroll + SafeImage trong bundle demo; dialog tour/destination chặn đóng nền | Chờ click tay |

**Ghi chú:** Không đổi contract API. Hint demo ở login CHƯA thêm (chờ duyệt). Chưa push git.

---

## F5. Polish + Demo — XONG (rà soát + rehearsal fresh, chờ click tay + video)

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| (Không sửa code) | Rà soát | 0 console.log/error; màu/radius đúng token, không gradient/glass; validation FE/BE đã trùng từ B3/B4/F2 | ☑ |

### Kết quả test

| Checklist F5 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Không error console, build sạch | PASS | Grep 0 console.*; `npm run build` + Docker build sạch | Console browser chờ bạn F12 |
| Mobile không vỡ | PASS (code) | Hamburger + drawer + table scroll + dialog 90vh từ F4.1 | Chờ bạn devtools/điện thoại |
| Docker fresh demo mượt | PASS | `down -v` → `up --build`: 3 Up, health db:up, seed tours 10, Swagger 24 paths, FE 5/5 routes 200 + title đúng | Không cần `npm run dev` |

### DoD rehearsal fresh (2026-09-07)

| Tiêu chí | Kết quả |
|---|---|
| 3 container Up + health db:up | PASS |
| RBAC 401/403/400/422/409 | PASS (me 401, users-customer 403, tự khóa 400, giá sai 422, hết chỗ 409) |
| Audit log | PASS (audit API 200, seed 0 rows đúng vì chưa thao tác) |
| Seed tours 10 + FE demo | PASS |

**Ghi chú:** Video <5p + ảnh console/mobile để bạn quay/chụp khi demo. Chưa push git (F5 không đổi code, chỉ docs).

---

## Đợt 2 (2026-09-21) — sửa lỗi + bổ sung CRUD user + test Playwright

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| `src/pages/admin/Users.tsx` | Sửa | Thêm nút Thêm + dialog Sửa + nút Xóa (giữ khóa/mở nhanh) | ☑ |
| `src/services/userApi.ts` | Sửa | `createUser`, `updateUser`, `deleteUser` | ☑ |
| `src/pages/Register.tsx` | Sửa | Thêm field username; bỏ SĐT/họ tên/social dư | ☑ |
| `src/pages/Login.tsx` | Sửa | Bỏ "Quên mật khẩu" + social login; xóa `ForgotPassword.tsx` + route | ☑ |
| `src/pages/Booking.tsx`, `src/services/bookingApi.ts`, `src/types/index.ts` | Sửa | Gửi breakdown loại khách + liên hệ; tổng tiền khớp BE | ☑ |
| `src/pages/MyBookings.tsx`, `src/pages/admin/Bookings.tsx` | Sửa | Hiển thị contact/note trong chi tiết | ☑ |
| `src/pages/Home.tsx`, `src/pages/Contact.tsx`, `src/pages/admin/Settings.tsx` | Sửa | Bỏ gradient scrim + backdrop-blur; Contact prefill user | ☑ |
| `src/components/layout/layouts.tsx` | Sửa | Bỏ dynamic import `tourApi` (hết cảnh báo build) | ☑ |
| `src/components/common/common.tsx`, `src/index.css` | Sửa | `Loading` giữ chỗ, `LoadingBar`, `scrollbar-gutter: stable`; chống nháy footer | ☑ |
| `src/pages/TourList.tsx`, `MyBookings.tsx`, `admin/{Users,Bookings,SupportRequests,AuditLogs,Tours}.tsx` | Sửa | Giữ nội dung cũ khi tải lại (chống nháy) | ☑ |
| `src/lib/labels.ts` | Sửa | Nhãn audit `User.Create/Update/Delete` | ☑ |

### Kết quả test

| Checklist | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| `npm run build` | PASS | TS sạch, không còn warning dynamic import | CSS giảm sau khi bỏ gradient |
| Không còn UI giả | PASS | Playwright: login/register không còn Facebook/Google/Quên mật khẩu | — |
| Đăng ký qua UI | PASS | Playwright: đăng ký tài khoản mới → về trang chủ | FE-01 |
| Admin CRUD user | PASS | Playwright: thêm → sửa email → xóa | FE-09 |
| Lọc tour | PASS | Playwright: tìm "Hạ Long" ra kết quả | FE-08 |
| Đặt tour E2E | PASS | Playwright: customer đặt tour → tới `/checkout/:id` | FE-02 |
| Docker fresh | PASS | 3 container Up, backend restarts=0 | — |
| Playwright UI | PASS | 5/5 | `e2e/ui.spec.ts` |

**Ghi chú:** Test FE dùng Playwright tại `e2e/` (chạy với Docker đang bật: FE `:3001`, BE `:5000`). Tổng đợt: 12/12 PASS (7 API + 5 UI), chạy lại trên DB fresh vẫn 12/12.

---

## Đợt 3 (2026-09-21) — hoàn thiện luồng đăng ký tour (ngày+giờ, địa chỉ)

Kế hoạch: `docs/2/KE-HOACH-DANG-KY-TOUR.md` (Phase 1-2).

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| `src/lib/format.ts` | Sửa | Thêm `formatDateTime`, `toLocalInput`, `fromLocalInput` (ngày + giờ) | ☑ |
| `src/services/tourApi.ts` | Sửa | `TourForm` thêm `startDate/endDate` + 11 trường nội dung; bỏ `departureDate` | ☑ |
| `src/pages/admin/Tours.tsx` | Sửa | Input `datetime-local` cho bắt đầu/kết thúc; 11 trường nội dung; validate ngày + độ dài | ☑ |
| `src/types/index.ts` | Sửa | `Tour` bỏ `departureDate`; `Booking` thêm `departureDate/contactAddress` | ☑ |
| `src/services/bookingApi.ts` | Sửa | `CreateBookingInput` thêm `contactAddress` | ☑ |
| `src/pages/Booking.tsx` | Sửa | Gửi `contactAddress` tách khỏi `note`; hiển thị giờ khởi hành | ☑ |
| `src/pages/Checkout.tsx`, `MyBookings.tsx`, `admin/Bookings.tsx` | Sửa | Hiển thị giờ khởi hành + địa chỉ liên hệ | ☑ |
| `src/pages/TourDetail.tsx`, `components/common/TourCard.tsx` | Sửa | Hiển thị "Khởi hành"/"Kết thúc" kèm giờ từ `startDate/endDate` | ☑ |

### Kết quả test

| Checklist | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| `npm run build` | PASS | TS sạch | — |
| Admin sửa tour | PASS | Lưu giữ ngày+giờ; `start>=end` chặn 400; 11 trường lưu đủ | API `PUT /api/tours/1` 200 |
| Khách đặt tour | PASS | Tiền hiển thị == `checkout.amount`; contact/địa chỉ lưu và xem lại được | AmountMatch: True |
| Hiển thị ngày+giờ | PASS | `formatDateTime` ở TourCard/TourDetail/Booking/Checkout/MyBookings/admin | — |
| Playwright UI | PASS | 5/5 | `e2e/ui.spec.ts` |
| Flow lifecycle E2E (UI + auto) | PASS | Khách đặt → Paid → admin Confirmed → auto Ongoing → auto Completed; tour Hidden; tracking 5 mốc + audit system | `e2e/booking-lifecycle.spec.ts` |
| Tổng Playwright | PASS | 13/13 (7 API + 1 lifecycle + 5 UI) | DB fresh vẫn 13/13 |

**Ghi chú:** Giao diện giữ đúng design-system, không thêm gradient/kiểu mới. Chưa push git.
