import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runDraw } from "@/lib/services/drawService";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const raffles = await prisma.raffle.findMany({
    where: { status: { in: ["ATIVA", "ENCERRADA", "SORTEADA"] } },
    include: { draw: true, _count: { select: { numbers: { where: { status: "SOLD" } } } } },
    orderBy: { drawDate: "asc" },
  });

  return NextResponse.json({
    raffles: raffles.map((r) => ({
      id: r.id,
      title: r.title,
      drawDate: r.drawDate,
      soldCount: r._count.numbers,
      alreadyDrawn: !!r.draw,
      winningNumber: r.draw?.winningNumber ?? null,
    })),
  });
}

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { raffleId, confirmation } = await req.json();
  if (confirmation !== "SORTEAR") return NextResponse.json({ error: "Confirmação de segurança obrigatória." }, { status: 400 });
  try {
    const draw = await runDraw(raffleId, session.sub);
    return NextResponse.json({ ok: true, winningNumber: draw.winningNumber });
  } catch (err: any) {
    const known = ["Esta rifa já foi sorteada.", "Não há números vendidos para sortear.", "O sorteio só pode ser realizado na data programada."].includes(err?.message);
    return NextResponse.json({ error: known ? err.message : "Não foi possível concluir o sorteio.", code: known ? "409" : "500" }, { status: known ? 409 : 500 });
  }
}

