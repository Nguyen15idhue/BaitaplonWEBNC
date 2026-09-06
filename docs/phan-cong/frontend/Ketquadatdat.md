# FRONTEND — Kết quả đã đạt (Ketquadatdat)

> Người làm điền sau mỗi bước F0-F5 trong `Cacbuoccanlam.md`. Ghi PASS/FAIL + evidence (ảnh UI / log build / link commit).

## Thông tin chung

* Người thực hiện FE: ...
* Nhánh/commit: ...
* Ngày cập nhật: ...

---

## F0. Nhận khung

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| `src/types/*` | Copy từ DTO BE | User/Tour/Booking/... | ☐/☑ |
| `services/api.ts` | BaseURL /api | | ☐/☑ |

### Kết quả test

| Checklist F0 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| dev + build sạch TS | | | |
| Gọi /api được (mock/thật) | | | |
| Types khớp BE | | | |

**Ghi chú:** ...

---

## F1. Foundation

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| `components/ui/*` | Verify shadcn | Button/Input/.../Toast | ☐/☑ |
| `components/layout/*` | Tạo | AppLayout/AdminLayout/Header/Sidebar | ☐/☑ |
| `components/common/*` | Tạo | Loading/Empty/Error/Confirm/PageHeader | ☐/☑ |
| `routes/*, lib/auth-store` | Tạo | ProtectedRoute/RoleGuard/interceptor | ☐/☑ |
| `docs/design-system.md` | Áp | Màu/font/spacing | ☐/☑ |

### Kết quả test

| Checklist F1 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Layout / và /admin đúng | | Ảnh ... | |
| Chưa login bị đá login; sai role 403 | | | |
| Toast/Loading/Empty/Error OK | | | |
| Build + Nginx không vỡ CSS | | | |

**Ghi chú:** ...

---

## F2. Public pages

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| `pages/Home, TourList, TourDetail` | | | ☐/☑ |
| `pages/Destinations, Booking, Checkout, MyBookings, Profile?` | | | ☐/☑ |
| `features/tours, bookings, checkout` | | | ☐/☑ |

### Kết quả test

| Checklist F2 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Search/filter/page giữ filter | | | |
| Tour hết chỗ/Hidden chặn đặt | | | |
| Validation quantity + toast 409 | | | |
| Checkout retry Paid/Failed | | | |
| Chưa login -> login -> quay lại | | | |
| Empty/Error đúng component | | | |

**Ghi chú:** ...

---

## F3. Admin pages

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| `pages/admin/Dashboard, Users, Tours, Destinations, Bookings` | | | ☐/☑ |

### Kết quả test

| Checklist F3 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Users search/lock/role, chặn tự khóa | | | |
| CRUD tour/prices/images validate | | | |
| Đổi status sai -> lỗi đẹp | | | |
| Pagination giữ filter | | | |
| Customer vào admin -> 403 | | | |

**Ghi chú:** ...

---

## F4. Tích hợp Auth + E2E

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| `pages/Login, Register` | | | ☐/☑ |
| `services/authApi + interceptor` | | refresh retry | ☐/☑ |

### Kết quả test

| Checklist F4 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Register/login toast đúng | | | |
| Tự refresh khi hết access | | | |
| F5 giữ login, logout sạch | | | |
| Toast đúng mã BE | | | |
| E2E đặt -> duyệt -> tracking | | bookingId=... | |

**Ghi chú:** ...

---

## F5. Polish + Demo

### File đã tạo/sửa

| File | Hành động | Nội dung chính | Trạng thái |
|---|---|---|---|
| Fix responsive/CSS | | | ☐/☑ |

### Kết quả test

| Checklist F5 | PASS/FAIL | Evidence | Ghi chú |
|---|---|---|---|
| Không error console, build sạch | | | |
| Mobile không vỡ | | | |
| Docker fresh demo mượt | | Video/ảnh ... | |

**Ghi chú:** ...
