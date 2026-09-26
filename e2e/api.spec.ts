import { test, expect, request, type APIRequestContext } from "@playwright/test";
import { API_BASE, ADMIN, CUSTOMER, uniqueName } from "./constants";

let api: APIRequestContext;
let adminToken: string;
let customerToken: string;

async function login(ctx: APIRequestContext, creds: { usernameOrEmail: string; password: string }) {
  const res = await ctx.post("/api/auth/login", { data: creds });
  expect(res.status(), `login ${creds.usernameOrEmail}`).toBe(200);
  return (await res.json()).accessToken as string;
}

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

test.beforeAll(async () => {
  api = await request.newContext({ baseURL: API_BASE });
  adminToken = await login(api, ADMIN);
  customerToken = await login(api, CUSTOMER);
});

test.afterAll(async () => {
  await api.dispose();
});

test("health trả db up", async () => {
  const res = await api.get("/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(body.db).toBe("up");
});

test("tours public + destinations public", async () => {
  const tours = await api.get("/api/tours", { params: { pageSize: 3 } });
  expect(tours.status()).toBe(200);
  const t = await tours.json();
  expect(Array.isArray(t.items)).toBeTruthy();
  expect(t.items.length).toBeGreaterThan(0);
  expect(t.items[0]).toHaveProperty("priceFrom");
  expect(t.items[0]).toHaveProperty("availableSeats");

  const dest = await api.get("/api/destinations");
  expect(dest.status()).toBe(200);
  expect((await dest.json()).length).toBeGreaterThan(0);
});

test("RBAC: không token 401, sai role 403, tự khóa 400", async () => {
  expect((await api.get("/api/auth/me")).status()).toBe(401);
  expect((await api.get("/api/users?page=1")).status()).toBe(401);
  expect((await api.get("/api/users?page=1", { headers: auth(customerToken) })).status()).toBe(403);
  expect((await api.get("/api/auth/me", { headers: auth(adminToken) })).status()).toBe(200);
  const selfLock = await api.put("/api/users/1/lock", { headers: auth(adminToken), data: { locked: true } });
  expect(selfLock.status()).toBe(400);
});

test("user CRUD: thêm/sửa/xóa + chống trùng + audit", async () => {
  const username = uniqueName("e2euser");
  const email = `${username}@example.com`;

  const create = await api.post("/api/users", {
    headers: auth(adminToken),
    data: { username, email, password: "Secret123", role: "Customer", status: "Active" },
  });
  expect(create.status()).toBe(201);
  const created = await create.json();
  expect(created.username).toBe(username);
  const id = created.id as number;

  // Trùng username -> 409
  const dup = await api.post("/api/users", {
    headers: auth(adminToken),
    data: { username, email: `${username}2@example.com`, password: "Secret123", role: "Customer", status: "Active" },
  });
  expect(dup.status()).toBe(409);

  // Sửa
  const updated = await api.put(`/api/users/${id}`, {
    headers: auth(adminToken),
    data: { email: `${username}b@example.com`, role: "Customer", status: "Locked" },
  });
  expect(updated.status()).toBe(200);
  expect((await updated.json()).status).toBe("Locked");

  // Audit có User.Create
  const audit = await api.get("/api/audit-logs", {
    headers: auth(adminToken),
    params: { entityType: "User", entityId: id, pageSize: 50 },
  });
  expect(audit.status()).toBe(200);
  const actions = ((await audit.json()).items as { action: string }[]).map((a) => a.action);
  expect(actions).toContain("User.Create");

  // Xóa
  expect((await api.delete(`/api/users/${id}`, { headers: auth(adminToken) })).status()).toBe(200);
  const after = await api.get("/api/users", { headers: auth(adminToken), params: { search: username } });
  expect((await after.json()).total).toBe(0);
});

test("booking breakdown: tiền do server tính + lưu liên hệ", async () => {
  const detail = await api.get("/api/tours/1");
  const prices = (await detail.json()).prices as { sourceName: string; priceValue: number }[];
  const priceOf = (name: string) => prices.find((p) => p.sourceName.toLowerCase() === name)?.priceValue ?? 0;
  const adult = priceOf("người lớn");
  const child = priceOf("trẻ em") || adult;
  const supp = priceOf("phụ thu");
  const expected = adult * 2 + child * 1 + supp * 1;

  const res = await api.post("/api/bookings", {
    headers: { ...auth(customerToken), "Idempotency-Key": uniqueName("e2e-") },
    data: {
      tourId: 1, adultQty: 2, childQty: 1, supplementQty: 1,
      contactName: "E2E Tester", contactEmail: "e2e@example.com", contactPhone: "0900000001", note: "note e2e",
    },
  });
  expect(res.status()).toBe(201);
  const booking = await res.json();
  expect(booking.quantity).toBe(3);
  expect(booking.checkout.amount).toBe(expected);
  expect(booking.contactName).toBe("E2E Tester");
  expect(booking.contactEmail).toBe("e2e@example.com");
  expect(booking.note).toBe("note e2e");
});

test("giá sai 422 + hết chỗ 409", async () => {
  const admin = auth(adminToken);
  const badPrice = await api.post("/api/tours/1/prices", {
    headers: admin,
    data: { sourceName: "E2E", priceValue: -5, effectiveDate: new Date().toISOString() },
  });
  expect(badPrice.status()).toBe(422);

  const oversell = await api.post("/api/bookings", {
    headers: { ...auth(customerToken), "Idempotency-Key": uniqueName("e2e-") },
    data: { tourId: 1, adultQty: 99999, childQty: 0, supplementQty: 0 },
  });
  expect(oversell.status()).toBe(409);
});

test("register công khai tạo được user", async () => {
  const username = uniqueName("e2ereg");
  const res = await api.post("/api/auth/register", {
    data: { username, email: `${username}@example.com`, password: "Secret123" },
  });
  expect(res.status()).toBe(201);
  expect((await res.json()).username).toBe(username);
});
