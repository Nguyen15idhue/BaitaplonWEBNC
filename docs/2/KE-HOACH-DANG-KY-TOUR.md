# KẾ HOẠCH HOÀN THIỆN LUỒNG ĐĂNG KÝ TOUR — TRAVELA (ĐỢT 3)

> Bối cảnh: sau khi rà soát luồng admin tạo/đăng ký tour và luồng khách đặt tour, phát hiện nhiều
> bất cập: form admin thiếu ngày bắt đầu/kết thúc và nhiều trường nội dung, chuyển trạng thái thủ công,
> khách đặt tour không có thông tin liên lạc/địa chỉ và số tiền FE lệch BE.
>
> Nguồn đối chiếu: `AGENTS.md`, `docs/api.md`, `docs/1/KE-HOACH-HOAN-THIEN-TRAVELA.md`,
> `docs/2/KE-HOACH-SUA-LOI.md`, `docs/phan-cong/backend|frontend/*`.
>
> File này là kế hoạch thực thi chi tiết: mỗi phase/bước gồm **Nội dung — Yêu cầu cần đạt — Checklist test —
> Kết quả đã đạt — Ghi chú**. Cập nhật cột "Kết quả đã đạt" ngay khi làm xong, kèm evidence.

---

## 0. Quyết định đã chốt (không tự đổi)

| # | Quyết định | Ghi chú |
|---|---|---|
| D1 | Docker chạy múi giờ **UTC+7 (Asia/Ho_Chi_Minh)** cho cả 3 service | Đã hoàn thành ở Phase 0 |
| D2 | Tour có **2 mốc thời gian kèm giờ**: `StartDate` = bắt đầu/khởi hành, `EndDate` = kết thúc | Bỏ `DepartureDate` trùng lặp |
| D3 | `bookings` thêm **1 cột `DepartureDate` (DateTime?)** — snapshot mốc khởi hành của tour | Không tạo bảng đợt khởi hành |
| D4 | Khách đặt tour **cố định theo tour**, không tự chọn ngày/giờ | BE lấy snapshot từ `tour.StartDate` |
| D5 | Thêm `bookings.ContactAddress` (FE đang thu "Địa chỉ" nhưng BE chưa có chỗ lưu) | varchar(300) |
| D6 | Auto trạng thái **chỉ từ `Confirmed`**: `Confirmed → Ongoing` (tới mốc bắt đầu), `Ongoing → Completed` (tới mốc kết thúc) | `Paid → Confirmed` vẫn admin làm tay |
| D7 | Mọi lần đổi trạng thái (kể cả auto) phải ghi `tracking_trace` + audit log | Actor auto = `system` (`ActorId = null`) |

---

## 1. Mô hình & contract thay đổi

### 1.1. Tour (admin)

| Trường | Trước | Sau |
|---|---|---|
| `startDate` | DateTime? (FE ép 00:00) | DateTime? — **bắt đầu/khởi hành, kèm giờ** |
| `endDate` | DateTime? (FE ép 00:00) | DateTime? — **kết thúc, kèm giờ** |
| `departureDate` | DateTime? | **Bỏ khỏi contract/UI/DB** (dùng `startDate`) |
| `route, itinerary, transport, accommodation, meals, sightseeing, guide, audience, insurance, terms, contactInfo` | BE có, FE không gửi | FE bổ sung đủ |

### 1.2. Booking (khách)

| Trường | Loại | Nguồn |
|---|---|---|
| `departureDate` | DateTime? | BE snapshot từ `tour.StartDate`, request **không cần** gửi |
| `contactAddress` | string? (300) | Khách nhập |
| `contactName/contactEmail/contactPhone/note` | đã có | Khách nhập (FE phải gửi — hiện đang bỏ) |
| `adultQty/childQty/supplementQty` | đã có ở request | FE phải gửi để tiền khớp |

### 1.3. Luồng trạng thái

```
Tour:      Draft ──(admin)──► Published ──(auto khi EndDate < now)──► Hidden
Booking:   PendingPayment ──(pay)──► Paid ──(admin)──► Confirmed ──(auto tới StartDate)──► Ongoing ──(auto tới EndDate)──► Completed
```

