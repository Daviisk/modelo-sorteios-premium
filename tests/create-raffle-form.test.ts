import { expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const create = vi.hoisted(() => vi.fn().mockResolvedValue({ id: "r1" }));
vi.mock("@/lib/auth", () => ({ requireAdmin: vi.fn().mockResolvedValue({ sub: "admin" }) }));
vi.mock("@/lib/services/raffleService", () => ({ createRaffle: create }));
import { POST } from "../src/app/api/admin/rifas/route";
it("creates a raffle with an uploaded image without requiring a prize valuation", async () => {
  const response = await POST(new NextRequest("https://example.com/api/admin/rifas", {
    method: "POST", body: JSON.stringify({ title: "Kit 3 Dobrões", slug: "3-dobroes", description: "Kit com bolsa de couro", prize: "Kit Capoeira", numberPrice: 10, totalNumbers: 100, drawDate: "2026-11-14T12:00", imageUrl: "data:image/png;base64,iVBORw0KGgo=" })
  }));
  expect(response.status).toBe(200);
  expect(create).toHaveBeenCalledWith(expect.objectContaining({ prizeValue: 0, numberPrice: 10 }));
});

