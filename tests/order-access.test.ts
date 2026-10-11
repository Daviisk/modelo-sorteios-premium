import { beforeEach, expect, it, vi } from "vitest";
import { SignJWT } from "jose";
const mocks = vi.hoisted(() => ({ values: new Map<string, string>(), set: vi.fn(), session: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => ({ get: (name: string) => mocks.values.has(name) ? { value: mocks.values.get(name) } : undefined, set: mocks.set }) }));
vi.mock("@/lib/auth", () => ({ getSession: mocks.session }));
import { canReadOrder, grantOrderAccess } from "../src/lib/orderAccess";
beforeEach(() => { mocks.values.clear(); vi.clearAllMocks(); mocks.session.mockResolvedValue(null); vi.stubEnv("AUTH_SECRET", "order-access-test-secret"); });
it("denies IDs without an authorization cookie", async () => { expect(await canReadOrder("order-1")).toBe(false); });
it("grants a secure cookie scoped to the exact order", async () => {
  await grantOrderAccess("order-1");
  const [name, token, options] = mocks.set.mock.calls[0];
  expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", maxAge: 2592000 });
  mocks.values.set(name, token);
  expect(await canReadOrder("order-1")).toBe(true);
  mocks.values.set("rifa_order_order-2", token);
  expect(await canReadOrder("order-2")).toBe(false);
});
it("rejects tampered and expired cookies", async () => {
  mocks.values.set("rifa_order_order-1", "tampered");
  expect(await canReadOrder("order-1")).toBe(false);
  mocks.values.set("rifa_order_order-1", await new SignJWT({ purpose: "order-read" }).setSubject("order-1").setProtectedHeader({ alg: "HS256" }).setExpirationTime(1).sign(new TextEncoder().encode("order-access-test-secret")));
  expect(await canReadOrder("order-1")).toBe(false);
});
it("allows administrator access but never a non-admin session", async () => {
  mocks.session.mockResolvedValue({ role: "USER" }); expect(await canReadOrder("order-1")).toBe(false);
  mocks.session.mockResolvedValue({ role: "ADMIN" }); expect(await canReadOrder("order-1")).toBe(true);
});

