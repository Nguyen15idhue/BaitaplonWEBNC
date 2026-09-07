# FRONTEND — Các bước cần làm (Cacbuoccanlam)

> Team: 1 người (FE). Khung `travela-web` + Nginx đã có sẵn, F0 đã xong (xem `Ketquadatdat.md`).
> Cập nhật 2026-09-07 (lần 2): BE đã xong **toàn bộ B0-B5** (`docs/phan-cong/backend/api.md`:
> Health, Auth, Users, Audit, Destinations, Tours, Prices, Images, Bookings, Checkouts + k6 p95=68.79ms).
> → FE **đấu API thật toàn bộ từ F1, không mock** (chỉ giữ mock cho nhánh checkout Failed
> vì mock payment V1 luôn Paid, và cho trạng thái lỗi/rỗng khó dựng bằng data thật).
> Tra cứu duy nhất khi đấu nối: `docs/phan-cong/backend/api.md` + Phụ lục A (JSON mẫu), B (enum/query), C (mã lỗi → toast).
> Cổng thực tế: FE `localhost:3001` (3000 bị chiếm), BE `localhost:5000`, MySQL host `3307`.
> Quy ước mã nguồn hiện tại (bắt buộc): mọi gọi API qua `src/services/*` (axios `baseURL=/api`), không `fetch` trực tiếp trong component. Types ở `src/types/index.ts` camelCase khớp DTO BE. Guard ở `src/routes/guards.tsx`, token ở `src/lib/auth-store.ts`, layout ở `src/components/layout/layouts.tsx`, dùng chung ở `src/components/common/common.tsx`. Design tokens ở `src/index.css` + `docs/design-system.md`.

---

## Bản đồ trang → API (đối chiếu `docs/phan-cong/backend/api.md` ngày 2026-09-07 — BE xong hết)

| Trang FE | Endpoint BE | Trạng thái BE | Cách làm FE từ giờ |
|---|---|---|---|
| `/login`, `/register` | POST /api/auth/register, POST /api/auth/login, GET /api/auth/me | **Hoàn thành (B2)** | **Đấu thật ở F1b.** Xóa `loginMock` trong `src/services/authApi.ts`, thay bằng `register/login/refresh/logout/me` thật. Contract V1: refresh/logout nhận `{ refreshToken }` body, FE lưu ở localStorage (cookie HttpOnly để V2). Login trả thêm `user` |
| Guard + persist login | GET /api/auth/me, POST /api/auth/refresh | **Hoàn thành (B2)** | **Đấu thật ở F1b.** Interceptor `src/services/api.ts`: gắn Bearer, 401 → gọi `/auth/refresh` 1 lần → retry, fail → logout về `/login`. `ProtectedRoute/RoleGuard` + `GET /me` khi F5 |
| `/admin/users` | GET /api/users, PUT /api/users/{id}/role, PUT /api/users/{id}/lock | **Hoàn thành (B2, Admin)** | **Đấu thật ở F3.** Không mock table nữa. Request: role `{ role: Admin\|Customer }`, lock `{ locked: true\|false }`. Lỗi `SELF_ACTION_DENIED` 400 khi tự khóa/hạ quyền mình |
| `/admin` audit view | GET /api/audit-logs?entityType&entityId&page&pageSize | **Hoàn thành (B2, Admin)** | **Đấu thật ở F3/F4.** Hiện lịch sử đổi role/lock/giá/status |
| `/`, `/tours`, `/tours/:id` | GET /api/tours, GET /api/tours/{id}, GET /api/destinations | **Hoàn thành (B3)** | **Đấu thật ở F2.** `priceFrom` BE trả, FE không tự tính. Query đúng Phụ lục B |
| `/booking/:tourId`, `/checkout/:bookingId` | POST /api/bookings, GET /api/checkouts/{id} | **Hoàn thành (B4)** | **Đấu thật ở F2.** Validate FE + toast 409 `NOT_ENOUGH_SEATS`. Nhánh Failed chỉ test bằng mock |
| `/my-bookings` | GET /api/bookings, GET /api/bookings/{id} | **Hoàn thành (B4)** | **Đấu thật ở F2.** Timeline tracking thật |
| `/admin/tours`, `/admin/destinations` | CRUD tours/prices/images/destinations | **Hoàn thành (B3)** | **Đấu thật ở F3.** Validate FE trùng BE |
| `/admin/bookings` | GET /api/bookings, PUT status/cancel | **Hoàn thành (B4)** | **Đấu thật ở F3.** Đúng state machine + note |
| `/admin` Dashboard | Tận dụng GET /api/bookings + GET /api/tours | — | Không cần API thống kê riêng |

