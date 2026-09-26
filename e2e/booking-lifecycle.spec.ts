import { test, expect, request, type APIRequestContext, type Page } from "@playwright/test";
import { execSync } from "node:child_process";
import { API_BASE, ADMIN, CUSTOMER, uniqueName } from "./constants";

// E2E full flow: khách đặt tour -> Paid -> admin xác nhận -> auto Ongoing -> auto Completed.
// Dùng UI cho luồng khách; API cho admin + đẩy mốc thời gian; restart backend để job lifecycle chạy.

async function loginApi(ctx: APIRequestContext, creds: { usernameOrEmail: string; password: string }) {
  const res = await ctx.post("/api/auth/login", { data: creds });
  expect(res.status()).toBe(200);
  return (await res.json()).accessToken as string;
}

async function loginUI(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("Địa chỉ email").fill(username);
  await page.getByPlaceholder("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

async function restartBackend(api: APIRequestContext) {
  execSync("docker restart travela-backend", { stdio: "ignore" });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const res = await api.get("/health");
      if (res.status() === 200 && (await res.json()).db === "up") {
        await new Promise((r) => setTimeout(r, 1500)); // chờ job lifecycle vòng đầu
        return;
      }
    } catch {
      // backend đang khởi động lại
    }
  }
  throw new Error("Backend không healthy sau restart");
}

// Chờ trạng thái hiển thị ở trang checkout (tự reload vì job chạy nền).
async function expectBookingStatus(page: Page, bookingId: number, statusLabel: string) {
  await expect
    .poll(
      async () => {
        await page.goto(`/checkout/${bookingId}`);
        return page.getByText(statusLabel).first().isVisible().catch(() => false);
      },
      { timeout: 40_000, intervals: [1500] },
    )
    .toBe(true);
}

test("customer đặt tour và đi qua các trạng thái tới khi kết thúc", async ({ page }) => {
  test.setTimeout(300_000);
  const api = await request.newContext({ baseURL: API_BASE });
  const adminAuth = { Authorization: `Bearer ${await loginApi(api, ADMIN)}` };

  // 1) Tạo tour test: bắt đầu quá khứ, kết thúc tương lai (để đặt được + auto Ongoing sớm).
  const now = Date.now();
  const tourName = uniqueName("Lifecycle Flow ");
  const startAt = new Date(now - 2 * 60_000).toISOString();
  const endAt = new Date(now + 3 * 60_000).toISOString();
  const tourBody = {
    tourName,
    description: "E2E lifecycle full flow",
    destinationId: 1,
    maxSeats: 10,
    status: "Published",
    startDate: startAt,
    endDate: endAt,
  };

  const created = await api.post("/api/tours", { headers: adminAuth, data: { ...tourBody, status: "Draft" } });
  expect(created.status(), "tạo tour").toBe(201);
  const tourId = (await created.json()).id as number;

  const price = await api.post(`/api/tours/${tourId}/prices`, {
    headers: adminAuth,
    data: { sourceName: "Người lớn", priceValue: 1_000_000, effectiveDate: new Date(now - 60_000).toISOString() },
  });
  expect(price.status(), "thêm giá").toBe(201);
  expect((await api.put(`/api/tours/${tourId}`, { headers: adminAuth, data: tourBody })).status(), "publish").toBe(200);

  // 2) Khách đặt tour qua UI.
  await loginUI(page, CUSTOMER.usernameOrEmail, CUSTOMER.password);
  await page.goto(`/tours/${tourId}`);
  await page.getByRole("button", { name: "Đặt ngay" }).click();
  await page.waitForURL(/\/booking\/\d+/);

  await page.getByPlaceholder("Nguyễn Văn A").fill("Khách Lifecycle");
  await page.getByPlaceholder("email@example.com").fill("lifecycle@example.com");
  await page.getByPlaceholder("0912345678").fill("0912345678");
  await page.getByPlaceholder("TP. Hồ Chí Minh").fill("Hà Nội");
  await page.getByRole("button", { name: "Xác nhận đặt" }).click();
  await page.waitForURL(/\/checkout\/\d+/);
  const bookingId = Number(page.url().match(/\/checkout\/(\d+)/)![1]);

  // Trạng thái 1: Paid (Mock thanh toán tự động) + tiền server tính = 1.000.000.
  await expect(page.getByText("Đã thanh toán").first()).toBeVisible();
  await expect(page.getByText(/1\.000\.000/).first()).toBeVisible();
  await expect(page.getByText("Khởi hành:")).toBeVisible();

  // 3) Admin xác nhận đơn: Paid -> Confirmed (thủ công).
  const confirmed = await api.put(`/api/bookings/${bookingId}/status`, {
    headers: adminAuth,
    data: { status: "Confirmed", note: "Admin xác nhận đơn" },
  });
  expect(confirmed.status(), "xác nhận").toBe(200);
  await expectBookingStatus(page, bookingId, "Đã xác nhận");

  // 4) Job lifecycle: Confirmed -> Ongoing (mốc khởi hành đã qua).
  await restartBackend(api);
  await expectBookingStatus(page, bookingId, "Đang diễn ra");

  // 5) Đưa EndDate về quá khứ rồi restart: Ongoing -> Completed + tour Hidden.
  const past = new Date(Date.now() - 60_000).toISOString();
  const updateEnd = await api.put(`/api/tours/${tourId}`, {
    headers: adminAuth,
    data: { ...tourBody, endDate: past },
  });
  expect(updateEnd.status(), "đưa endDate về quá khứ").toBe(200);
  await restartBackend(api);
  await expectBookingStatus(page, bookingId, "Hoàn thành");

  // 6) Kiểm chứng tracking + audit + tour ẩn qua API.
  const booking = await (await api.get(`/api/bookings/${bookingId}`, { headers: adminAuth })).json();
  expect(booking.status).toBe("Completed");
  const steps = (booking.tracking as { status: string; by: string }[]).map((s) => s.status);
  expect(steps).toEqual(["PendingPayment", "Paid", "Confirmed", "Ongoing", "Completed"]);
  expect((booking.tracking as { by: string }[]).filter((s) => s.by === "system").length).toBeGreaterThanOrEqual(2);

  const tourAfter = await (await api.get(`/api/tours/${tourId}`, { headers: adminAuth })).json();
  expect(tourAfter.status).toBe("Hidden");

  const audit = await (
    await api.get("/api/audit-logs", { headers: adminAuth, params: { entityType: "Booking", entityId: bookingId, pageSize: 50 } })
  ).json();
  const newest = (audit.items as { newValue: string }[])[0].newValue;
  expect(newest).toBe("Completed");

  // 7) UI MyBookings hiển thị chuyến đã hoàn thành (scope vào card theo tên tour).
  await page.goto("/my-bookings");
  const card = page.getByRole("heading", { name: tourName }).locator("..");
  await expect(card).toBeVisible();
  await expect(card.getByText("Hoàn thành").first()).toBeVisible();

  await api.dispose();
});
