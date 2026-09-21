import { test, expect, type Page } from "@playwright/test";
import { uniqueName } from "./constants";

async function loginUI(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("Địa chỉ email").fill(username);
  await page.getByPlaceholder("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test("trang login/register không còn social login và quên mật khẩu giả", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Quên mật khẩu")).toHaveCount(0);
  await expect(page.getByText(/Facebook|Google/)).toHaveCount(0);

  await page.goto("/register");
  await expect(page.getByText(/Facebook|Google/)).toHaveCount(0);
  // route quên mật khẩu đã bỏ -> SPA trả NotFound
  await page.goto("/forgot-password");
  await expect(page.getByText(/Không tìm thấy trang|404/i)).toBeVisible();
});

test("đăng ký tài khoản mới qua UI", async ({ page }) => {
  const username = uniqueName("uife");
  await page.goto("/register");
  await page.getByPlaceholder("VD: longphap").fill(username);
  await page.getByPlaceholder("email@example.com").fill(`${username}@example.com`);
  const pw = page.getByPlaceholder("••••••••");
  await pw.nth(0).fill("Secret123");
  await pw.nth(1).fill("Secret123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/register"));
  await expect(page).toHaveURL(/\/$/);
});

test("admin: thêm, sửa, xóa người dùng", async ({ page }) => {
  await loginUI(page, "admin", "Admin123!");
  await page.goto("/admin/users");
  await expect(page.getByRole("button", { name: "Thêm người dùng" })).toBeVisible();

  const username = uniqueName("uiadm");
  await page.getByRole("button", { name: "Thêm người dùng" }).click();
  await page.getByPlaceholder("VD: customer3").fill(username);
  await page.getByPlaceholder("email@example.com").fill(`${username}@example.com`);
  await page.getByPlaceholder("••••••••").fill("Secret123");
  await page.getByRole("button", { name: "Lưu" }).click();
  await expect(page.getByRole("cell", { name: username, exact: true })).toBeVisible();

  let row = page.getByRole("row").filter({ hasText: username });
  await row.getByRole("button", { name: "Sửa" }).click();
  await page.getByPlaceholder("email@example.com").fill(`${username}b@example.com`);
  await page.getByRole("button", { name: "Lưu" }).click();
  await expect(page.getByRole("cell", { name: `${username}b@example.com`, exact: true })).toBeVisible();

  row = page.getByRole("row").filter({ hasText: username });
  await row.getByRole("button", { name: "Xóa" }).click();
  await page.getByRole("button", { name: "Xác nhận" }).click();
  await expect(page.getByRole("cell", { name: username, exact: true })).toHaveCount(0);
});

test("public: lọc tour theo tên", async ({ page }) => {
  await page.goto("/tours");
  await page.getByPlaceholder("VD: Hạ Long").fill("Hạ Long");
  await page.getByRole("button", { name: "Tìm", exact: true }).click();
  await expect(page.getByRole("link").filter({ hasText: "Chi tiết" }).first()).toBeVisible();
  await expect(page.getByText(/Hạ Long/).first()).toBeVisible();
});

test("customer: đặt tour end-to-end tới checkout", async ({ page }) => {
  await loginUI(page, "customer1", "Customer123!");
  await page.goto("/tours");
  await page.getByRole("link").filter({ hasText: "Chi tiết" }).first().click();
  await page.waitForURL(/\/tours\/\d+/);
  await page.getByRole("button", { name: "Đặt ngay" }).click();
  await page.waitForURL(/\/booking\/\d+/);

  await page.getByPlaceholder("Nguyễn Văn A").fill("Khách E2E");
  await page.getByPlaceholder("email@example.com").fill("khach.e2e@example.com");
  await page.getByPlaceholder("0912345678").fill("0912345678");
  await page.getByRole("button", { name: "Xác nhận đặt" }).click();
  await page.waitForURL(/\/checkout\/\d+/);
  await expect(page.getByText("Checkout")).toBeVisible();
});