Tài khoản seed để test Auth thật: `admin/Admin123!`, `customer1/Customer123!`, `customer2/Customer123!`.

---

## F0. Nhận khung — ĐÃ XONG (không làm lại)

Đã có: `App.tsx` + router (/, /tours, /my-bookings guard, /admin RoleGuard, /403, /404), `types/index.ts`, `services/api.ts + authApi.ts (mock) + tourApi.ts`, `routes/guards.tsx`, `lib/auth-store.ts`, `components/layout/layouts.tsx`, `components/common/common.tsx` (Loading/Empty/Error/PageHeader), `pages/pages.tsx + Login.tsx (mock)`, `vite.config.ts` proxy `/api → localhost:5000`, `docker/frontend` Nginx, `index.css` tokens.
Xem evidence ở `Ketquadatdat.md` (build `tsc && vite build` 0 lỗi, `localhost:3001/api/tours` 200).

**Nợ mang sang F1 (phát hiện khi rà code 2026-09-07):**
1. `src/types/index.ts` `User` thiếu `status: string` so với BE `UserDto { id, username, email, role, status }` — F1b bổ sung.
2. `src/services/authApi.ts` còn `loginMock` + `fetchMe` trả kiểu sai — F1b thay bằng API thật.
3. `src/services/api.ts` chưa có interceptor refresh — F1b bổ sung.
4. `src/lib/auth-store.ts` lưu `role` rời — F1b chuyển sang lưu `user + accessToken + refreshToken`, role suy từ `user`.
5. Chưa có `Tailwind + shadcn/ui` (package.json chỉ có axios/router/react) — F1a cài/verify theo đúng stack chốt agents.md.

---

## F1. Foundation + Auth thật (làm trước mọi page — ưu tiên cao nhất)

**F1a. Foundation UI (giữ nguyên kế hoạch cũ):**
1. Cài/verify Tailwind + shadcn (`Button, Input, Textarea, Select, Checkbox, Dialog, Dropdown, Badge, Card, Table, Pagination, Tabs, Toast`) + Lucide + React Router (đã có). Nếu không cài được shadcn thì giữ `components/ui/*` tối thiểu Button/Input/Dialog/Table/Toast đúng token.
2. Áp `docs/design-system.md` + `src/index.css`: Inter, Primary `#2563EB`, BG `#F8FAFC`, Text `#0F172A`, Muted `#64748B`, Border `#E2E8F0`, Radius 4/6/8, Spacing 4/8/12/16/24/32/48. Cấm gradient/glassmorphism.
3. Mở rộng `components/layout/layouts.tsx` (`AppLayout, AdminLayout, Header, Sidebar, PageContainer`), `components/common/common.tsx` (thêm `ConfirmDialog, Pagination, Toast` dùng chung).
4. Chỉ giữ mock tối thiểu cho nhánh checkout Failed và trạng thái lỗi/rỗng (BE đã xong hết nên F2/F3 đấu thật).

