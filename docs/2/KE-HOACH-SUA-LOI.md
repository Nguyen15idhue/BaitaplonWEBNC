# KẾ HOẠCH SỬA LỖI TỒN ĐỌNG — TRAVELA (ĐỢT 2)

> Bối cảnh: sau khi pull `origin/main` @ `73c2e6c` và fix đợt 1 (migration trùng, startup crash,
> khôi phục Destination, admin tạo tour), đã rà lại toàn bộ BE + FE và ghi nhận các lỗi còn tồn đọng.
> Tài liệu này là kế hoạch chi tiết để xử lý dứt điểm.
>
> Nguồn đối chiếu: `docs/1/KE-HOACH-HOAN-THIEN-TRAVELA.md`, `docs/api.md`, `docs/design-system.md`,
> `AGENTS.md`, `docs/phan-cong/backend|frontend/*`.

---

## 0. Trạng thái & phạm vi

### 0.1. Đã xử lý ở đợt 1 (giữ làm mốc, không làm lại)

| ID | Nội dung | File |
|---|---|---|
| DONE-1 | Migration `20260919041728_AddTourRedesignFields` trùng `Version`/`idempotency_keys`/check constraint/index với `20260912000002` → bỏ phần trùng | `backend/Travela.Api/Migrations/20260919041728_AddTourRedesignFields.cs` |
| DONE-2 | `ServerVersion.AutoDetect` mở kết nối MySQL ngoài vòng retry → crash fresh up; thay `MySqlServerVersion(8.4.0)`, tăng retry 10→40 | `backend/Travela.Api/Program.cs` |
| DONE-3 | Khôi phục API Destinations (mất khi merge) khớp `docs/api.md` | `Controllers/DestinationsController.cs`, `Services/DestinationService.cs`, `DTOs/Destination/DestinationDtos.cs`, `Program.cs` |
| DONE-4 | Admin tạo tour gửi `destinationId=0` (form thiếu select điểm đến) | `frontend/travela-web/src/pages/admin/Tours.tsx`, `services/destinationApi.ts` |

### 0.2. Phạm vi đợt 2

- Sửa hết lỗi còn lại ở mức **P0/P1/P2** trong bảng dưới.
- Không thêm tính năng ngoài kế hoạch; không đổi stack.
- Mọi thay đổi contract API phải sửa **đồng thời**: `docs/api.md` + DTO backend + Types frontend (AGENTS §3).

---

## 1. Bảng tổng hợp lỗi đợt 2

| ID | Mức | Khu vực | Mô tả ngắn | File chính | Ước lượng |
|---|---|---|---|---|---|
| FE-01 | **P0** | FE | Form đăng ký gửi username chứa dấu cách/tiếng Việt → 400, không thể đăng ký | `pages/Register.tsx`, `lib/auth-context.tsx` | S |
| FE-02 | **P0** | FE+BE | Trang Đặt tour: tổng tiền hiển thị ≠ số tiền BE thu; thông tin liên lạc thu nhưng không gửi | `pages/Booking.tsx`, `services/bookingApi.ts`, `DTOs/Booking`, `BookingService.cs` | M |
| FE-03 | P1 | FE | "Quên mật khẩu" giả lập bằng `setTimeout`, không có endpoint BE | `pages/ForgotPassword.tsx`, `pages/Login.tsx` | S |
| FE-04 | P1 | FE | Nút đăng nhập Facebook/Google là placeholder chết | `Login.tsx`, `Register.tsx`, `ForgotPassword.tsx` | S |
| FE-05 | — | FE | **Chấp nhận, KHÔNG sửa**: admin chủ động dùng cả URL lẫn file ảnh cho slider/vùng miền | `pages/admin/Settings.tsx`, `lib/image-store.ts` | — |
| FE-06 | P2 | FE | Class gradient có tồn tại và được vẽ, nhưng là lớp phủ (scrim) rất nhẹ trên ảnh nên nhìn "không thấy gradient" | `Home.tsx`, `Contact.tsx`, `pages/admin/Settings.tsx` | S |
| FE-08 | P0 | FE | Nháy footer/component khi lọc, tìm kiếm, phân trang | `components/common/common.tsx`, `index.css` + 7 trang danh sách | S |
| FE-09 | P0 | FE+BE | Trang admin Users thiếu Thêm/Sửa/Xóa | `pages/admin/Users.tsx`, `services/userApi.ts`, `Controllers/UsersController.cs`, `Services/UserService.cs` | M |
| FE-07 | P2 | FE | Chi tiết nhỏ: warning dynamic import; field SĐT/họ tên đăng ký không gửi; Contact không prefill user | `layouts.tsx`, `Register.tsx`, `Contact.tsx` | S |
| BE-01 | P1 | BE | `TourService.ListAsync` nạp toàn bộ tour + Prices + Images + Bookings vào RAM rồi mới lọc/sort/phân trang → nghẽn NFR | `Services/TourService.cs` | M |
| BE-02 | P2 | BE+docs | `docs/api.md` ghi username `[a-z0-9._-]`, code cho phép chữ HOA | `docs/api.md`, `Services/AuthService.cs` | S |
| BE-03 | P2 | BE | Chưa có job dọn refresh token hết hạn (tài liệu nói retention/cleanup) | `Program.cs`/`Services/AuthService.cs` | S |
| BE-04 | P2 | BE | Dead code `ToDto(Booking)` | `Services/BookingService.cs` | S |