---

## 2. PHASE 0 — Docker timezone UTC+7  ✅ HOÀN THÀNH

### Bước 0.1 — Cấu hình TZ cho các service

- **Nội dung**: Thêm `TZ=Asia/Ho_Chi_Minh` cho `mysql`, `backend`, `frontend` trong `docker-compose.yml`;
  MySQL thêm `command: --default-time-zone=+07:00`. Dockerfile backend/frontend cài `tzdata`.
  Dev compose (`docker-compose.dev.yml`) thêm TZ + cài tzdata cho node alpine.
- **Yêu cầu cần đạt**: Cả 3 container chạy giờ +07; MySQL `@@global.time_zone=+07:00`; health vẫn up.
- **Checklist test**:
  - [x] `docker compose config` hợp lệ, thấy TZ ở cả 3 service.
  - [x] `docker exec travela-backend date` → `+07`.
  - [x] `docker exec travela-frontend date` → `+07`.
  - [x] `docker exec travela-mysql mysql ... SELECT @@global.time_zone, NOW()` → `+07:00`, giờ VN.
  - [x] `GET /health` → `{status: ok, db: up}`.
- **Kết quả đã đạt**: ✅ Đã rebuild `docker compose up -d --build`, 3 container healthy.
  Evidence: backend `Mon Sep 21 22:32:07 +07 2026`; mysql `+07:00 | 2026-09-21 22:32:07`; health `db: up`.
- **Ghi chú**: Code dùng `DateTime.UtcNow` nên timestamp lưu DB vẫn UTC; TZ này áp cho log/`DateTime.Now`
  và phiên MySQL. FE hiển thị theo giờ trình duyệt. Không đổi cách lưu UTC.

**File đã đổi**: `docker-compose.yml`, `docker-compose.dev.yml`, `docker/backend/Dockerfile`, `docker/frontend/Dockerfile`.

---

## 3. PHASE 1 — Admin tạo/sửa tour: parity field + ngày giờ

### Bước 1.1 — Bổ sung `startDate/endDate` (có giờ) vào form admin

- **Nội dung**: `services/tourApi.ts` — thêm `startDate/endDate` vào `TourForm`, bỏ `departureDate`.
  `pages/admin/Tours.tsx` — thay 2 input `datetime-local` cho Bắt đầu/Kết thúc; `openEdit` map ISO→local input;
  `saveTour` convert local→ISO UTC. Thêm helper `toLocalInput`/`formatDateTime` vào `lib/format.ts`.
- **Yêu cầu cần đạt**: Admin nhập được ngày+giờ; sửa tour seeded **không mất** `startDate/endDate`; `start < end`.
- **Checklist test**:
  - [x] Sửa 1 tour seeded rồi lưu → reload thấy đúng ngày+giờ đã nhập.
  - [x] Nhập `start >= end` → BE trả 400 `VALIDATION_ERROR`.
  - [x] Danh sách/detail hiển thị "Khởi hành" kèm giờ.
- **Kết quả đã đạt**: ✅ `TourForm` + form admin dùng `datetime-local`; helper `toLocalInput/fromLocalInput/formatDateTime`
  trong `lib/format.ts`; `TourCard`/`TourDetail` hiển thị "Khởi hành"/"Kết thúc" kèm giờ. Evidence API:
  `PUT /api/tours/1 {startDate:'2026-10-01T08:00:00Z', endDate:'2026-10-03T18:00:00Z'}` → 200, `GET` reload đúng;
  `start>=end` → 400. `dotnet build` + `npm run build` sạch.
- **Ghi chú**: Đây là fix bug mất ngày: trước đây `TourService.UpdateAsync` gán `t.StartDate = req.StartDate` mà FE
  không gửi field nên ghi đè null; nay FE gửi đủ `startDate/endDate`.

### Bước 1.2 — Bổ sung 11 trường nội dung chi tiết

