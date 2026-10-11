import { isRateLimited } from "@/lib/rateLimit";
import { grantOrderAccess } from "@/lib/orderAccess";
import { safeCheckoutError } from "@/lib/errors";
import { checkoutContactSchema } from "@/lib/checkoutContact";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOrderWithReservation } from "@/lib/services/orderService";

const bodySchema = z.object({
  numbers: z.array(z.number().int().min(0).max(999)).min(1).max(200).refine(numbers => new Set(numbers).size === numbers.length, "Selecione cada número apenas uma vez."),
  participant: checkoutContactSchema,
});

export async function POST(req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited("checkout", ip)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um instante.", code: "429" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Confira seus dados.", code: "422" }, { status: 400 });
  }

  try {
    const { order, payment } = await createOrderWithReservation(
      params.slug,
      parsed.data.numbers,
      parsed.data.participant
    );
    await grantOrderAccess(order.id);
    return NextResponse.json({
      orderId: order.id,
      expiresAt: order.expiresAt,
      total: Number(order.total),
      payment: {
        provider: payment.provider,
        qrCode: payment.qrCode,
        pixCopyPaste: payment.pixCopyPaste,
        expiresAt: payment.expiresAt,
        transactionId: payment.transactionId,
      },
    });
  } catch (err: any) {
    if (err?.conflictingNumbers) {
      return NextResponse.json(
        { error: "Alguns números já não estão mais disponíveis.", code: "409", conflictingNumbers: err.conflictingNumbers },
        { status: 409 }
      );
    }
    const safe = safeCheckoutError(err);
    return NextResponse.json({ error: safe.message, code: safe.code }, { status: safe.status });
  }
}