Quy ước mức: **P0** = chặn luồng chính/demo, phải sửa ngay; **P1** = sai chức năng/gây hiểu nhầm, sửa trong đợt; **P2** = chất lượng/design, sửa nếu còn thời gian.

---

## 2. Chi tiết từng lỗi

### FE-01 [P0] — Đăng ký luôn thất bại

**Mô tả**
Form đăng ký hiện có Email, SĐT, Tên, Họ đệm, Mật khẩu — không có "Tên đăng nhập". Khi submit gửi
`username = firstName + " " + lastName` (VD `"Pháp Huỳnh Long"`). BE validate username bằng
`^[a-zA-Z0-9._-]{3,100}$` nên dấu cách + ký tự có dấu bị từ chối → `400 VALIDATION_ERROR`.

**Bằng chứng đã test**
```
POST /api/auth/register {username:"Pháp Huỳnh Long", email:"newuser1@example.com", password:"Secret123"} -> 400
POST /api/auth/register {username:"newuser1",           email:"newuser1@example.com", password:"Secret123"} -> 201
```

**Nguyên nhân gốc**
- `frontend/travela-web/src/pages/Register.tsx:65` — ghép họ tên làm username.
- Form không thu `username` dù DTO `RegisterRequest` (BE) và `docs/api.md` yêu cầu.

**Cách sửa (chọn 1, khuyến nghị A)**
- **A. Thêm field "Tên đăng nhập" (khuyến nghị)** — đúng DTO, tránh trùng lặp:
  1. `Register.tsx`: thêm state `username`, input "Tên đăng nhập" (gợi ý: `^[a-zA-Z0-9._-]{3,100}$`).
  2. Validate client trùng regex BE; bỏ dòng ghép họ tên.
  3. Gọi `register(username.trim(), email.trim(), password)`.
  4. Ẩn/loại các field không được BE lưu: "Số điện thoại", "Tên", "Họ đệm" (xem FE-07) — hoặc ghi rõ chỉ hiển thị.
  5. `lib/auth-context.tsx`: giữ nguyên chữ ký `register(username, email, password)` (đã đúng).
- **B. Suy username từ email**: lấy phần trước `@`, sanitize `[^a-z0-9._-]` → thay bằng `.`, thêm hậu tố số nếu trùng.
  Không khuyến nghị vì mất kiểm soát username và khó xử lý trùng.

**File ảnh hưởng**: `pages/Register.tsx` (bắt buộc), `lib/auth-context.tsx` (không đổi nếu chọn A).
**Kiểm chứng**
- `npm run build` sạch.
- UI: đăng ký tài khoản mới → 201 + tự đăng nhập; thử username có dấu cách → lỗi ngay ở client.
- API: `POST /api/auth/register` với username hợp lệ → 201.

---

### FE-02 [P0] — Trang Đặt tour: tiền hiển thị lệch, thông tin liên lạc bị bỏ

**Mô tả**
1. `Booking.tsx:58` tính `totalAmount = adult*adultQty + child*childQty + supplement*supplementQty`.
2. Nhưng `totalQuantity = adultQty + childQty` (`Booking.tsx:59`) — **bỏ qua Phòng đơn** khi gửi BE.
3. `createBooking` chỉ gửi `{ tourId, quantity, paymentMethod }` (`services/bookingApi.ts:8`).
4. BE tính tiền = `PricingHelper.EffectiveMin(prices) * quantity` (`BookingService.cs:128,147`) — dùng **giá min**,
   không dùng giá trẻ em/phụ thu.
5. Các field Họ tên/Email/SĐT/Địa chỉ/Ghi chú trong form (`Booking.tsx:22-26`) **không được gửi** đi đâu cả.