- **Nội dung**: `TourForm` + tab "Nội dung" (`Tours.tsx`) thêm: `route, itinerary, transport, accommodation,
  meals, sightseeing, guide, audience, insurance, terms, contactInfo`; validate độ dài trùng BE
  (ngắn ≤500: route/transport/accommodation/guide/audience/contactInfo; dài ≤10000: itinerary/meals/sightseeing/terms).
- **Yêu cầu cần đạt**: Nhập/lưu/xem lại được; `TourDetail` hiển thị các mục mới.
- **Checklist test**:
  - [x] Nhập đủ 11 field → lưu → `GET /api/tours/{id}` trả đúng giá trị.
  - [x] Nhập quá giới hạn ký tự → 400, không mất dữ liệu khác.
- **Kết quả đã đạt**: ✅ Thêm 11 trường (route/itinerary/transport/accommodation/meals/sightseeing/guide/
  audience/insurance/terms/contactInfo) vào `TourForm` + tab "Nội dung". Validate FE trùng BE (500/10000).
  Evidence: `PUT /api/tours/1` nhập đủ 11 field → 200; `GET` trả đúng toàn bộ. Build sạch.
- **Ghi chú**: BE đã hỗ trợ sẵn, chủ yếu là nối FE.

### Bước 1.3 — Bỏ `DepartureDate` khỏi contract/DB

- **Nội dung**: Xóa `DepartureDate` khỏi `Models/Tour.cs`, `DTOs/Tour/TourDtos.cs` (List/Detail/CreateRequest),
  `TourService` (Create/Update/Build DTO), `Data/TravelaDbContext.cs` nếu có cấu hình; cập nhật `DbSeeder` (bỏ gán
  `DepartureDate`); FE `types/index.ts`, `TourCard.tsx`, `TourDetail.tsx`, `tourApi.ts`, `admin/Tours.tsx`.
  Migration mới `DropTourDepartureDate`.
- **Yêu cầu cần đạt**: Không còn tham chiếu `departureDate`; hiển thị "Khởi hành" lấy từ `startDate` kèm giờ.
- **Checklist test**:
  - [x] `dotnet build` + `npm run build` sạch, không lỗi tham chiếu.
  - [x] `rg departureDate` (BE+FE) chỉ còn 0 kết quả ngoài migration cũ.
- **Kết quả đã đạt**: ✅ Bỏ `DepartureDate` khỏi `Models/Tour.cs`, `DTOs/Tour/TourDtos.cs`, `TourService`,
  `DbSeeder`; FE `types/index.ts`, `TourForm`, `TourCard`, `TourDetail`, `admin/Tours`. Migration mới
  `20260921154243_DropTourDepartureDate` (DropColumn). `grep departureDate` chỉ còn trong `Migrations/`.
- **Ghi chú**: Migration mới, không sửa migration cũ; giữ `departureLocation`.

### Bước 1.4 — Ràng buộc ngày + chặn Published thiếu dữ liệu

- **Nội dung**: `TourService.ValidateTour` — giữ `start < end`; thêm kiểm tra khi `Status == "Published"`:
  phải có `StartDate`, `EndDate` và ít nhất 1 giá hiệu lực (`PricingHelper.EffectiveMin > 0`). (Ảnh khuyến nghị có.)
- **Yêu cầu cần đạt**: Không thể publish tour rỗng giá/ngày; khách không gặp 422 khi đặt.
- **Checklist test**:
  - [x] Publish tour không giá → 422/400 kèm message rõ.
  - [x] Publish tour thiếu `startDate/endDate` → 400.
  - [x] Publish tour hợp lệ → 200.
- **Kết quả đã đạt**: ✅ Thêm `EnsurePublishableAsync` trong `TourService` (áp cho cả Create/Update khi
  `Status=Published`). Evidence: tạo Published thiếu ngày → 400; tạo Draft rồi publish chưa có giá → 422
  `PRICE_NOT_AVAILABLE`; tour 1 (đã có giá + ngày) publish → 200.
- **Ghi chú**: Admin tạo tour nên để Draft → thêm giá/ảnh → mới chuyển Published (form Thêm tour chọn Published
  sẽ bị chặn vì chưa có giá).

