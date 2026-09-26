# Hướng dẫn chạy nhanh Travela

## 1. Cần có

- Git + Docker Desktop (bật Linux containers).
- Không cần cài .NET/Node nếu chỉ chạy demo.

## 2. Lấy code và cấu hình

```bash
git clone https://github.com/Nguyen15idhue/BaitaplonWEBNC.git
cd BaitaplonWEBNC
copy .env.example .env
```

Mở `.env`, đổi `JWT_SECRET` thành chuỗi ngẫu nhiên dài (tối thiểu 32 ký tự).
Các biến MySQL giữ mặc định vẫn chạy được. Không commit file `.env`.

## 3. Chạy demo (không cần code)

```bash
docker compose up --build -d
```

- Lần đầu build 5–10 phút (tải image .NET/Node/MySQL).
- Chờ ~1 phút cho MySQL init, rồi kiểm tra `docker compose ps` (3 container Up).
- Web: `http://localhost:3001` · API Swagger: `http://localhost:5000/swagger` · Health: `http://localhost:5000/health` (phải `db:up`).

## 4. Tài khoản thử ngay

- Admin `admin / Admin123!`: quản trị user/tour/booking, xem `/admin/audit-logs`.
- Customer `customer1 / Customer123!` (hoặc `customer2`): đặt tour, xem tracking ở `/my-bookings`.

## 5. Code song song (hot reload, không rebuild)

Chạy ngay từ đầu cũng được, không cần chạy demo trước:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Mở `http://localhost:5175`, sửa file là BE/FE tự reload.
Không chạy chung 2 stack (trùng cổng backend 5000). Đổi chế độ thì down cái đang chạy rồi up cái kia.
Data MySQL dùng chung volume nên không mất khi đổi chế độ.

## 6. Lỗi thường gặp

- `Bind for 0.0.0.0:3001/3307/5000 failed`: cổng bị app khác chiếm. Tắt app đó hoặc sửa số
  trước dấu `:` trong `docker-compose.yml`, VD `"3002:80"`.
- Backend `db:down` lúc mới up: MySQL chưa init xong, chờ 30–60s rồi thử lại.
- Reset data demo về seed gốc: `docker compose down -v` rồi up lại.

## 7. Dừng

- `docker compose down` (giữ data) hoặc `docker compose down -v` (xóa data).
- Stack dev dừng bằng `docker compose -f docker-compose.yml -f docker-compose.dev.yml down`.
