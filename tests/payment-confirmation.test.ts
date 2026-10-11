import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), transaction: vi.fn(), remote: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { payment: { findUnique: mocks.findUnique }, $transaction: mocks.transaction } }));
vi.mock("../src/lib/services/mercadoPago", () => ({ getMercadoPagoPayment: mocks.remote, createMercadoPagoPix: vi.fn(), verifyMercadoPagoSignature: vi.fn() }));
import { confirmPayment, syncMercadoPagoPayment } from "../src/lib/services/paymentService";
beforeEach(() => { vi.clearAllMocks(); });
it("does not confirm a payment for a different order or amount", async () => {
  mocks.findUnique.mockResolvedValue({ provider: "mercadopago", orderId: "order-1", amount: 10, status: "PENDING" });
  mocks.remote.mockResolvedValue({ id: 123, external_reference: "other-order", transaction_amount: 10, currency_id: "BRL", payment_method_id: "pix", status: "approved" });
  await expect(syncMercadoPagoPayment("123")).rejects.toThrow("não corresponde");
  mocks.remote.mockResolvedValue({ id: 123, external_reference: "order-1", transaction_amount: 1, currency_id: "BRL", payment_method_id: "pix", status: "approved" });
  await expect(syncMercadoPagoPayment("123")).rejects.toThrow("não corresponde");
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("does not repeat changes for an already approved payment", async () => {
  const update = vi.fn();
  mocks.transaction.mockImplementation(async (fn: any) => fn({ payment: { findUnique: async () => ({ status: "APPROVED" }), update } }));
  expect(await confirmPayment("123", "event-1", {})).toEqual({ alreadyProcessed: true });
  expect(update).not.toHaveBeenCalled();
});
it("blocks confirmation when the reserved numbers no longer match the order items", async () => {
  const update = vi.fn();
  mocks.transaction.mockImplementation(async (fn: any) => fn({
    payment: { findUnique: async () => ({ id: "p1", orderId: "o1", status: "PENDING", order: { participantId: "client", items: [{ id: "item-1" }] } }), update },
    raffleNumber: { updateMany: async () => ({ count: 0 }) },
  }));
  await expect(confirmPayment("123", "event-1", {})).rejects.toThrow("perda da reserva");
  expect(update).not.toHaveBeenCalled();
});
it("confirms payment, order, numbers and event in the same transaction", async () => {
  const paymentUpdate = vi.fn(), orderUpdate = vi.fn(), eventCreate = vi.fn();
  mocks.transaction.mockImplementation(async (fn: any) => fn({
    payment: { findUnique: async () => ({ id: "p1", orderId: "o1", status: "PENDING", order: { participantId: "client", items: [{ id: "item-1" }] } }), update: paymentUpdate },
    raffleNumber: { updateMany: async () => ({ count: 1 }) },
    order: { update: orderUpdate }, webhookEvent: { create: eventCreate },
  }));
  await confirmPayment("123", "event-1", {});
  expect(paymentUpdate).toHaveBeenCalledWith({ where: { id: "p1" }, data: { status: "APPROVED", paidAt: expect.any(Date) } });
  expect(orderUpdate).toHaveBeenCalledWith({ where: { id: "o1" }, data: { status: "PAID" } });
  expect(eventCreate).toHaveBeenCalled();
});