---

## 4. PHASE 2 — Khách đặt tour: gửi đủ dữ liệu + snapshot giờ khởi hành

### Bước 2.1 — Migration thêm cột booking

- **Nội dung**: `Models/Booking.cs` thêm `DepartureDate (DateTime?)`, `ContactAddress (string?)`.
  `TravelaDbContext` cấu hình `ContactAddress` max 300. Migration `AddBookingDepartureAndAddress`
  (nullable để tương thích booking cũ).
- **Yêu cầu cần đạt**: Cột tồn tại, dữ liệu cũ không vỡ; `docker compose down -v && up --build` migrate sạch.
- **Checklist test**:
  - [x] Migration apply không lỗi; `SHOW COLUMNS FROM bookings` có 2 cột mới.
  - [x] Booking cũ vẫn `GET` được với `departureDate/contactAddress = null`.
- **Kết quả đã đạt**: ✅ Thêm `Booking.DepartureDate (DateTime?)` + `Booking.ContactAddress (string?, 300)`;
  migration `20260921154243_AddBookingDepartureAndAddress`. Evidence: `SHOW COLUMNS` có `DepartureDate datetime(6)`,
  `ContactAddress varchar(300)`; booking seed cũ `GET /api/bookings/1` trả null cả 2, không lỗi.
- **Ghi chú**: Viết migration mới, không sửa migration cũ.

### Bước 2.2 — DTO + service lưu snapshot & contact

- **Nội dung**: `CreateBookingRequest` thêm `ContactAddress`; `BookingDto` thêm `DepartureDate`, `ContactAddress`.
  `BookingService.TryCreateAsync`:
  - `departureDate = tour.StartDate` (snapshot, BE là nguồn chốt, không nhận từ client).
  - Lưu `ContactAddress` (Norm, cắt 300).
  - Giữ validate breakdown/quantity/giá/hết chỗ như hiện tại.
- **Yêu cầu cần đạt**: Booking lưu đúng giờ khởi hành + địa chỉ; tiền do server tính.
- **Checklist test**:
  - [x] `POST /api/bookings` với breakdown + contact + address → 201, `GET` trả đủ field.
  - [x] `departureDate` trả về == `tour.startDate`.
- **Kết quả đã đạt**: ✅ `CreateBookingRequest` thêm `ContactAddress`; `BookingDto` thêm `DepartureDate/ContactAddress`;
  `BookingService` snapshot `DepartureDate = tour.StartDate`, lưu `ContactAddress`. Evidence: POST 201,
  `departureDate=2026-10-01T08:00:00` == tour1.startDate; GET trả `contactAddress` đúng.
- **Ghi chú**: Không cho client gửi giá; `departureDate` do BE chốt từ tour (D4).

### Bước 2.3 — FE gửi đủ payload (fix lệch tiền)

- **Nội dung**: `services/bookingApi.ts` — `createBooking` nhận payload đầy đủ
  `{ tourId, adultQty, childQty, supplementQty, paymentMethod:"Mock", contactName, contactEmail,
  contactPhone, contactAddress, note }`. `pages/Booking.tsx` — gửi toàn bộ state; bỏ/ẩn field nếu không dùng;
  hiển thị tổng tiền dựa trên `checkout.amount` trả về (không chỉ tính client).
- **Yêu cầu cần đạt**: Tiền FE hiển thị == `checkout.amount`; contact/address không bị mất.
- **Checklist test**:
  - [x] Đặt 2 người lớn + 1 trẻ em + 1 phòng đơn → tổng FE == `checkout.amount`.
  - [x] `GET /api/bookings/{id}` có `contactName/contactEmail/contactPhone/contactAddress/note` đúng.
  - [x] Hết chỗ vẫn 409 `NOT_ENOUGH_SEATS`.
- **Kết quả đã đạt**: ✅ `bookingApi.createBooking` nhận `CreateBookingInput` (breakdown + contact + `contactAddress`);
  `Booking.tsx` gửi tách `contactAddress` và `note` (không gộp địa chỉ vào note nữa). Evidence: đặt 1+1+1 →
  `checkout.amount=2757500` == tổng giá hiệu lực (adult+child+supplement) → **AmountMatch: True**; GET đủ field;
  đặt 9999 chỗ → 409.
