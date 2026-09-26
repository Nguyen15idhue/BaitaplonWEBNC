# AGENTS — Travela (Web NC)

## 1. Bối cảnh
- Đồ án Web NC: website du lịch Travela, team 3 người (2 BE + 1 FE).
- Nguồn chốt: Tài liệu V4 trong docs + KE-HOACH-HOAN-THIEN-TRAVELA.md + phan-cong backend/frontend.
- Hiện trạng: BE + FE + Docker + test đã có code chạy thật (xem mục 8). Mọi implementation mới phải bám contract đã chốt và đồng nhất với code hiện có.

## 2. Stack chốt (không tự đổi)
- Backend: ASP.NET Core Web API, EF Core + Pomelo MySQL 8.4, JWT access ngắn + refresh xoay vòng, Swagger.
- Frontend: React + TS + Vite, Tailwind + shadcn/ui + Lucide, React Router, Axios.
- Infra: Docker Compose 3 services (frontend, backend, mysql + volume), Nginx proxy /api.
- Cấm thêm: Redis, Kafka, GraphQL, CQRS/MediatR, Microservice, K8s.

## 3. Nguồn chốt và thứ tự đọc
- Đọc theo thứ tự: kế hoạch hoàn thiện trong docs, rồi Cacbuoccanlam của đúng bên mình (backend hoặc frontend), rồi mới code.
- Mâu thuẫn thì ưu tiên: Tài liệu V4, sau đó là kế hoạch hoàn thiện, sau đó là file phân công.
- Đổi contract API, đổi tên field, đổi luồng trạng thái: phải sửa đồng thời docs/api.md, DTO backend và Types frontend. Không sửa một bên.

## 4. Quy ước backend (2 người)

### Cấu trúc và trách nhiệm
- Controllers chỉ nhận request, gọi Service, trả DTO. Mọi logic nằm ở Services.
- Models là Entity EF, không bao giờ trả trực tiếp ra JSON.
- DTO chia theo cụm Auth, Tour, Booking, User và cụm chung PagedResult cho mọi danh sách.
- Helpers chỉ chứa JWT, hash mật khẩu BCrypt, phân trang. Middleware chỉ xử lý lỗi chuẩn và audit.

### Database
- Đủ 9 bảng: users, destinations, tours, prices, images, bookings, checkouts, audit_logs, refresh_tokens.
- Khóa ngoại dùng Restrict, không cascade xóa Tour đã có Booking. Xóa Tour thực chất là chuyển trạng thái Hidden.
- Mật khẩu chỉ lưu hash BCrypt. Ảnh chỉ lưu URL chuỗi tối đa 500 ký tự, không lưu blob.
- Giá hiển thị do server tính từ giá hiệu lực, không lấy giá client gửi lên.
- Migration: luôn tạo migration mới, KHÔNG sửa migration cũ. Tên `yyyyMMddHHmmss_MoTaNgan`. Model đổi thì thêm migration + test `docker compose down -v && up --build`.
- Seed idempotent trong `Data/DbSeeder.cs` (chỉ thêm khi thiếu, không ghi đè dữ liệu đang có).

### Auth và phân quyền
- Luồng đủ 5 endpoint: register, login, refresh xoay vòng, logout thu hồi, me.
- Refresh token lưu dạng hash, thu hồi khi logout hoặc khi dùng lại token cũ.
- Mặc định mọi API yêu cầu đăng nhập. Chỉ public: register, login, refresh, xem tour và điểm đến, health check.
- Admin quản lý user, tour, giá, ảnh, mọi booking. Customer chỉ xem tour public, tạo và xem booking của chính mình.
- Không bao giờ trả hash mật khẩu hay token thô thừa ra ngoài DTO.

### Booking, thanh toán, tracking
- Tạo booking và checkout luôn nằm chung một transaction. Thất bại ở đâu rollback hết, không để bản ghi lẻ.
- Số tiền checkout do server nhân giá hiệu lực với số lượng. Hết chỗ báo 409.
- Trạng thái đi theo thứ tự: chờ thanh toán, đã trả, đã xác nhận, đang diễn ra, hoàn thành, hoặc hủy. Sai thứ tự báo 400.
- Mỗi lần đổi trạng thái phải ghi thêm mốc vào tracking_trace và ghi một dòng audit log (kể cả chuyển tự động: actor là `system`).

### Lỗi và kiểm thử backend
- Mọi lỗi trả format chuẩn với mã lỗi rõ ràng, không trả stack trace.
- Nhớ đúng mã: không token 401, sai role 403, tự khóa hoặc tự hạ quyền chính mình 400, giá sai 422, hết chỗ 409, sai thứ tự trạng thái 400.
- Mọi đổi giá, đổi trạng thái, khóa hoặc đổi role user đều phải có audit log, nếu không coi như chưa xong.

## 5. Quy ước frontend (1 người)

### Cấu trúc và gọi API
- Mọi gọi API đi qua lớp services theo cụm auth, tour, booking, destination, user. Cấm fetch trực tiếp trong component.
- Types frontend phải copy đúng từ DTO backend, dùng camelCase. Backend đổi field là frontend đổi theo ngay.
- Khi backend chưa xong thì dùng mock đúng Types, khi có API thật chỉ thay ruột service, không sửa component.

### Định tuyến và bảo vệ trang
- Trang public: trang chủ, danh sách và chi tiết tour, danh sách điểm đến.
- Trang customer cần đăng nhập: đặt tour, checkout, booking của tôi, hồ sơ.
- Trang admin cần role Admin: dashboard, quản lý user, tour, điểm đến, booking.
- Chưa đăng nhập vào trang riêng thì đá về login. Customer vào trang admin thì hiện trang 403, không lộ dữ liệu.
- Token access gắn tự động, access hết hạn thì tự gọi refresh một lần rồi thử lại, refresh hết hạn mới đăng xuất.

