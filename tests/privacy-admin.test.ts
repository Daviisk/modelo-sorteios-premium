import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn(), anonymize: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: { participant: { findUnique: mocks.find, update: mocks.update } } }));
vi.mock("@/lib/services/participantService", () => ({ anonymizeParticipant: mocks.anonymize }));
import { GET, POST, PATCH } from "../src/app/api/admin/participantes/[id]/route";
beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue({ sub: "admin" }); mocks.find.mockResolvedValue({ id: "p1", orders: [] }); });
const params = { params: { id: "p1" } };
function req(body: unknown, origin = "https://example.com", method = "POST") { return new NextRequest("https://example.com/api/admin/participantes/p1", { method, headers: { origin }, body: JSON.stringify(body) }); }
it("never exports data without administrator authentication", async () => {
  mocks.auth.mockRejectedValue(new Error("UNAUTHORIZED"));
  expect((await GET(req(null), params)).status).toBe(401);
  expect(mocks.find).not.toHaveBeenCalled();
});
it("requires identity and retention review and rejects cross-site removal", async () => {
  expect((await POST(req({ action: "remove-identifiers" }), params)).status).toBe(422);
  expect((await POST(req({ action: "remove-identifiers", identityVerified: true, retentionReviewed: true }, "https://attacker.test"), params)).status).toBe(403);
  expect(mocks.anonymize).not.toHaveBeenCalled();
});
it("blocks removal while a reservation needs its contact details", async () => {
  mocks.find.mockResolvedValue({ id: "p1", orders: [{ id: "o1" }] });
  expect((await POST(req({ action: "remove-identifiers", identityVerified: true, retentionReviewed: true }), params)).status).toBe(409);
  expect(mocks.anonymize).not.toHaveBeenCalled();
});
it("removes identifiers only after the checks", async () => {
  expect((await POST(req({ action: "remove-identifiers", identityVerified: true, retentionReviewed: true }), params)).status).toBe(200);
  expect(mocks.anonymize).toHaveBeenCalledWith("p1");
});
it("normalizes an authenticated contact correction without collecting CPF", async () => {
  mocks.update.mockResolvedValue({ id: "p1" });
  expect((await PATCH(req({ identityVerified: true, contact: { name: "João Silva", phone: "(62) 99999-1234", email: "joao@example.com" } }, "https://example.com", "PATCH"), params)).status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: { name: "João Silva", phone: "62999991234", email: "joao@example.com" } }));
});

