import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "node:crypto";
import { createMercadoPagoPix, getMercadoPagoPayment, verifyMercadoPagoSignature, normalizeMercadoPagoOrder } from "../src/lib/services/mercadoPago";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2030-01-01T11:28:00Z"));
  vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "test-token");
  vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", "test-webhook-secret");
  vi.stubEnv("MERCADOPAGO_NOTIFICATION_URL", "https://example.com/api/webhooks/payment");
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const orderResponse = { id: "ORD123ABC", type: "online", country_code: "BRA", status: "action_required", external_reference: "order-1", total_amount: "12.50", transactions: { payments: [{ amount: "12.50", status: "action_required", payment_method: { id: "pix", qr_code: "pix-copy", qr_code_base64: "image" } }] } };
const params = { orderId: "order-1", amount: 12.5, name: "Cliente Teste", cpf: "12345678909", email: "test@example.com", expiresAt: new Date("2030-01-01T12:00:00Z") };

describe("Mercado Pago PIX", () => {
  it("sends payer data, expiration and stable idempotency key to the orders API", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => orderResponse });
    vi.stubGlobal("fetch", fetch);
    await createMercadoPagoPix(params);
    const [url, request] = fetch.mock.calls[0];
    expect(url).toBe("https://api.mercadopago.com/v1/orders");
    expect(request.headers["X-Idempotency-Key"]).toBe("pix-order-order-1");
    expect(request.headers.Authorization).toBe("Bearer test-token");
    expect(JSON.parse(request.body)).toEqual({ type: "online", processing_mode: "automatic", external_reference: "order-1", total_amount: "12.50", payer: { email: params.email }, transactions: { payments: [{ amount: "12.50", payment_method: { id: "pix", type: "bank_transfer" }, expiration_time: "PT1920S" }] } });
  });
  it("does not expose the gateway token in credential errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: "test-token" }) }));
    await expect(createMercadoPagoPix(params)).rejects.toThrow("recusou as credenciais");
  });
  it("rejects missing configuration and insecure webhook URLs before requesting a charge", async () => {
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "");
    await expect(createMercadoPagoPix(params)).rejects.toThrow("Configure");
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "test-token");
    vi.stubEnv("MERCADOPAGO_NOTIFICATION_URL", "http://example.com");
    await expect(createMercadoPagoPix(params)).rejects.toThrow("HTTPS");
  });
  it("validates signatures and rejects tampered IDs, signatures and missing headers", () => {
    const signature = crypto.createHmac("sha256", "test-webhook-secret").update("id:123;request-id:req-1;ts:1234567890;").digest("hex");
    const headers = new Headers({ "x-request-id": "req-1", "x-signature": `ts=1234567890,v1=${signature}` });
    expect(verifyMercadoPagoSignature(headers, "123")).toBe(true);
    expect(verifyMercadoPagoSignature(headers, "124")).toBe(false);
    expect(verifyMercadoPagoSignature(new Headers(), "123")).toBe(false);
    headers.set("x-signature", "ts=123,v1=bad");
    expect(verifyMercadoPagoSignature(headers, "123")).toBe(false);
  });
  it("rejects payment IDs that could change the requested API path", async () => {
    expect(() => getMercadoPagoPayment("../users")).toThrow("ID de pagamento inválido");
  });
});

it("only normalizes full accredited orders as approved", () => {
  const order = structuredClone(orderResponse) as any;
  order.status = "processed"; order.status_detail = "accredited";
  order.total_paid_amount = "12.50";
  Object.assign(order.transactions.payments[0], { status: "processed", status_detail: "accredited", paid_amount: "12.50" });
  expect(normalizeMercadoPagoOrder(order)).toMatchObject({ status: "approved", currency_id: "BRL", transaction_amount: 12.5 });
  order.transactions.payments[0].paid_amount = "1.00";
  expect(normalizeMercadoPagoOrder(order).status).toBe("pending");
  order.transactions.payments.push(order.transactions.payments[0]);
  expect(() => normalizeMercadoPagoOrder(order)).toThrow("Order inválida");
});
it("retrieves ORD IDs from Orders and keeps numeric legacy IDs readable", async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => orderResponse });
  vi.stubGlobal("fetch", fetch);
  expect(await getMercadoPagoPayment("ORD123ABC")).toMatchObject({ id: "ORD123ABC", status: "pending" });
  expect(fetch.mock.calls[0][0]).toBe("https://api.mercadopago.com/v1/orders/ORD123ABC");
  await getMercadoPagoPayment("123");
  expect(fetch.mock.calls[1][0]).toBe("https://api.mercadopago.com/v1/payments/123");
});
it("rejects expired reserves before calling the gateway", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  await expect(createMercadoPagoPix({ ...params, expiresAt: new Date() })).rejects.toThrow("30 minutos");
  expect(fetch).not.toHaveBeenCalled();
});
it("validates alphanumeric order signatures using lowercase manifest IDs", () => {
  const signature = crypto.createHmac("sha256", "test-webhook-secret").update("id:ord123abc;request-id:req-1;ts:1234567890;").digest("hex");
  expect(verifyMercadoPagoSignature(new Headers({ "x-request-id": "req-1", "x-signature": `ts=1234567890,v1=${signature}` }), "ORD123ABC")).toBe(true);
});

