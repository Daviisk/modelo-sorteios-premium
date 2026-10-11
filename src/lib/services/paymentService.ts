import { prisma } from "@/lib/prisma";
import { PaymentStatus, OrderStatus } from "@prisma/client";
import { getMercadoPagoPayment, createMercadoPagoPix, verifyMercadoPagoSignature } from "./mercadoPago";
import { Prisma } from "@prisma/client";
import QRCode from "qrcode";
import crypto from "crypto";

export interface PaymentProvider {
  /** Cria uma cobrança PIX e retorna QR code + copia-e-cola. */
  createCharge(params: {
    orderId: string;
    amount: number;
  }): Promise<{ transactionId: string; qrCode: string; pixCopyPaste: string; expiresAt: Date }>;

  /** Consulta o status atual de uma cobrança no gateway. */
  getStatus(transactionId: string): Promise<PaymentStatus>;

  /** Valida a autenticidade de um payload de webhook (assinatura, etc.). */
  verifyWebhook(headers: Headers, rawBody: string, dataId?: string): boolean;

  /** Extrai o transactionId e o novo status a partir do payload do webhook. */
  parseWebhook(payload: any): { transactionId: string; status: PaymentStatus; externalId: string };
}

/** Provider de demonstração, sem cobrança real. */
class MockPaymentProvider implements PaymentProvider {
  async createCharge({ orderId, amount }: { orderId: string; amount: number }) {
    const transactionId = `mock_${crypto.randomUUID()}`;
    const pixCopyPaste = `00020126580014BR.GOV.BCB.PIX-DEMO-${orderId}-${amount}5204000053039865802BR6009RIFADEMO`;
    const qrCode = await QRCode.toDataURL(pixCopyPaste);
    const expiresAt = new Date(Date.now() + 15 * 60_000);
    return { transactionId, qrCode, pixCopyPaste, expiresAt };
  }

  async getStatus(): Promise<PaymentStatus> {
    // Em produção real, consultaria a API do gateway.
    return PaymentStatus.PENDING;
  }

  verifyWebhook(): boolean {
    // Provider mock não recebe webhooks externos reais; a "aprovação" é
    // disparada pelo endpoint interno /api/dev/simulate-payment.
    return true;
  }

  parseWebhook(payload: any) {
    return {
      transactionId: payload.transactionId,
      status: payload.status as PaymentStatus,
      externalId: payload.externalId ?? payload.transactionId,
    };
  }
}

class MercadoPagoProvider implements PaymentProvider {
  async createCharge({ orderId, amount }: { orderId: string; amount: number }) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { participant: true } });
    if (!order?.expiresAt) throw new Error("Pedido não encontrado.");
    const result = await createMercadoPagoPix({ orderId, amount, ...order.participant, expiresAt: order.expiresAt });
    const pix = result.point_of_interaction?.transaction_data;
    if (!pix?.qr_code) throw new Error("Mercado Pago não retornou o código PIX.");
    return {
      transactionId: String(result.id),
      pixCopyPaste: pix.qr_code,
      qrCode: pix.qr_code_base64 ? `data:image/png;base64,${pix.qr_code_base64}` : await QRCode.toDataURL(pix.qr_code),
      expiresAt: new Date(result.date_of_expiration ?? order.expiresAt),
    };
  }
  async getStatus(id: string): Promise<PaymentStatus> {
    const payment = await getMercadoPagoPayment(id);
    return payment.status === "approved" ? PaymentStatus.APPROVED : PaymentStatus.PENDING;
  }
  verifyWebhook(headers: Headers, _body: string, dataId?: string) {
    return verifyMercadoPagoSignature(headers, dataId ?? "");
  }
  parseWebhook(payload: any) {
    return { transactionId: String(payload.data?.id ?? ""), status: PaymentStatus.PENDING, externalId: `mp-${payload.id}` };
  }
}

export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? "mock";
  switch (name) {
    case "mercadopago":
      return new MercadoPagoProvider();
    case "mock":
      return new MockPaymentProvider();
    default:
      throw new Error(`Gateway ${name} ainda não implementado. A cobrança não foi criada.`);
  }
}

export async function createPayment(orderId: string, amount: number) {
  const provider = getPaymentProvider();
  const charge = await provider.createCharge({ orderId, amount });

  return prisma.payment.create({
    data: {
      orderId,
      provider: process.env.PAYMENT_PROVIDER ?? "mock",
      transactionId: charge.transactionId,
      amount,
      status: PaymentStatus.PENDING,
      qrCode: charge.qrCode,
      pixCopyPaste: charge.pixCopyPaste,
      expiresAt: charge.expiresAt,
    },
  });
}

/**
 * Processa a confirmação de um pagamento de forma idempotente:
 * - registra o evento de webhook pelo externalId único (unique constraint
 *   no banco) — se já existir, ignora silenciosamente (evento duplicado).
 * - atualiza Payment -> APPROVED, Order -> PAID, RaffleNumber -> SOLD.
 */
export async function confirmPayment(transactionId: string, externalId: string, rawPayload: any) {
  return prisma.$transaction(async tx => {
    const payment = await tx.payment.findUnique({ where: { transactionId }, include: { order: { include: { items: true } } } });
    if (!payment) throw new Error("Pagamento não encontrado.");
    if (payment.status === PaymentStatus.APPROVED) return { alreadyProcessed: true };
    const items = payment.order.items;
    const updated = await tx.raffleNumber.updateMany({
      where: { orderId: payment.orderId, status: "RESERVED" },
      data: { status: "SOLD", participantId: payment.order.participantId, reservationExpiresAt: null },
    });
    if (!items.length || updated.count !== items.length) {
      throw new Error("Pagamento recebido após perda da reserva. Necessária revisão do administrador.");
    }
    await tx.payment.update({ where: { id: payment.id }, data: { status: "APPROVED", paidAt: new Date() } });
    await tx.order.update({ where: { id: payment.orderId }, data: { status: "PAID" } });
    await tx.webhookEvent.create({ data: { paymentId: payment.id, externalId, payload: rawPayload } });
    return { alreadyProcessed: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function syncMercadoPagoPayment(transactionId: string) {
  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment || payment.provider !== "mercadopago") throw new Error("Pagamento não encontrado.");
  if (payment.status === "APPROVED") return;
  const remote = await getMercadoPagoPayment(transactionId);
  if (String(remote.id) !== transactionId || remote.external_reference !== payment.orderId ||
      remote.payment_method_id !== "pix" || remote.currency_id !== "BRL" ||
      Math.round(remote.transaction_amount * 100) !== Math.round(Number(payment.amount) * 100)) {
    throw new Error("Pagamento não corresponde ao pedido.");
  }
  if (remote.status === "approved") {
    await confirmPayment(transactionId, `mp-approved-${transactionId}`, { id: remote.id, status: remote.status });
  } else if (["rejected", "cancelled"].includes(remote.status)) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
  }
}