- **Ghi chú**: Đây là bug P0 FE-02 chưa khép ở `docs/2/KE-HOACH-SUA-LOI.md`.

### Bước 2.4 — Hiển thị kèm giờ + địa chỉ ở các trang

- **Nội dung**: `Checkout.tsx`, `MyBookings.tsx`, `admin/Bookings.tsx`, `TourDetail.tsx` hiển thị
  ngày giờ khởi hành/kết thúc (`formatDateTime`), địa chỉ liên hệ trong dialog chi tiết.
- **Yêu cầu cần đạt**: Mọi nơi hiển thị ngày đều kèm giờ; admin/khách xem được địa chỉ.
- **Checklist test**:
  - [x] Dialog chi tiết admin hiển thị giờ khởi hành + địa chỉ.
  - [x] MyBookings/Checkout hiển thị đúng.
- **Kết quả đã đạt**: ✅ `Checkout.tsx`, `MyBookings.tsx`, `admin/Bookings.tsx`, `Booking.tsx`, `TourDetail.tsx`,
  `TourCard.tsx` dùng `formatDateTime` hiển thị ngày kèm giờ; thêm dòng "Địa chỉ" ở Checkout/MyBookings/admin.
  Evidence: `npm run build` pass TS; API trả đủ field để render.
- **Ghi chú**: Dùng `toLocaleString("vi-VN", { hour, minute, day, month, year })`.

---

## 5. PHASE 3 — Tự động chuyển trạng thái theo ngày (chỉ từ `Confirmed`)

### Bước 3.1 — Tách state machine dùng chung

- **Nội dung**: Tạo `Services/BookingStateMachine.cs` chứa `Transitions` + `AppendStep` + `ParseSteps`;
  `BookingService` dùng lại thay vì code trùng.
- **Yêu cầu cần đạt**: Hành vi `/status`, `/cancel`, `/pay` không đổi; build sạch.
- **Checklist test**:
  - [x] Chuyển sai thứ tự → 400 như trước.
  - [x] Tracking append đúng định dạng JSON hiện tại.
- **Kết quả đã đạt**: ✅ Tạo `Services/BookingStateMachine.cs` (Transitions + CanTransition + AppendStep + ParseSteps);
  `BookingService` dùng lại, bỏ code trùng; vẫn log warning khi tracking corrupt. Evidence: `dotnet build` 0 warning;
  chuyển sai thứ tự `Completed -> Ongoing` → 400; tracking append đúng JSON.
- **Ghi chú**: Logic ở Services (AGENTS §4), không để Helpers.

### Bước 3.2 — Background service tự chuyển trạng thái

- **Nội dung**: `Services/BookingLifecycleService.cs` (`BackgroundService`):
  - Tour: `Published` + `EndDate < now` → `Hidden` (+audit `Tour.Update` actor system).
  - Booking: `Confirmed` + `now >= departureDate/startDate` → `Ongoing`; `Ongoing` + `now >= tour.EndDate` → `Completed`.
  - Mỗi bước: append tracking (By=`system`), `_audit.Add(null, "Booking.Status", ...)`, `Version++`.
  - Bỏ qua `Completed/Cancelled`; nuốt `DbUpdateConcurrencyException` (log, thử lại vòng sau).
  Đăng ký `Program.cs`; cấu hình `Lifecycle:IntervalMinutes` (default 30) trong appsettings.
- **Yêu cầu cần đạt**: Trạng thái tự chuyển đúng mốc, không can thiệp đơn `Paid` (chưa xác nhận), có vết đầy đủ.
- **Checklist test**:
  - [x] Đơn `Confirmed` có `startDate` trong quá khứ → job chuyển `Ongoing`.
  - [x] Đơn `Ongoing` có `EndDate` trong quá khứ → `Completed`.
  - [x] Đơn `Paid` quá hạn **không** tự đổi.
  - [x] Tour `Published` qua `EndDate` → `Hidden`.
  - [x] Mỗi lần đổi có 1 mốc tracking + 1 dòng audit `system`.
