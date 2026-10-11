import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), set: vi.fn(), get: vi.fn(), delete: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.findUnique } } }));
vi.mock("next/headers", () => ({ cookies: () => ({ set: mocks.set, get: mocks.get, delete: mocks.delete }) }));
import { login, getSession, logout } from "../src/lib/auth";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.AUTH_SECRET = "test-secret-for-admin-session-validation";
});

describe("admin authentication", () => {
  it("accepts the seed password and creates an ADMIN session", async () => {
    const user = { id: "demo-admin", email: "admin@rifademo.com.br", role: "ADMIN", password: await bcrypt.hash("admin123", 12) };
    mocks.findUnique.mockResolvedValue(user);
    await login(user.email, "admin123");
    expect(mocks.findUnique).toHaveBeenCalledWith({ where: { email: user.email } });
    const [name, token, options] = mocks.set.mock.calls[0];
    expect(name).toBe("rifa_admin_session");
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    expect(payload).toMatchObject({ sub: user.id, role: "ADMIN", email: user.email });
    mocks.get.mockReturnValue({ value: token });
    expect(await getSession()).toMatchObject({ sub: user.id, role: "ADMIN" });
  });
  it("reports missing AUTH_SECRET without creating a session", async () => {
    delete process.env.AUTH_SECRET;
    mocks.findUnique.mockResolvedValue({ id: "demo-admin", email: "admin@rifademo.com.br", role: "ADMIN", password: await bcrypt.hash("admin123", 12) });
    await expect(login("admin@rifademo.com.br", "admin123")).rejects.toThrow("configure AUTH_SECRET");
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("rejects an incorrect password without setting a cookie", async () => {
    mocks.findUnique.mockResolvedValue({ role: "ADMIN", password: await bcrypt.hash("admin123", 12) });
    await expect(login("admin@rifademo.com.br", "wrong-password")).rejects.toThrow("Credenciais inválidas.");
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("rejects missing users and non-admin users", async () => {
    mocks.findUnique.mockResolvedValue(null);
    await expect(login("missing@example.com", "admin123")).rejects.toThrow();
    mocks.findUnique.mockResolvedValue({ role: "PARTICIPANT" });
    await expect(login("participant@example.com", "admin123")).rejects.toThrow();
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("rejects invalid sessions and clears the session on logout", async () => {
    mocks.get.mockReturnValue({ value: "invalid-token" });
    expect(await getSession()).toBeNull();
    await logout();
    expect(mocks.delete).toHaveBeenCalledWith("rifa_admin_session");
  });
  it("revokes existing sessions after a password change or admin role removal", async () => {
    const user = { id: "admin-1", email: "admin@example.com", role: "ADMIN", password: await bcrypt.hash("long-password", 4) };
    mocks.findUnique.mockResolvedValue(user);
    await login(user.email, "long-password");
    mocks.get.mockReturnValue({ value: mocks.set.mock.calls[0][1] });
    mocks.findUnique.mockResolvedValue({ ...user, password: await bcrypt.hash("new-long-password", 4) });
    expect(await getSession()).toBeNull();
    mocks.findUnique.mockResolvedValue({ ...user, role: "USER" });
    expect(await getSession()).toBeNull();
  });

});

