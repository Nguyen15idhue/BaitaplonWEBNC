# FRONTEND — Các bước cần làm (Cacbuoccanlam)

> Team: 1 người (FE). Khung `travela-web` + Tailwind + shadcn/ui + Nginx đã có sẵn từ người setup.
> Backend cung cấp `docs/api.md` + Types. FE chạy song song bằng mock đúng Types, không đợi BE.
> Quy ước: mọi gọi API qua `services/*`, không `fetch` trực tiếp trong component. JSON camelCase khớp BE.

---

## F0. Nhận khung (0.5 ngày)

**Công việc:**
1. Pull khung, chạy `npm install`, `npm run dev`, check `docker compose up` mở `localhost:3000` proxy được `/api`.
2. Copy `DTOs` BE -> `src/types/` (`User, Tour{priceFrom,thumbnail}, Destination, Booking{tracking}, Checkout`).
3. Đọc design-system + API contract mục 8 bản hoàn thiện.

**Yêu cầu đạt:** Dev + Docker đều chạy, Types khớp BE.
**Checklist test:**
- [ ] `npm run dev` + `npm run build` không lỗi TS
- [ ] `localhost:3000/api/...` hoặc `localhost:5000/api/tours` gọi được (khi BE chưa xong thì mock)
- [ ] Types compile, không `any` tràn lan
**Ghi chú:** Từ chối đổi tên field. BE đổi phải sync Types ngay.

---

## F1. Foundation (làm trước mọi page)

**Công việc:**
1. Verify Tailwind + shadcn (`Button, Input, Textarea, Select, Checkbox, Dialog, Dropdown, Badge, Card, Table, Pagination, Tabs, Toast`) + Lucide + React Router.
2. Áp `docs/design-system.md`: Inter, Primary `#2563EB`, BG `#F8FAFC`, Text `#0F172A`, Muted `#64748B`, Border `#E2E8F0`, Radius 4/6/8, Spacing 4/8/12/16/24/32/48. Cấm gradient/glassmorphism.
3. Dựng `components/layout(AppLayout, AdminLayout, Header, Sidebar, PageContainer)`, `components/common(Loading, EmptyState, ErrorState, ConfirmDialog, PageHeader)`.
4. Dựng `services(api.ts axios baseURL=/api, authApi, tourApi, bookingApi, destinationApi, userApi)` với interceptor gắn Bearer + tự refresh 1 lần khi 401. `routes(ProtectedRoute, RoleGuard)`, `lib/auth-store`.
5. Mock data đúng Types cho Tours/Bookings để làm UI trước.

**Yêu cầu đạt:** Layout + Router + mock chạy được, hết F1 là mọi page sau chỉ việc đổ data.
**Checklist test:**
- [ ] Mở `/` và `/admin` ra layout đúng, Sidebar/Header hiển thị
- [ ] Chưa login vào `/my-bookings` bị đá về `/login`; Customer vào `/admin` bị 403 page
- [ ] Toast/Loading/Empty/Error hiển thị đúng khi mock lỗi/rỗng
- [ ] `npm run build` + Nginx serve `dist` không vỡ CSS
**Ghi chú:** Đây là phase quan trọng nhất của FE. Làm ẩu là các page sau lệch design hết.

---

## F2. Public pages (Customer + Anonymous)

**Công việc (theo thứ tự):**
1. `/` Home (hero + tour nổi bật + destinations).
2. `/tours` List: search, filter destination/min-max price, sort, Pagination (pageSize 12).
3. `/tours/:id` Detail: gallery ảnh, mô tả, destination, bảng giá hiệu lực, nút Đặt.
4. `/destinations` List đơn giản (card theo vùng Bắc-Trung-Nam).
5. `/booking/:tourId` Form: chọn quantity, hiện `amount = priceFrom*quantity`, validate quantity>0 và <= chỗ còn.
6. `/checkout/:bookingId` Hiện booking + checkout status Paid/Pending, nút thử lại khi Failed.
7. `/my-bookings` List own + filter status + xem trace timeline `{status,at,by,note}`.
8. `/profile` (nếu còn giờ, không bắt buộc): xem/sửa own.