- **Kết quả đã đạt**: ✅ Tạo `Services/BookingLifecycleService.cs` (BackgroundService, chạy 1 lần lúc khởi động rồi
  lặp `Lifecycle:IntervalMinutes`, mặc định 30) + đăng ký `Program.cs`. Evidence (tour test, restart backend):
  `Confirmed -> Ongoing` (by `system`), `Ongoing -> Completed` (by `system`), tour `Published -> Hidden`;
  tracking có mốc `system`, audit `Booking.Status ... actor=system`; đơn `Paid` quá hạn **giữ nguyên `Paid`**.
- **Ghi chú**: So sánh UTC; chỉ auto từ `Confirmed` (D6). Snapshot `booking.DepartureDate` dùng làm mốc bắt đầu,
  `tour.EndDate` làm mốc kết thúc.

---

## 6. PHASE 4 — Contract, tài liệu & DoD

### Bước 4.1 — Đồng bộ contract

- **Nội dung**: Cập nhật đồng thời `docs/api.md` (mục Tours + Bookings), DTO backend, `types/index.ts`,
  service FE. Ghi rõ bỏ `departureDate` tour, thêm `contactAddress`, auto lifecycle.
- **Yêu cầu cần đạt**: Không lệch 3 nguồn (docs/DTO/Types).
- **Checklist test**:
  - [x] So khớp field DTO ↔ Types ↔ docs.
  - [x] `Swagger` hiển thị đúng schema mới.
- **Kết quả đã đạt**: ✅ Cập nhật `docs/api.md` (GET tours bỏ departureDate, thêm auto lifecycle, POST bookings nhận
  contactAddress + snapshot departureDate, Published cần giá + ngày). DTO/Types/`tourApi`/`bookingApi` khớp nhau.
  Evidence: không còn `departureDate` ngoài Migrations; FE `types/index.ts` khớp DTO.
- **Ghi chú**: AGENTS §3 bắt buộc sửa cả 3.

### Bước 4.2 — Nghiệm thu & evidence

- **Nội dung**: Chạy build, Docker fresh, smoke test; cập nhật `docs/phan-cong/backend|frontend/Ketquadatdat.md`.
- **Yêu cầu cần đạt**: Đạt toàn bộ DoD bên dưới.
- **Checklist test**:
  - [x] `dotnet build backend/Travela.Api/Travela.Api.csproj` 0 warning/0 error.
  - [x] `npm run build --prefix frontend/travela-web` pass TS.
  - [x] `docker compose down -v && docker compose up -d --build` 3 container Up, health db up.
  - [x] RBAC: không token 401, sai role 403, tự khóa 400, giá sai 422, hết chỗ 409, sai thứ tự 400.
  - [x] Mọi đổi giá/trạng thái/khóa user có audit log.
- **Kết quả đã đạt**: ✅ Build BE 0 warning/0 error; FE build pass TS; `down -v && up --build` 3 container healthy,
  `/health` `db:up`; migration fresh sạch (tours bỏ DepartureDate, bookings có DepartureDate/ContactAddress).
  RBAC smoke: 401/403/400/422/409/400 đúng. E2E Playwright **12/12 PASS** (`npx playwright test`).
- **Ghi chú**: Không báo miệng; evidence là output lệnh ở trên và trong `Ketquadatdat`.

---

## 7. Bảng theo dõi tổng hợp