**F1b. Auth thật (MỚI — làm ngay vì BE B2 xong, thay thế login mock):**
1. `src/types/index.ts`: bổ sung `status` vào `User`; thêm `AuthResponse { accessToken, refreshToken, user }`, `ApiError { error, message }`.
2. `src/services/authApi.ts` (sửa, không tạo file mới): `register({username,email,password}) → 201 UserDto`, `login({usernameOrEmail,password}) → 200 AuthResponse`, `refresh({refreshToken})`, `logout({refreshToken})`, `me() → UserDto`. Xóa `loginMock`. Lưu `accessToken + refreshToken + user` vào localStorage.
3. `src/services/api.ts` (sửa): giữ `baseURL=/api` + gắn Bearer; thêm response interceptor: 401 (trừ chính `/auth/refresh`, `/auth/login`) → gọi `/auth/refresh` 1 lần với `refreshToken` → lưu cặp mới → retry request gốc; fail → xóa token, về `/login`. Chuẩn hóa toast theo Phụ lục C (`DUPLICATE_USER 409, INVALID_CREDENTIALS 401, UNAUTHORIZED 401, FORBIDDEN 403, SELF_ACTION_DENIED 400, VALIDATION_ERROR 422`).
4. `src/lib/auth-store.ts` (sửa): `getAccessToken/getRefreshToken/getUser/setSession/clearSession/isLoggedIn`, bỏ `role` rời.
5. `src/routes/guards.tsx` (sửa): `ProtectedRoute` (chưa login → `/login`), `RoleGuard role="Admin"` (sai role → `/403`). Persist F5 bằng `GET /me` (không tin role local).
6. `src/pages/Login.tsx` (sửa) + tạo `Register.tsx`: form validate (username/email/password required, password ≥6), lỗi BE hiện đúng field/toast, login xong quay lại trang trước đó (`location.state.from`).

**Yêu cầu đạt:** Layout + Router + Auth thật chạy được; hết F1 là mọi page sau chỉ việc đổ data.
**Checklist test:**
- [ ] `npm run dev` + `npm run build` không lỗi TS, không `any` tràn lan
- [ ] Mở `/` và `/admin` ra layout đúng, Sidebar/Header hiển thị
- [ ] Register trùng `admin` → toast 409 `DUPLICATE_USER`; login sai pass → 401 `INVALID_CREDENTIALS`
- [ ] Login đúng (seed trên) → vào được `/my-bookings`; F5 vẫn giữ login (me OK); logout xóa hết về `/login`
- [ ] Chưa login vào `/my-bookings` bị đá về `/login`; Customer vào `/admin` bị 403 page, không lộ data
- [ ] Access hết hạn tự refresh 1 lần không văng login (test bằng cách xóa access giữ refresh rồi gọi `/me`); refresh hết hạn/reuse cũ → văng login (401)
- [ ] Toast/Loading/Empty/Error hiển thị đúng khi mock lỗi/rỗng; `npm run build` + Nginx serve `dist` không vỡ CSS
**Ghi chú:** Mọi check role ở FE chỉ là UX. Bảo mật thật do BE `[Authorize]` quyết định. Token V1 ở localStorage + ghi rủi ro XSS vào báo cáo.

---

## F2. Public pages (Customer + Anonymous — đấu thật toàn bộ vì B3/B4 xong)

**Công việc (theo thứ tự, chỉ sửa `src/pages/*`, dùng `services/tourApi.ts, bookingApi.ts (mới), destinationApi.ts (mới)` đấu thật):**
1. `/` Home (hero + tour nổi bật + destinations) — mở rộng `Home` trong `pages.tsx`.
2. `/tours` List: search, filter destination/min-max price, sort, Pagination (pageSize 12, max 50 theo Phụ lục B).
3. `/tours/:id` Detail: gallery ảnh, mô tả, destination, bảng giá hiệu lực, nút Đặt.
4. `/destinations` List đơn giản (card theo vùng Bắc-Trung-Nam).
5. `/booking/:tourId` Form: chọn quantity, hiện `amount = priceFrom*quantity`, validate quantity>0 và <= chỗ còn.
6. `/checkout/:bookingId` Hiện booking + checkout status Paid/Pending, nút thử lại khi Failed.
7. `/my-bookings` List own + filter status + xem trace timeline `{status,at,by,note}`.
8. `/profile` (nếu còn giờ, không bắt buộc): `GET /me` + sửa own.

