import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), remove: vi.fn(), invalidate: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/services/raffleService", () => ({ updateRaffle: vi.fn() }));
vi.mock("@/lib/services/deleteRaffle", () => ({ deleteRaffle: mocks.remove }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.invalidate }));
import { DELETE } from "../src/app/api/admin/rifas/[id]/route";
const params = { params: { id: "r1" } };
function req(body: unknown, origin = "https://example.com") {
  return new NextRequest("https://example.com/api/admin/rifas/r1", { method: "DELETE", headers: { origin }, body: JSON.stringify(body) });
}
beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue({ sub: "admin" }); mocks.remove.mockResolvedValue(true); });
it("blocks unauthenticated deletion", async () => {
  mocks.auth.mockRejectedValue(new Error("UNAUTHORIZED"));
  expect((await DELETE(req({ confirmation: "EXCLUIR", raffleId: "r1" }), params)).status).toBe(401);
  expect(mocks.remove).not.toHaveBeenCalled();
});
it("requires confirmation for the exact raffle", async () => {
  for (const body of [{}, { confirmation: "EXCLUIR", raffleId: "r2" }]) expect((await DELETE(req(body), params)).status).toBe(400);
  expect(mocks.remove).not.toHaveBeenCalled();
});
it("blocks cross-origin deletion", async () => {
  expect((await DELETE(req({ confirmation: "EXCLUIR", raffleId: "r1" }, "https://attacker.test"), params)).status).toBe(403);
  expect(mocks.remove).not.toHaveBeenCalled();
});
it("deletes only the confirmed raffle and refreshes cached pages", async () => {
  expect((await DELETE(req({ confirmation: "EXCLUIR", raffleId: "r1" }), params)).status).toBe(200);
  expect(mocks.remove).toHaveBeenCalledWith("r1");
  expect(mocks.invalidate).toHaveBeenCalled();
});
it("reports a missing raffle", async () => {
  mocks.remove.mockResolvedValue(false);
  expect((await DELETE(req({ confirmation: "EXCLUIR", raffleId: "r1" }), params)).status).toBe(404);
});
it("reports transaction failure without leaking database details", async () => {
  mocks.remove.mockRejectedValue(new Error("private database details"));
  const result = await DELETE(req({ confirmation: "EXCLUIR", raffleId: "r1" }), params);
  expect(result.status).toBe(409);
  expect(JSON.stringify(await result.json())).not.toContain("private database");
});