### Giao diện
- Dùng đúng design-system đã chốt trong `docs/design-system.md`: font Inter, màu primary, nền, chữ, chữ mờ, viền, bo góc 4-6-8, spacing 4-8-12-16-24-32-48.
- Cấm gradient, glassmorphism, màu tự chế, bo góc và spacing ngẫu nhiên.
- Cấm "phong cách AI": giao diện phải đồng nhất với mã nguồn hiện tại, không tự sáng tạo kiểu mới.
  - Không gradient, không glassmorphism, không bóng đổ/ánh sáng màu mè, không icon hay minh hoạ tự chế.
  - Dùng đúng palette, bo góc, spacing và component đang có trong `src/components`; không thêm biến thể lạ.
  - Trang mới phải trông như cùng một sản phẩm với các trang đã có, không lệch phong cách.
- Dùng chung Button, Input, Table, Pagination, Dialog, Toast, Loading, EmptyState, ErrorState, ConfirmDialog, PageHeader. Không custom mỗi trang một kiểu.
- Không làm trang quản lý giá riêng, gộp giá và ảnh vào trang sửa tour để giảm tải.

## 6. Tiêu chí nhận việc xong (DoD)
- Build sạch: backend dotnet build, frontend npm run build không lỗi TS.
- Docker fresh up được 3 container, health check DB up.
- Đúng RBAC: không token 401, sai role 403, tự khóa 400, giá sai 422, hết chỗ 409, sai thứ tự trạng thái 400.
- Mọi đổi giá, đổi trạng thái, khóa user đều có audit log.
- Test liên quan chạy PASS (mục 9) và cập nhật Ketquadatdat bên tương ứng kèm evidence, không báo miệng.

## 7. Quy trình agent
- Đọc file kế hoạch hoàn thiện + 2 file phan-cong trước khi code.
- Làm theo milestone M1-M8, xong bước nào điền checklist bước đó.
- Ưu tiên file hiện có, hạn chế tạo file mới. Không commit .env, không commit secret.
- Trả lời ngắn gọn, ghi rõ file đã đổi và cách kiểm chứng.

## 8. Cấu trúc mã nguồn
```
backend/Travela.Api/            # Web API
  Controllers/                  # nhận request -> service -> DTO
  Services/                     # toàn bộ logic nghiệp vụ
  Models/                       # entity EF
  DTOs/{Auth,Tour,Booking,User,Destination,Support,Common}
  Data/                         # TravelaDbContext + DbSeeder
  Migrations/                   # migration EF (không sửa migration cũ)
  Helpers/                      # Jwt, PasswordHasher, Pagination, Pricing
  Middleware/                   # ExceptionMiddleware (lỗi chuẩn)
backend/Travela.Tests/          # unit test xUnit (PricingHelper...)
frontend/travela-web/src/
  pages/                        # public + customer + admin
  components/{ui,common,layout} # component dùng chung
  services/                     # gọi API (axios) theo cụm
  lib/                          # auth, format, labels, utils
  routes/                       # guards phân quyền
  types/                        # copy DTO backend, camelCase
e2e/                            # Playwright: api.spec.ts + ui.spec.ts
k6/                             # k6 load test (tours-test.js)
docker/{backend,frontend}/      # Dockerfile + nginx.conf
docs/{1,2,phan-cong}/           # tài liệu, kế hoạch, kết quả
```

## 9. Kiểm thử
- Unit BE (xUnit): `dotnet test backend/Travela.Tests/Travela.Tests.csproj`.
- E2E (Playwright, chạy khi Docker đang bật: FE `:3001`, BE `:5000`):
  ```powershell
  cd e2e
  npm install
  npx playwright install chromium
  npx playwright test            # tất cả
  npx playwright test api.spec.ts
  npx playwright test ui.spec.ts
  npx playwright show-report
  ```
- Load test (k6): `k6 run k6/tours-test.js`.
- Quy tắc: đổi hành vi API/UI thì cập nhật spec tương ứng; test phải PASS trước khi báo xong.

## 10. Quy ước script PowerShell & tiếng Việt
- Dùng PowerShell 5.1; không dùng `&&` (không được hỗ trợ), dùng `;` hoặc `if ($?) { ... }`.
- Output/comment/script viết tiếng Việt có dấu, định dạng UTF-8.
- Gửi body JSON tiếng Việt phải set UTF-8 tường minh, tránh lỗi 400 giả do encoding:
  ```powershell
  $body = @{ usernameOrEmail='admin'; password='Admin123!' } | ConvertTo-Json
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
  Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/login `
    -ContentType 'application/json; charset=utf-8' -Body $bytes
  ```
- Với dữ liệu có dấu phức tạp, ưu tiên ghi file `.json` UTF-8 rồi `-InFile`.
- Không dán secret/token thật vào script hay tài liệu.

## 11. Docker & môi trường
- Timezone: cả 3 container chạy **UTC+7 (Asia/Ho_Chi_Minh)** (`TZ` + MySQL `--default-time-zone=+07:00`).
  Code vẫn lưu thời gian bằng UTC; FE hiển thị theo giờ trình duyệt.
- Cổng: FE `3001`, BE `5000`, MySQL `3307`; stack dev FE `5175`.
- Chạy/nghiệm thu: `docker compose up -d --build`; reset data: `docker compose down -v` rồi up lại.
- Kiểm tra: `docker compose ps` (3 container Up), `GET /health` phải `db: up`.
- Không commit `.env`; chỉ commit `.env.example` khi có biến mới.