**Yêu cầu đạt:** Anonymous xem tour thật, Customer đặt → checkout → my-bookings thấy trace thật.
**Checklist test:**
- [ ] Search/filter/page trên `/tours` gọi đúng query BE (`page,pageSize,search,destinationId,minPrice,maxPrice,sort`), chuyển trang không mất filter
- [ ] Tour hết chỗ / Hidden không hiện nút Đặt (thử đặt tour Hidden trên Swagger đối chiếu)
- [ ] Booking quantity 0/âm/quá chỗ → validation FE chặn trước, BE trả 409 `NOT_ENOUGH_SEATS` thì hiện toast đúng
- [ ] Checkout Paid hiện timeline; nhánh Failed chỉ test bằng mock (mock payment V1 luôn Paid)
- [ ] Chưa login bấm Đặt → chuyển login, login xong quay lại (nhờ F1b)
- [ ] Empty (search không ra) + Error (tắt backend) hiển thị đúng component
**Ghi chú:** Giá hiển thị = `priceFrom` BE trả, FE không tự tính min từ list prices. Enum/status dùng đúng Phụ lục B (`Draft/Published/Hidden`, `PendingPayment/Paid/Confirmed/Ongoing/Completed/Cancelled`).

---

## F3. Admin pages (đấu thật toàn bộ vì B2+B3+B4 xong)

**Công việc:**
1. `/admin` Dashboard: cards (tổng tour/booking/users/doanh thu) + bảng booking mới nhất. Lấy từ `GET /bookings` + `GET /tours` thật (không cần API thống kê riêng).
2. `/admin/users` — **ĐẤU THẬT:** tạo `src/services/userApi.ts`: `list({page,pageSize,search})`, `updateRole(id,{role})`, `updateLock(id,{locked})`. Table + search username/email + pagination, actions lock/unlock + đổi role, chặn tự khóa (disable nút trên row chính mình + toast khi BE trả 400 `SELF_ACTION_DENIED`).
3. `/admin/tours` — **ĐẤU THẬT:** Table + CRUD tour (Dialog), trong edit gộp tab Prices + Images (không làm `/admin/prices` riêng). Validate FE trùng BE.
4. `/admin/destinations` — **ĐẤU THẬT:** CRUD đơn giản.
5. `/admin/bookings` — **ĐẤU THẬT:** Table all + filter status, Dialog đổi status đúng state machine + note, xem trace timeline + audit (`GET /audit-logs?entityType=Booking&entityId=`).

**Yêu cầu đạt:** Admin quản trị hết User/Tour/Booking bằng API thật.
**Checklist test:**
- [ ] Search users + lock/unlock + đổi role thật đúng, tự khóa/tự hạ quyền bị chặn (400 `SELF_ACTION_DENIED`)
- [ ] Customer cố vào `/admin/*` → 403 page, không lộ data (kế thừa F1b)
- [ ] CRUD tour/prices/images thật: validation trùng BE, đổi giá xong list cập nhật ngay
- [ ] Đổi status sai thứ tự → toast 400 `INVALID_STATUS_TRANSITION`, không crash
- [ ] Pagination mọi bảng admin giữ được filter khi reload
**Ghi chú:** Dùng chung `Table + Pagination + ConfirmDialog`, không custom mỗi trang 1 kiểu.

---

## F4. Hoàn thiện luồng (mỏng đi vì F2/F3 đã đấu thật — chỉ còn chuẩn hóa + E2E)

**Công việc:**
1. Xóa hết mock còn sót (chỉ giữ mock cho nhánh checkout Failed và trạng thái lỗi/rỗng).
2. Chuẩn hóa error toast toàn app theo Phụ lục C (`NOT_ENOUGH_SEATS 409, INVALID_STATUS_TRANSITION 400, VALIDATION_ERROR 422, FORBIDDEN 403...`), không hiện stack trace.
3. Trang admin `/admin/audit-logs` riêng xem lịch sử hoạt động (lọc entityType/entityId + phân trang) + link sidebar; footer hiện `/health` (`db:up`) ở cả 2 layout.
4. Rehearsal E2E: customer đặt → admin Confirmed/Ongoing/Completed → customer thấy timeline đổi.

**Yêu cầu đạt:** Vòng đặt → duyệt → tracking chạy thật end-to-end.
**Checklist test:**
- [ ] Mọi lỗi BE hiện toast đúng code, không hiện stack trace
- [ ] E2E: customer đặt → admin Confirmed/Ongoing/Completed → customer thấy timeline đổi (ghi `bookingId=...`)
- [ ] F5 vẫn giữ login; refresh hết hạn mới văng (kế thừa F1b, re-test)
**Ghi chú:** Không thêm trạng thái/field mới. Đổi contract phải sửa đồng thời `docs/api.md` + DTO BE + Types FE.

