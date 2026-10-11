import { canReadOrder } from "@/lib/orderAccess";
import { NextRequest, NextResponse } from "next/server";
import { confirmPayment } from "@/lib/services/paymentService";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * SOMENTE para desenvolvimento/demonstração com PAYMENT_PROVIDER=mock.
 * Simula o gateway aprovando o pagamento, reaproveitando o mesmo caminho
 * idempotente do webhook real (confirmPayment).
 */
export async function POST(req: NextRequest) {
  if (process.env.PAYMENT_PROVIDER !== "mock" || (process.env.NODE_ENV === "production" && process.env.DEMO_PAYMENTS_ENABLED !== "true")) {
    return NextResponse.json({ error: "Disponível apenas com PAYMENT_PROVIDER=mock." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const transactionId = body?.transactionId;
  if (typeof transactionId !== "string" || !transactionId || transactionId.length > 200) {
    return NextResponse.json({ error: "transactionId é obrigatório." }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment || payment.provider !== "mock") {
    return NextResponse.json({ error: "Pagamento de demonstração não encontrado." }, { status: 404 });
  }
  if (!await canReadOrder(payment.orderId)) return NextResponse.json({ error: "Acesso protegido." }, { status: 403 });
  const externalId = `sim_${crypto.randomUUID()}`;
  const result = await confirmPayment(transactionId, externalId, { simulated: true, transactionId });
  return NextResponse.json({ ok: true, alreadyProcessed: result.alreadyProcessed });
}