**Hệ quả**: số tiền user nhìn thấy ≠ số tiền trong checkout; thông tin liên lạc không được lưu.

**Cách sửa — chia 2 phase**

**Phase A (bắt buộc, tối thiểu, ít rủi ro): làm khớp hiển thị với BE**
- FE: tính tổng hiển thị = `tour.priceFrom * totalQuantity` (đúng giá BE dùng) hoặc ẩn bảng breakdown
  Người lớn/Trẻ em/Phòng đơn nếu chưa hỗ trợ.
- FE: đưa Phòng đơn vào hoặc loại khỏi tổng cho nhất quán.
- FE: hoặc gửi kèm contact info nếu chọn mở rộng ở Phase B; nếu chưa, **ẩn** nhóm field không dùng để tránh hiểu nhầm.

**Phase B (đầy đủ, khuyến nghị làm nếu kịp) — server tính giá theo loại khách**
- Contract: `POST /api/bookings` body mở rộng
  ```json
  { "tourId": 1, "adultQty": 2, "childQty": 1, "supplementQty": 1, "paymentMethod": "Mock",
    "contactName": "...", "contactEmail": "...", "contactPhone": "...", "note": "..." }
  ```
- BE `CreateBookingRequest`: thêm `AdultQty/ChildQty/SupplementQty/ContactName/ContactEmail/ContactPhone/Note`
  (giữ `Quantity` để tương thích hoặc suy ra `Quantity = AdultQty + ChildQty`).
- BE `BookingService.TryCreateAsync`: lấy giá hiệu lực **theo từng nguồn** (`Người lớn`, `Trẻ em`, `Phụ thu`) và
  tính `amount = adult*adultQty + child*childQty + supplement*supplementQty`; seat = `adultQty + childQty`.
  Không nhận giá từ client (AGENTS §4).
- DB: thêm cột nullable vào `bookings`: `ContactName`, `ContactEmail`, `ContactPhone`, `Note` + migration mới.
  (Không lưu breakdown nếu muốn gọn — có thể ghi vào `tracking_trace` note.)
- Đồng bộ: `docs/api.md`, `DTOs/Booking/BookingDtos.cs`, `frontend/.../types/index.ts`, `services/bookingApi.ts`,
  `pages/Booking.tsx`.
- `pages/admin/Bookings.tsx` + `MyBookings.tsx`: hiển thị contact/note trong dialog chi tiết (tùy chọn).

**File ảnh hưởng**: `pages/Booking.tsx`, `services/bookingApi.ts`, `types/index.ts`,
`backend/.../DTOs/Booking/BookingDtos.cs`, `backend/.../Services/BookingService.cs`,
`backend/.../Models/Booking.cs`, `backend/.../Data/TravelaDbContext.cs`, migration mới, `docs/api.md`.
**Kiểm chứng**
- Đặt tour 2 người lớn + 1 trẻ em + 1 phòng đơn → số tiền FE hiển thị == `checkout.amount` trả về.
- `GET /api/bookings/{id}` có `contactName/contactEmail/contactPhone/note` đúng dữ liệu đã nhập.
- Hết chỗ vẫn 409; giá do server tính (thử sửa body không gửi giá).

---

### FE-03 [P1] — Quên mật khẩu giả lập

**Mô tả**: `pages/ForgotPassword.tsx:33-35` chỉ `setTimeout(1000)` rồi báo "Đã gửi mật khẩu mới"; BE không có
endpoint reset/forgot.

**Cách sửa (chọn 1)**
- **A (khuyến nghị, nhỏ):** Bỏ link "Quên mật khẩu" ở `Login.tsx:91` và route `/forgot-password` trong `App.tsx`;
  hoặc trỏ sang `/contact` với ghi chú "liên hệ admin để cấp lại".
- **B:** Thêm endpoint `POST /api/auth/forgot-password` trả `200` generic (không tiết lộ email tồn tại) — vẫn không
  gửi mail thật, chỉ nên làm nếu tài liệu cho phép "mô phỏng". Nếu chọn B phải cập nhật `docs/api.md`.

**File ảnh hưởng**: `pages/ForgotPassword.tsx`, `pages/Login.tsx`, `App.tsx` (và `docs/api.md` nếu chọn B).
**Kiểm chứng**: không còn màn hình báo thành công giả; build sạch; điều hướng hợp lệ.

---

### FE-04 [P1] — Nút đăng nhập Facebook/Google chết

**Mô tả**: Nút render nhưng không có `onClick`, không có OAuth. Xuất hiện ở `Login.tsx`, `Register.tsx`,
`ForgotPassword.tsx`.

