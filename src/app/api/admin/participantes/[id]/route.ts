import { checkoutContactSchema } from "@/lib/checkoutContact";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anonymizeParticipant } from "@/lib/services/participantService";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Não autorizado." }, { status: 401, headers }); }
  const participant = await prisma.participant.findUnique({ where: { id: params.id }, select: {
    id: true, name: true, phone: true, email: true, cpf: true, createdAt: true,
    orders: { select: { id: true, total: true, status: true, createdAt: true, raffle: { select: { title: true } }, numbers: { select: { number: true } }, payment: { select: { status: true, paidAt: true } } } },
  } });
  if (!participant) return NextResponse.json({ error: "Participante não encontrado." }, { status: 404, headers });
  return NextResponse.json({ exportedAt: new Date().toISOString(), participant }, { headers: { ...headers, "Content-Disposition": 'attachment; filename="dados-participante.json"' } });
}
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Não autorizado." }, { status: 401, headers }); }
  if (req.headers.get("origin") !== req.nextUrl.origin) return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers });
  const body = await req.json().catch(() => null);
  if (body?.action !== "remove-identifiers" || body?.identityVerified !== true || body?.retentionReviewed !== true) {
    return NextResponse.json({ error: "Confirme a identidade e a análise de retenção antes de remover os identificadores." }, { status: 422, headers });
  }
  const participant = await prisma.participant.findUnique({ where: { id: params.id }, select: { id: true, orders: { where: { status: "RESERVED" }, select: { id: true } } } });
  if (!participant) return NextResponse.json({ error: "Participante não encontrado." }, { status: 404, headers });
  if (participant.orders.length) return NextResponse.json({ error: "Há um pedido reservado. Resolva a participação antes de remover os dados de contato." }, { status: 409, headers });
  await anonymizeParticipant(params.id);
  return NextResponse.json({ ok: true }, { headers });
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Não autorizado." }, { status: 401, headers }); }
  if (req.headers.get("origin") !== req.nextUrl.origin) return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers });
  const body = await req.json().catch(() => null);
  const parsed = checkoutContactSchema.safeParse(body?.contact);
  if (body?.identityVerified !== true || !parsed.success) return NextResponse.json({ error: "Verifique a identidade e os dados de contato." }, { status: 422, headers });
  try {
    const contact = await prisma.participant.update({ where: { id: params.id }, data: parsed.data, select: { id: true, name: true, phone: true, email: true } });
    return NextResponse.json({ contact }, { headers });
  } catch { return NextResponse.json({ error: "Não foi possível corrigir os dados. Confira se o participante existe e se o e-mail já está em uso." }, { status: 409, headers }); }
}