**Yêu cầu đạt:** Anonymous xem tour, Customer đặt -> checkout -> my-bookings thấy trace.
**Checklist test:**
- [ ] Search/filter/page trên `/tours` gọi đúng query BE, chuyển trang không mất filter
- [ ] Tour hết chỗ / Hidden không hiện nút Đặt (hoặc bấm báo lỗi)
- [ ] Booking quantity 0/âm/quá chỗ -> validation FE chặn trước, BE trả 409 thì hiện toast đúng
- [ ] Checkout Failed có nút retry; Paid hiện timeline
- [ ] Chưa login bấm Đặt -> chuyển login, login xong quay lại
- [ ] Empty (không tour) + Error (mất mạng) hiển thị đúng component
**Ghi chú:** Giá hiển thị = `priceFrom` BE trả, FE không tự tính min từ list prices.

---

## F3. Admin pages

**Công việc:**
1. `/admin` Dashboard: cards (tổng tour/booking/users/doanh thu) + bảng booking mới nhất. Lấy từ `GET /bookings` + `GET /tours` (không cần API thống kê riêng).
2. `/admin/users`: Table + search username/email + pagination, actions lock/unlock + đổi role, chặn tự khóa (disable nút trên row chính mình + toast khi BE trả 400).
3. `/admin/tours`: Table + CRUD tour (Dialog), trong edit gộp tab Prices + Images (không làm `/admin/prices` riêng).
4. `/admin/destinations`: CRUD đơn giản.
5. `/admin/bookings`: Table all + filter status, Dialog đổi status theo đúng thứ tự state machine + note, xem trace timeline + audit liên quan.

**Yêu cầu đạt:** Admin quản trị hết User/Tour/Booking, mọi đổi status/giá thấy được trace/audit.
**Checklist test:**
- [ ] Search users + lock/unlock + đổi role đúng, tự khóa bị chặn
- [ ] CRUD tour/prices/images validate FE trùng BE (tên required, giá >0, URL hợp lệ)
- [ ] Đổi status sai thứ tự -> hiện lỗi BE `INVALID_STATUS_TRANSITION`, không crash
- [ ] Pagination mọi bảng admin giữ được filter khi reload
- [ ] Customer cố vào `/admin/*` -> 403 page, không lộ data
**Ghi chú:** Để tiết kiệm giờ: dùng chung `Table + Pagination + ConfirmDialog`, không custom mỗi trang 1 kiểu.

---

## F4. Tích hợp Auth + Guards + Hoàn thiện luồng

**Công việc:**
1. Pages `/login, /register` + lưu tokens (ưu tiên HttpOnly cookie qua proxy, fallback localStorage + ghi rủi ro XSS vào báo cáo).
2. Interceptor: gắn Bearer, 401 -> gọi `/auth/refresh` 1 lần -> retry, fail -> logout về login.
3. `ProtectedRoute + RoleGuard(Admin)`, persist login khi F5 (`GET /me`).
4. Đấu API thật thay mock: `tourApi.getTours, bookingApi.create, userApi.lock...`, chuẩn hóa error toast theo `error` code BE (`NOT_ENOUGH_SEATS, SELF_ACTION_DENIED, INVALID_STATUS_TRANSITION`).
5. Gắn audit view (hiện lịch sử đổi giá/status nếu còn giờ) + check `/health` ở footer/admin.

**Yêu cầu đạt:** Vòng login -> đặt -> admin duyệt -> tracking chạy thật end-to-end.
**Checklist test:**
- [ ] Register trùng -> toast 409; login sai -> 401
- [ ] Access hết hạn tự refresh không văng login; refresh hết hạn mới văng
- [ ] F5 vẫn giữ login (me OK); logout xóa hết
- [ ] Mọi lỗi BE hiện toast đúng code, không hiện stack trace
- [ ] E2E: customer đặt -> admin Confirmed/Ongoing/Completed -> customer thấy timeline đổi
**Ghi chú:** Mọi token/role check ở FE chỉ là UX. Bảo mật thật do BE `[Authorize]` quyết định.

---

## F5. Polish + Demo rehearsal

**Công việc:**
1. Responsive (mobile/tablet/desktop) cho Home/Tour/Booking/Admin table (scroll ngang).
2. Validation FE/BE trùng nhau, Rà soát design-system (màu/radius/spacing).
3. Rehearsal `docker compose up -d --build`, quay video <5p, chụp ảnh 401/403/validation/pagination.

**Yêu cầu đạt:** Build Docker mở `localhost:3000` demo mượt, không lỗi console.
**Checklist test:**
- [ ] Lighthouse/console không error, `npm run build` sạch
- [ ] Mobile không vỡ layout, bảng admin scroll được
- [ ] Docker fresh demo được full flow không cần `npm run dev`
**Ghi chú:** Đóng băng tính năng ở F5. Chỉ fix bug.