**Cách sửa (khuyến nghị A)**
- **A:** Loại bỏ cụm social + divider "Hoặc" ở cả 3 trang (không lộ UI giả).
- **B:** Giữ nhưng `disabled` + tooltip "Sắp có".

**File ảnh hưởng**: `pages/Login.tsx`, `pages/Register.tsx`, `pages/ForgotPassword.tsx`.
**Kiểm chứng**: build sạch, không còn nút không phản hồi.

---

### FE-05 [—] — Admin "Hình ảnh" dùng cả URL lẫn file (CHẤP NHẬN, KHÔNG SỬA)

**Kết luận sau khi trao đổi**: Đây là **quyết định thiết kế có chủ đích**, không phải lỗi.
Trang `/admin/settings` quản lý ảnh **slider trang chủ** và **ảnh vùng miền** — tách biệt hoàn toàn với
ảnh tour (bảng `images` của BE). Việc cho phép vừa dán URL vừa tải file là tiện dụng cho admin.

**Làm rõ quy ước liên quan**:
- AGENTS §4 "Ảnh chỉ lưu URL chuỗi tối đa 500 ký tự, không lưu blob" áp dụng cho **ảnh tour trong DB backend**.
- Tính năng slider/vùng miền lưu ở `IndexedDB` phía trình duyệt admin (`lib/image-store.ts`), không gửi lên BE,
  nên không vi phạm quy ước DB.

**Đánh đổi đã ghi nhận (không chặn)**:
- Dữ liệu chỉ có ở máy/trình duyệt của admin, không đồng bộ giữa các máy hay cho khách khác.
- File ảnh được nhúng base64 nên IndexedDB phình dần nếu tải nhiều ảnh nặng.

**Hành động**: Giữ nguyên. Không đưa vào danh sách sửa. (Nếu sau này muốn dùng chung, mới cần thêm API `site_images`.)

**Kiểm chứng**: không applicable (không sửa).

---

### FE-06 [P2] — Làm rõ về "gradient": có tồn tại nhưng là lớp phủ rất nhẹ

**Vì sao nhìn giao diện vẫn "đúng, không thấy gradient"**
- Các class đang dùng là `bg-gradient-to-t from-black/40 to-transparent` (và `from-black/60`). Đây **không phải**
  gradient trang trí (đổi màu rực rỡ) mà là **lớp phủ tối dần đặt trên ảnh** để chữ/nhãn dễ đọc — nhìn vào ảnh
  thấy bình thường, nên cảm giác "không có gradient" là đúng về mặt cảm quan.
- Về mặt kỹ thuật, gradient **thực sự được vẽ**: đã kiểm tra CSS build (`index-*.css`) có selector
  `.bg-gradient-to-t{--tw-gradient-position:to top in oklab;background-image:linear-gradient(var(--tw-gradient-stops))}`.
  Nghĩa là Tailwind v4 vẫn sinh utility này (không bị "chết class").

**Vậy lỗi ở đâu?** Chỉ là **vi phạm hình thức** so với AGENTS §5 ("cấm gradient, glassmorphism") khi soi class,
chứ không làm sai giao diện. Mức độ: thấp.

**Vị trí**
- `pages/Home.tsx:52` `bg-gradient-to-t ...`; `Home.tsx:53` `backdrop-blur-sm` (glassmorphism).
- `pages/Contact.tsx:57` `bg-gradient-to-t ...`.
- `pages/admin/Settings.tsx:127` `bg-gradient-to-t ...`.

**Cách sửa (khuyến nghị, không thay đổi hình ảnh nhiều)**:
- Thay lớp phủ gradient bằng **màu đặc có alpha**: `bg-black/40` hoặc `bg-[#535041]/60` để giữ độ đọc chữ.
- Bỏ `backdrop-blur-sm` (glassmorphism).

**File ảnh hưởng**: `Home.tsx`, `Contact.tsx`, `pages/admin/Settings.tsx`.
**Kiểm chứng**: grep `gradient|backdrop-blur` trong `src` = 0 kết quả; build sạch; giao diện ảnh không đổi đáng kể.

---

### FE-08 [P0] — Nháy footer/component khi lọc, tìm kiếm, phân trang (ĐÃ SỬA)

**Triệu chứng**: thao tác lọc/tìm/phân trang ở các trang danh sách làm footer (và khối khác) "nháy" lên rồi xuống.

