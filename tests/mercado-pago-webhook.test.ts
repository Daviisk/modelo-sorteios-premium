import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import crypto from "node:crypto";
const sync = vi.hoisted(() => vi.fn());
vi.mock("@/lib/services/paymentService", async () => {
  const { verifyMercadoPagoSignature } = await import("../src/lib/services/mercadoPago");
  return { syncMercadoPagoPayment: sync, getPaymentProvider: () => ({ verifyWebhook: (headers: Headers, _raw: string, id: string) => verifyMercadoPagoSignature(headers, id) }) };
});
import { POST } from "../src/app/api/webhooks/payment/route";
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("PAYMENT_PROVIDER", "mercadopago"); vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", "secret"); sync.mockResolvedValue(undefined); });
afterEach(() => { vi.unstubAllEnvs(); });
function request(bodyId = "ORD123ABC", valid = true) {
  const signature = crypto.createHmac("sha256", "secret").update("id:ord123abc;request-id:r1;ts:123;").digest("hex");
  return new NextRequest("https://example.com/api/webhooks/payment?data.id=ORD123ABC&type=order", { method: "POST", headers: { "x-request-id": "r1", "x-signature": `ts=123,v1=${valid ? signature : "0".repeat(64)}` }, body: JSON.stringify({ type: "order", action: "order.processed", data: { id: bodyId } }) });
}
it("reconciles signed Order notifications through the gateway", async () => {
  expect((await POST(request())).status).toBe(200);
  expect(sync).toHaveBeenCalledWith("ORD123ABC");
});
it("rejects forged signatures before reconciliation", async () => {
  expect((await POST(request("ORD123ABC", false))).status).toBe(401);
  expect(sync).not.toHaveBeenCalled();
});
it("rejects a body ID that differs from the signed query ID", async () => {
  expect((await POST(request("ORDOTHER"))).status).toBe(400);
  expect(sync).not.toHaveBeenCalled();
});
it("allows gateway retries when reconciliation fails", async () => {
  sync.mockRejectedValue(new Error("gateway unavailable"));
  expect((await POST(request())).status).toBe(503);
});
it.each(["null", "[]", "false", "1"])("rejects non-object webhook JSON (%s) without throwing", async body => {
  expect((await POST(new NextRequest("https://example.com/api/webhooks/payment", { method: "POST", body }))).status).toBe(400);
  expect(sync).not.toHaveBeenCalled();
});
it("rejects oversized webhook bodies before reconciliation", async () => {
  expect((await POST(new NextRequest("https://example.com/api/webhooks/payment", { method: "POST", body: JSON.stringify({ type: "order", padding: "x".repeat(8192) }) }))).status).toBe(413);
  expect(sync).not.toHaveBeenCalled();
});