---

## F4.1. Cải thiện UI/UX cho người Việt ít tech (tổng hợp 2 lượt rà 2026-09-07)

**Nhóm 1 — Ngôn ngữ và nhãn hiển thị:**
1. Tạo `src/lib/labels.ts`: map trạng thái booking (`PendingPayment→Chờ thanh toán`, `Paid→Đã thanh toán`, `Confirmed→Đã xác nhận`, `Ongoing→Đang diễn ra`, `Completed→Hoàn thành`, `Cancelled→Đã hủy`), tour (`Draft→Nháp`, `Published→Đang bán`, `Hidden→Tạm ẩn`), role, vùng — dùng khắp trang thay mã thô.
2. Việt hóa nav (Tour / Điểm đến / Chuyến của tôi), titles, `Loading...` → `Đang tải...`, tab trình duyệt `Travela – Đặt tour du lịch`.
3. Giá `0` hiện `Liên hệ` thay vì `0 ₫`.

**Nhóm 2 — Form và phản hồi:**
4. Loading cho mọi nút submit (Login/Register/admin CRUD — Booking đã có), chống bấm 2 lần.
5. Label thật cho input (không chỉ placeholder) + toggle hiện/ẩn mật khẩu ở Login/Register.
6. Validate FE: email đúng định dạng, giá min ≤ max; focus vào ô lỗi đầu tiên.
7. Ảnh `onError` fallback; EmptyState kèm nút dẫn bước tiếp (VD: hết tour → Xem tour nổi bật).
8. Enter để tìm ở filter; scroll-top khi chuyển trang; Dialog thêm Esc đóng + prop chặn đóng nền cho form dài.

**Nhóm 3 — Luồng và điều hướng:**
9. Trang 403/404 thêm nút về trang chủ.
10. Hint tài khoản demo trên trang login (chờ bạn duyệt mới thêm vì là credential).
11. Khóa form đặt sau khi tạo booking xong (tránh Back trình duyệt đặt trùng).

**Nhóm 4 — Vướng backend (ghi để sửa đợt BE sau, không làm trong F4.1):**
- BE-1: `TourDetail` thiếu số chỗ còn (chỉ có `maxSeats`) → thêm `availableSeats` để trang đặt hiện "Còn X chỗ".
- BE-2: `POST /auth/register` chưa validate định dạng email → thêm check + 422.
- Ghi nhận (không sửa): access token của user vừa bị khóa vẫn sống tới 15p — giới hạn của JWT, chấp nhận ở V1.

**Yêu cầu đạt:** người ít tech đọc hiểu mọi nhãn, không còn chữ Anh lạc, không bấm nhầm mất dữ liệu.
**Checklist test:**
- [ ] `npm run build` sạch; grep không còn mã trạng thái Anh hiện trực tiếp cho user
- [ ] Click tay full luồng login/register/đặt/admin bằng tiếng Việt
- [ ] Dialog Esc + form dài không mất khi bấm nền; ảnh lỗi vẫn đẹp; mobile/tablet
**Ghi chú:** Không đổi contract API trong F4.1 (trừ 2 mục nhóm 4 để dành).

---

## F5. Polish + Demo rehearsal (giữ nguyên)

**Công việc:**
1. Responsive (mobile/tablet/desktop) cho Home/Tour/Booking/Admin table (scroll ngang).
2. Validation FE/BE trùng nhau, rà soát design-system (màu/radius/spacing).
3. Rehearsal `docker compose up -d --build`, quay video <5p, chụp ảnh 401/403/validation/pagination. Mở demo ở `localhost:3001` (không phải 3000).

**Yêu cầu đạt:** Build Docker mở `localhost:3001` demo mượt, không lỗi console.
**Checklist test:**
- [ ] Lighthouse/console không error, `npm run build` sạch
- [ ] Mobile không vỡ layout, bảng admin scroll được
- [ ] Docker fresh demo được full flow không cần `npm run dev`
**Ghi chú:** Đóng băng tính năng ở F5. Chỉ fix bug.