**Nguyên nhân gốc (2 yếu tố cộng dồn)**
1. **Nội dung bị gỡ khỏi DOM khi tải lại**: các trang dùng pattern `{loading ? <Loading/> : ...}`, mà `Loading`
   cũ chỉ là **1 dòng chữ**. Mỗi lần lọc → set `loading=true` → toàn bộ grid/table bị thay bằng 1 dòng → chiều
   cao trang sụp → footer bị kéo nhảy lên; tải xong lại bật xuống.
2. **Scrollbar bật/tắt gây reflow ngang**: khi số kết quả đổi làm chiều cao vượt/không vượt viewport, thanh cuộn
   ẩn/hiện → toàn trang giật ngang, càng làm cảm giác "nháy".

**Đã sửa**
- `components/common/common.tsx`:
  - `Loading` giờ là khối `min-h-[40vh]` + spinner → giữ chỗ, không sụp layout.
  - Thêm `LoadingBar` (thanh mảnh `fixed` trên đỉnh) báo đang tải lại, không chiếm layout.
- 7 trang danh sách (`TourList`, `MyBookings`, `admin/Users`, `admin/Bookings`, `admin/SupportRequests`,
  `admin/AuditLogs`, `admin/Tours`): đổi `loading ? ...` → `loading && items.length === 0 ? ...` để **giữ nội dung cũ
  khi tải lại**; bỏ hiệu ứng `opacity-60` (vốn bị coi là nháy).
- `index.css`: thêm `html { scrollbar-gutter: stable; }` để thanh cuộn luôn giữ chỗ, hết giật ngang.

**File ảnh hưởng**: `components/common/common.tsx`, `index.css`,
`pages/TourList.tsx`, `pages/MyBookings.tsx`, `pages/admin/{Users,Bookings,SupportRequests,AuditLogs,Tours}.tsx`.

**Kiểm chứng**
- `npm run build` pass.
- Container `travela-frontend` đã rebuild; route `/tours` 200; CSS build chứa `scrollbar-gutter: stable`.
- Thao tác lọc/tìm/phân trang: nội dung cũ giữ nguyên (không gỡ), chỉ có thanh mảnh trên đỉnh.

**Còn lại (nếu vẫn thấy)**: nếu vẫn nháy ở trang cụ thể, cần xác định đúng trang + thao tác để truy tiếp
(khả năng còn ở các trang tải lần đầu dùng `if (loading) return <Loading/>`: `TourDetail`, `Booking`, `Checkout`, `Profile`).

---

### FE-09 [P0] — Bổ sung CRUD người dùng ở trang admin (ĐÃ LÀM)

**Yêu cầu**: trang `/admin/users` trước đây chỉ có xem + đổi quyền + khóa/mở; cần **Thêm / Sửa / Xóa**.

**Backend (mới)**
- `POST /api/users` — `{ username, email, password, role, status }`; validate như register; trùng → `409 DUPLICATE_USER`; audit `User.Create` (cùng transaction).
- `PUT /api/users/{id}` — `{ email, role, status, newPassword? }`; tự hạ quyền/tự khóa chính mình → `400 SELF_ACTION_DENIED`; đổi mật khẩu thu hồi refresh; audit `User.Update`.
- `DELETE /api/users/{id}` — tự xóa chính mình → `400`; đã có booking → `409 HAS_RELATIONS`; gỡ tham chiếu nullable (support_requests, audit_logs), xóa refresh_tokens/idempotency_keys; audit `User.Delete`.
- DTO: `CreateUserRequest`, `UpdateUserRequest` (`DTOs/User/UserDtos.cs`).
- Giữ nguyên `PUT /role`, `PUT /lock` cũ.

**Frontend (mới)**
- `services/userApi.ts`: `createUser`, `updateUser`, `deleteUser`.
- `pages/admin/Users.tsx`: nút "Thêm người dùng", dialog thêm/sửa (username, email, password/mật khẩu mới, role, status), nút "Xóa" + ConfirmDialog; giữ nút khóa/mở nhanh.
- `lib/labels.ts`: nhãn audit `User.Create/Update/Delete`.

**Kiểm chứng**: Playwright — API "user CRUD" (create/duplicate/update/audit/delete) và UI "admin thêm/sửa/xóa người dùng" đều PASS.

---

### FE-07 [P2] — Chi tiết nhỏ

- **Warning build**: `services/tourApi.ts` vừa dynamic import (`layouts.tsx:108`) vừa static import nơi khác →
  `INEFFECTIVE_DYNAMIC_IMPORT`. Sửa: import tĩnh `getTours` ở đầu `layouts.tsx`, bỏ `await import(...)`.
