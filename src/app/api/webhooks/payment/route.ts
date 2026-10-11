import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider, syncMercadoPagoPayment } from "@/lib/services/paymentService";

export async function POST(req: NextRequest) {
  if (process.env.PAYMENT_PROVIDER !== "mercadopago") {
    return NextResponse.json({ error: "Webhook externo indisponível neste modo." }, { status: 403 });
  }
  const rawBody = await req.text();
  if (Buffer.byteLength(rawBody) > 8192) return NextResponse.json({ error: "Payload muito grande." }, { status: 413 });
  let payload;
  try { payload = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: "Payload inválido." }, { status: 400 }); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  const dataId = req.nextUrl.searchParams.get("data.id") ?? "";
  if (!getPaymentProvider().verifyWebhook(req.headers, rawBody, dataId)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }
  if (!["order", "payment"].includes(payload.type)) return NextResponse.json({ received: true });
  if (String(payload.data?.id ?? "") !== dataId) {
    return NextResponse.json({ error: "ID do recurso divergente." }, { status: 400 });
  }
  if ((payload.type === "order" && !/^ORD[A-Z0-9]+$/.test(dataId)) ||
      (payload.type === "payment" && !/^\d+$/.test(dataId))) {
    return NextResponse.json({ error: "Tipo de recurso divergente." }, { status: 400 });
  }
  try {
    await syncMercadoPagoPayment(dataId);
    return NextResponse.json({ received: true });
  } catch {
    // Erros transitórios devem permitir uma nova tentativa do Mercado Pago.
    return NextResponse.json({ error: "Não foi possível confirmar o pagamento. Tente novamente." }, { status: 503 });
  }
}

