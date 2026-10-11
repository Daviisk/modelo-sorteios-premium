import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ release: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/services/numberService", () => ({ releaseExpiredReservations: mocks.release }));
vi.mock("@/lib/prisma", () => ({ prisma: { order: { updateMany: mocks.update } } }));
import { GET } from "../src/app/api/cron/release-expired/route";
beforeEach(() => { vi.clearAllMocks(); mocks.release.mockResolvedValue({ count: 1 }); mocks.update.mockResolvedValue({ count: 1 }); });
afterEach(() => vi.unstubAllEnvs());
it.each([undefined, "", "   "])("denies an unconfigured cron secret (%s) before changing reservations", async secret => {
  vi.stubEnv("CRON_SECRET", secret);
  if (secret === undefined) delete process.env.CRON_SECRET;
  const response = await GET(new NextRequest("https://example.com/api/cron/release-expired", { headers: { authorization: `Bearer ${secret}` } }));
  expect(response.status).toBe(401); expect(mocks.release).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled();
});
it("rejects missing and incorrect credentials and accepts only the configured secret", async () => {
  vi.stubEnv("CRON_SECRET", "configured-secret");
  for (const authorization of ["", "Bearer wrong", "Bearer undefined"]) {
    expect((await GET(new NextRequest("https://example.com/api/cron/release-expired", { headers: { authorization } }))).status).toBe(401);
  }
  expect(mocks.release).not.toHaveBeenCalled();
  expect((await GET(new NextRequest("https://example.com/api/cron/release-expired", { headers: { authorization: "Bearer configured-secret" } }))).status).toBe(200);
});