- **Field đăng ký không gửi**: SĐT/Tên/Họ đệm (`Register.tsx`) — bỏ hoặc ghi rõ chỉ hiển thị (gộp xử lý ở FE-01).
- **Contact không prefill user**: `pages/Contact.tsx` có thể prefill `name/email` từ `useAuth().user` nếu đã đăng nhập.
- **`Header` admin không có nút logout trên trang public** (`layouts.tsx:143`): chấp nhận (đã có ở `AdminLayout`),
  hoặc thêm nút logout cho mọi role.

**Kiểm chứng**: `npm run build` không còn cảnh báo; UI hợp lý.

---

### BE-01 [P1] — `TourService.ListAsync` nạp toàn bộ vào RAM

**Mô tả**: `TourService.cs:40-63` `Include(Destination, Prices, Images, Bookings)` rồi `ToListAsync()`, sau đó
tính `priceFrom`, lọc giá, sort, phân trang **trong bộ nhớ**. Với seed nhỏ thì chạy được nhưng là điểm nghẽn NFR.

**Cách sửa (DB-side)**
1. Query tour theo filter (search/destination/status) + phân trang **ở DB** (`Skip/Take`), chỉ `Include(Destination)`.
2. Với tập Id của trang: load `Prices` và `Images` (thumbnail) theo `TourId IN (...)` — 2 query phụ.
3. Tính `bookedSeats` bằng subquery `SUM(Quantity) WHERE Status != 'Cancelled'` theo `TourId IN (...)` —
   không `Include(Bookings)`.
4. `priceFrom` tính từ prices đã load của trang (giữ `PricingHelper`).
5. Lọc `minPrice/maxPrice` và sort theo giá: nếu cần chính xác, có thể lọc/sort sau khi tính priceFrom cho trang
   (chấp nhận) hoặc đẩy sang subquery. Ghi chú lại giới hạn nếu giữ cách tính trong bộ nhớ cho riêng priceFrom.
6. Giữ nguyên shape `TourListDto`.

**File ảnh hưởng**: `backend/.../Services/TourService.cs` (chính), có thể thêm index (đã có composite).
**Kiểm chứng**
- `GET /api/tours?page=1&pageSize=12` trả đúng total/priceFrom/availableSeats như trước (so sánh với DB seed).
- Chạy lại `k6/tours-test.js` p95 vẫn đạt ngưỡng.

---

### BE-02 [P2] — Doc lệch regex username

**Mô tả**: `docs/api.md` ghi `[a-z0-9._-]`, code `AuthService.cs:36` dùng `[a-zA-Z0-9._-]`.
**Cách sửa**: chốt 1 nguồn — khuyến nghị cho phép chữ HOA ở code và cập nhật `docs/api.md` thành `[a-zA-Z0-9._-]`
(hoặc ngược lại nếu muốn lowercase-only; khi đó thêm `.ToLowerInvariant()` khi lưu/đăng nhập).
**Kiểm chứng**: docs khớp hành vi; test register username có chữ HOA theo quyết định.

---

### BE-03 [P2] — Job dọn refresh token

**Mô tả**: chưa có cơ chế xóa/đánh dấu token hết hạn định kỳ (tài liệu B2/M06 nói retention).
**Cách sửa (nhẹ)**: thêm `IHostedService` chạy mỗi 24h xóa `refresh_tokens` có `ExpiresAt < now - 30 ngày`
hoặc đã `RevokedAt` quá lâu. Không cần thư viện ngoài.
**File ảnh hưởng**: `backend/.../Services/RefreshTokenCleanupService.cs` (mới) + đăng ký `Program.cs`.
**Kiểm chứng**: log job chạy; token cũ bị xóa; build sạch.

---

### BE-04 [P2] — Dead code

**Mô tả**: `BookingService.cs:389-406` `private static BookingDto ToDto(Booking b)` không được gọi.
**Cách sửa**: xóa hàm.
**Kiểm chứng**: `dotnet build` 0 warning/0 error.

---

## 3. Thứ tự thực hiện

| Bước | Nội dung | Phụ thuộc | Song song |
|---|---|---|---|
| 1 | FE-01 (đăng ký) | — | BE-04 |
| 2 | FE-02 Phase A (khớp tiền) | — | — |
| 3 | FE-02 Phase B (breakdown + contact + migration) | docs/api.md | BE-01 |
| 4 | FE-03, FE-04, FE-06 | — | BE-02, BE-03 |
| 5 | FE-06, FE-07 (FE-05: không sửa; FE-08 đã xong) | — | — |
| 6 | BE-01 (tối ưu ListAsync) | — | — |
| 7 | Rebuild Docker fresh + smoke test toàn bộ | tất cả | — |
| 8 | Cập nhật `Ketquadatdat` BE/FE + evidence | — | — |

