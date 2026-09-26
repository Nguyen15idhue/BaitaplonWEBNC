export const API_BASE = process.env.API_BASE_URL ?? "http://localhost:5000";

export const ADMIN = { usernameOrEmail: "admin", password: "Admin123!" };
export const CUSTOMER = { usernameOrEmail: "customer1", password: "Customer123!" };

export const uniqueName = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
