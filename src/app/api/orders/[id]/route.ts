import { canReadOrder } from "@/lib/orderAccess";
import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/services/orderService";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!(await canReadOrder(params.id))) return NextResponse.json({ error: "Acesso protegido.", code: "403" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  const order = await getOrderById(params.id);
  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });

  return NextResponse.json({
    id: order.id,
    status: order.status,
    total: order.total,
    expiresAt: order.expiresAt,
    numbers: order.numbers.map((n) => n.number),
    paymentStatus: order.payment?.status ?? null,
    raffle: { title: order.raffle.title, slug: order.raffle.slug },
  }, { headers: { "Cache-Control": "no-store" } });
}