**Milestone gợi ý**
- **M-fix-1 (P0)**: FE-01 + FE-02 (Phase A) → demo đăng ký + đặt tour không sai tiền.
- **M-fix-2 (P1)**: FE-02 Phase B + FE-03/04/05 + BE-01 → luồng hoàn chỉnh, không UI giả.
- **M-fix-3 (P2)**: FE-06/07 + BE-02/03/04 → sạch chất lượng.

---

## 4. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Đổi contract `POST /api/bookings` làm vỡ FE admin/MyBookings | Sửa đồng thời DTO + Types + docs; giữ field cũ optional để tương thích |
| Migration mới đụng DB đang chạy | Viết migration mới (không sửa migration cũ); test bằng `docker compose down -v && up --build` |
| Refactor `TourService.ListAsync` sai kết quả priceFrom/availableSeats | Viết so sánh output trước/sau trên cùng seed; chạy lại k6 |
| FE-05 bỏ upload làm mất ảnh slider đang lưu local | Chỉ đổi sang URL; giữ `DEFAULT_*`; hướng dẫn admin nhập URL |
| Rate limit auth (10 login/phút) cản test | Chờ 1 phút hoặc dùng token có sẵn khi smoke test |

---

## 5. Definition of Done (đợt 2)

- [ ] `dotnet build` backend: 0 warning / 0 error.
- [ ] `npm run build` frontend: pass TS, không còn warning `INEFFECTIVE_DYNAMIC_IMPORT`.
- [ ] `docker compose down -v && docker compose up -d --build`: 3 container Up, backend `restarts=0`, health db `up`.
- [ ] Đăng ký qua UI thành công; đăng nhập lại được.
- [ ] Đặt tour: số tiền hiển thị == `checkout.amount`; contact info lưu và xem lại được (nếu chọn Phase B).
- [ ] Không còn màn hình/nút giả (forgot password, social login) hoặc đã ghi rõ.
- [ ] `grep gradient|backdrop-blur` trong `frontend/src` = 0.
- [ ] RBAC vẫn đúng: 401/403/400/422/409.
- [ ] Mọi đổi giá/trạng thái/khóa user vẫn có audit log.
- [ ] `docs/api.md` khớp code; `types/index.ts` khớp DTO.
- [ ] Cập nhật `docs/phan-cong/backend/Ketquadatdat.md` và `.../frontend/Ketquadatdat.md` kèm evidence.

---

## 6. Checklist theo dõi

| ID | Việc | Trạng thái | Người | Evidence |
|---|---|---|---|---|
| FE-01 | Thêm field username + sửa submit đăng ký | ✅ | FE | Playwright UI "đăng ký tài khoản mới" + API register 201 |
| FE-02A | Khớp tổng tiền FE với BE | ✅ | FE | Playwright API "booking breakdown" amount match |
| FE-02B | Breakdown giá theo loại khách + contact + migration | ✅ | FE+BE | migration `AddBookingContactFields`; booking lưu contact |
| FE-03 | Bỏ màn quên mật khẩu giả | ✅ | FE | Playwright UI kiểm tra route/không còn màn giả |
| FE-04 | Bỏ social login chết | ✅ | FE | Playwright UI không còn Facebook/Google |
| FE-05 | Không sửa (chấp nhận dùng cả URL + file) | ✅ | FE | — |
| FE-06 | Thay scrim gradient bằng màu đặc, bỏ backdrop-blur | ✅ | FE | grep `gradient|backdrop-blur` = 0 |
| FE-07 | Fix warning import + prefill Contact | ✅ | FE | `npm run build` không còn cảnh báo |
| FE-08 | Giữ nội dung khi tải lại + scrollbar-gutter stable | ✅ | FE | build + CSS |
| FE-09 | Admin Users thêm/sửa/xóa | ✅ | FE+BE | Playwright API + UI CRUD PASS |
| BE-01 | Tối ưu ListAsync (bỏ Include Bookings) | ✅ | BE | Playwright API tours PASS |
| BE-02 | Đồng bộ regex username với docs | ✅ | BE | `docs/api.md` đã sửa `[a-zA-Z0-9._-]` |
| BE-03 | Job dọn refresh token | ✅ | BE | `RefreshTokenCleanupService` đăng ký hosted service |
| BE-04 | Xóa dead code | ✅ | BE | `dotnet build` 0 warning/0 error |

