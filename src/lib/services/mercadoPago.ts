import crypto from "node:crypto";

export type MercadoPagoPayment = {
  id: number | string;
  status: string;
  transaction_amount: number;
  currency_id: string;
  external_reference: string;
  payment_method_id: string;
  date_of_expiration?: string;
  point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string } };
};

export function mercadoPagoConfig() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  const notificationUrl = process.env.MERCADOPAGO_NOTIFICATION_URL?.trim();
  if (!token || !webhookSecret || !notificationUrl) {
    throw new Error("Configure MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_WEBHOOK_SECRET e MERCADOPAGO_NOTIFICATION_URL no servidor.");
  }
  const url = new URL(notificationUrl);
  if (url.protocol !== "https:") throw new Error("A URL do webhook deve usar HTTPS.");
  return { token, webhookSecret, notificationUrl };
}

async function request(path: string, init?: RequestInit): Promise<any> {
  const { token } = mercadoPagoConfig();
  const res = await fetch(`https://api.mercadopago.com/v1/${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new Error("Mercado Pago recusou as credenciais. Confira o Access Token e o ambiente de teste/produção.");
    throw new Error(`Não foi possível processar o PIX no Mercado Pago (HTTP ${res.status}). Confira os dados e a configuração da conta.`);
  }
  if (!data?.id) throw new Error("Resposta inválida do Mercado Pago.");
  return data;
}

/** Adapt Orders responses to the checkout's internal payment representation. */
export function normalizeMercadoPagoOrder(order: any): MercadoPagoPayment {
  const payments = order.transactions?.payments;
  if (order.type !== "online" || !Array.isArray(payments) || payments.length !== 1) {
    throw new Error("Order inválida do Mercado Pago.");
  }
  const payment = payments[0];
  const amount = Number(order.total_amount);
  if (!Number.isFinite(amount) || amount <= 0 || Number(payment.amount) !== amount) {
    throw new Error("Valor divergente na order do Mercado Pago.");
  }
  const approved = order.status === "processed" && order.status_detail === "accredited" &&
    payment.status === "processed" && payment.status_detail === "accredited" &&
    Number(order.total_paid_amount) === amount && Number(payment.paid_amount) === amount;
  return {
    id: order.id,
    external_reference: order.external_reference,
    transaction_amount: amount,
    currency_id: order.currency_id ?? (order.country_code === "BRA" ? "BRL" : ""),
    payment_method_id: payment.payment_method?.id,
    status: approved ? "approved" : (["failed", "canceled", "cancelled", "expired"].includes(order.status) ||
      ["failed", "canceled", "cancelled", "expired"].includes(payment.status) ? "rejected" : "pending"),
    point_of_interaction: { transaction_data: payment.payment_method },
  };
}

export async function createMercadoPagoPix(params: {
  orderId: string; amount: number; email?: string; name: string; expiresAt: Date;
}) {
  const remainingSeconds = Math.floor((params.expiresAt.getTime() - Date.now()) / 1000);
  if (remainingSeconds < 1800 || remainingSeconds > 30 * 86400) {
    throw new Error("A reserva PIX deve ter entre 30 minutos e 30 dias restantes.");
  }
  const amount = params.amount.toFixed(2);
  const order = await request("orders", {
    method: "POST",
    headers: { "X-Idempotency-Key": `pix-order-${params.orderId}` },
    body: JSON.stringify({
      type: "online",
      processing_mode: "automatic",
      total_amount: amount,
      external_reference: params.orderId,
      ...(params.email && !params.email.endsWith("@invalid.local") ? { payer: { email: params.email } } : {}),
      transactions: { payments: [{
        amount,
        payment_method: { id: "pix", type: "bank_transfer" },
        expiration_time: `PT${remainingSeconds}S`,
      }] },
    }),
  });
  if (!/^ORD[A-Z0-9]+$/.test(order.id)) throw new Error("ID de order inválido.");
  return normalizeMercadoPagoOrder(order);
}

export function getMercadoPagoPayment(id: string) {
  if (/^ORD[A-Z0-9]+$/.test(id)) {
    return request(`orders/${id}`).then(normalizeMercadoPagoOrder);
  }
  // Existing Payments API charges remain readable until they expire.
  if (/^\d+$/.test(id)) return request(`payments/${id}`) as Promise<MercadoPagoPayment>;
  throw new Error("ID de pagamento inválido.");
}

export function verifyMercadoPagoSignature(headers: Headers, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  const requestId = headers.get("x-request-id");
  const signature = headers.get("x-signature");
  if (!secret || !requestId || !signature || !dataId) return false;
  const parts = Object.fromEntries(signature.split(",").map(part => part.trim().split("=")));
  if (!/^\d+$/.test(parts.ts ?? "") || !/^[a-f0-9]{64}$/i.test(parts.v1 ?? "")) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(parts.v1, "hex"));
}