| Phase | Bước | Việc | Trạng thái | Evidence |
|---|---|---|---|---|
| 0 | 0.1 | TZ UTC+7 cho 3 service | ✅ | `docker exec ... date` = +07, health up |
| 1 | 1.1 | Thêm startDate/endDate có giờ vào admin | ✅ | PUT tour 1 200, start>=end 400, build sạch |
| 1 | 1.2 | 11 trường nội dung | ✅ | PUT tour 1 200, GET trả đủ 11 field |
| 1 | 1.3 | Bỏ DepartureDate khỏi contract | ✅ | migration DropTourDepartureDate, grep còn trong Migrations |
| 1 | 1.4 | Chặn Published thiếu giá/ngày | ✅ | no-date 400, no-price 422, valid 200 |
| 2 | 2.1 | Migration booking (departure + address) | ✅ | SHOW COLUMNS có 2 cột; booking cũ null |
| 2 | 2.2 | Service snapshot + contact | ✅ | POST 201, departureDate == tour.startDate |
| 2 | 2.3 | FE gửi đủ payload (fix lệch tiền) | ✅ | amount 2757500 match, oversell 409 |
| 2 | 2.4 | Hiển thị kèm giờ + địa chỉ | ✅ | build TS pass, đủ field để render |
| 3 | 3.1 | Tách BookingStateMachine | ✅ | build 0 warning, sai thứ tự 400 |
| 3 | 3.2 | BookingLifecycleService (auto từ Confirmed) | ✅ | Confirmed→Ongoing→Completed, tour Hidden, Paid giữ nguyên |
| 4 | 4.1 | Đồng bộ contract docs/DTO/Types | ✅ | api.md + DTO + Types khớp |
| 4 | 4.2 | Nghiệm thu + Ketquadatdat | ✅ | build sạch, fresh 3 container, RBAC, E2E 12/12 |

---

## 8. File dự kiến thay đổi

**Backend**: `Models/Tour.cs`, `Models/Booking.cs`, `DTOs/Tour/TourDtos.cs`, `DTOs/Booking/BookingDtos.cs`,
`Services/TourService.cs`, `Services/BookingService.cs`, `Services/BookingStateMachine.cs` (mới),
`Services/BookingLifecycleService.cs` (mới), `Data/TravelaDbContext.cs`, `Data/DbSeeder.cs`, migration mới,
`Program.cs`, `appsettings*.json`.

**Frontend**: `services/tourApi.ts`, `services/bookingApi.ts`, `pages/admin/Tours.tsx`, `pages/Booking.tsx`,
`pages/Checkout.tsx`, `pages/MyBookings.tsx`, `pages/admin/Bookings.tsx`, `pages/TourDetail.tsx`,
`components/common/TourCard.tsx`, `types/index.ts`, `lib/format.ts`.

**Docs**: `docs/api.md`, `docs/phan-cong/backend/Ketquadatdat.md`, `docs/phan-cong/frontend/Ketquadatdat.md`.

**Docker (đã xong)**: `docker-compose.yml`, `docker-compose.dev.yml`, `docker/backend/Dockerfile`,
`docker/frontend/Dockerfile`.

---

## 9. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Bỏ `DepartureDate` chạm nhiều file, quên chỗ nào | grep `departureDate` toàn repo sau khi sửa |
| Auto-walk trạng thái vượt admin | Chỉ từ `Confirmed`, không đụng `Paid` |
| Lệch giờ UTC ↔ giờ VN khi so mốc | Lưu UTC, hiển thị `toLocaleString`, nhập `datetime-local`→ISO |
| Migration mới làm vỡ DB đang chạy | Migration mới, test `down -v && up --build` |
| Tiền FE vẫn lệch nếu quên gửi breakdown | Checklist 2.3 so trực tiếp `checkout.amount` |

---

## 10. Lệnh kiểm chứng nhanh (PowerShell)

```powershell
# Build
dotnet build backend/Travela.Api/Travela.Api.csproj --nologo -v q
npm run build --prefix frontend/travela-web

# Docker timezone + fresh
docker compose config | Select-String "TZ|time-zone"
docker exec travela-backend date
docker exec travela-mysql sh -c "mysql -uroot -proot_password -N -e 'SELECT @@global.time_zone, NOW();'"
docker compose down -v; docker compose up -d --build; docker compose ps

# Smoke
Invoke-RestMethod http://localhost:5000/health
$t = (Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/login -ContentType 'application/json' -Body (@{usernameOrEmail='admin';password='Admin123!'}|ConvertTo-Json)).accessToken
Invoke-RestMethod -Uri http://localhost:5000/api/tours?pageSize=3
```