---

## 7. Lệnh kiểm chứng nhanh (PowerShell)

```powershell
# Build
dotnet build backend/Travela.Api/Travela.Api.csproj --nologo -v q
npm run build --prefix frontend/travela-web

# Docker fresh
docker compose down -v
docker compose up -d --build
docker compose ps
docker inspect travela-backend --format 'restarts={{.RestartCount}} health={{.State.Health.Status}}'

# Smoke test
Invoke-RestMethod http://localhost:5000/health
$t = (Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/login -ContentType 'application/json' -Body (@{usernameOrEmail='admin';password='Admin123!'}|ConvertTo-Json)).accessToken
Invoke-RestMethod -Uri http://localhost:5000/api/tours?pageSize=3
Invoke-RestMethod -Uri http://localhost:5000/api/destinations
Invoke-RestMethod -Uri http://localhost:5000/api/admin/stats -Headers @{Authorization="Bearer $t"}

# FE routes
1..1 | ForEach-Object { Invoke-WebRequest http://localhost:3001/tours -UseBasicParsing }
```

---

## 8. Kết quả thực hiện (2026-09-21)

### 8.1. Thay đổi backend
- `DTOs/User/UserDtos.cs`, `Services/UserService.cs`, `Controllers/UsersController.cs`: CRUD user + audit + tự bảo vệ.
- `Models/Booking.cs`, `Data/TravelaDbContext.cs`, `DTOs/Booking/BookingDtos.cs`, `Services/BookingService.cs`,
  `Helpers/PricingHelper.cs`, migration `20260921143743_AddBookingContactFields`: breakdown giá theo loại khách + contact.
- `Services/TourService.cs`: `ListAsync` bỏ `Include(Bookings)`, đếm chỗ theo trang (1 query GROUP BY).
- `Services/RefreshTokenCleanupService.cs` (mới) + đăng ký hosted service trong `Program.cs`.
- `docs/api.md`: bổ sung CRUD users, body booking mới, sửa regex username, ghi chú job dọn token.

### 8.2. Thay đổi frontend
- `pages/admin/Users.tsx` + `services/userApi.ts` + `lib/labels.ts`: thêm/sửa/xóa người dùng.
- `pages/Register.tsx`: thêm field `username`, bỏ field thừa (SĐT/họ tên/social).
- `pages/Login.tsx`: bỏ "Quên mật khẩu"; xóa `pages/ForgotPassword.tsx` và route.
- `pages/Booking.tsx` + `services/bookingApi.ts` + `types/index.ts`: gửi breakdown + liên hệ; hiển thị tổng khớp BE.
- `pages/MyBookings.tsx`, `pages/admin/Bookings.tsx`: hiển thị contact/note.
- `Home.tsx`, `Contact.tsx`, `pages/admin/Settings.tsx`: bỏ gradient/backdrop-blur; `Contact.tsx` prefill user.
- `components/layout/layouts.tsx`: bỏ dynamic import (hết cảnh báo build).
- `components/common/common.tsx` + `index.css`: `Loading` giữ chỗ, `LoadingBar`, `scrollbar-gutter: stable`; 7 trang danh sách giữ nội dung khi tải lại.

### 8.3. Kiểm thử
| Hạng mục | Kết quả |
|---|---|
| `dotnet build backend/Travela.Api` | 0 warning / 0 error |
| `npm run build frontend/travela-web` | pass TS, không còn `INEFFECTIVE_DYNAMIC_IMPORT` |
| Docker fresh `down -v && up --build` | 3 container Up, backend `restarts=0`, health db up; migrations = 8, tours = 12, users = 3 |
| Playwright — API (`e2e/api.spec.ts`) | 7/7 PASS: health, tours/destinations, RBAC 401/403/400, user CRUD + audit, booking breakdown amount + contact, giá 422 + hết chỗ 409, register |
| Playwright — UI (`e2e/ui.spec.ts`) | 5/5 PASS: login/register không còn social/forgot, đăng ký mới, admin CRUD user, lọc tour, đặt tour E2E tới checkout |
| Tổng Playwright | **12/12 PASS** (chạy lại trên DB fresh vẫn 12/12) |

### 8.4. Cách chạy lại test
```powershell
# Yêu cầu: docker compose up -d --build đang chạy (FE :3001, BE :5000)
cd e2e
npm install
npx playwright install chromium
npx playwright test          # tất cả
npx playwright test api.spec.ts   # chỉ API
npx playwright test ui.spec.ts    # chỉ UI
npx playwright show-report
```
