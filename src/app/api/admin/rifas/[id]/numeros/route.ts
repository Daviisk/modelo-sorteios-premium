import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/services/numberService";

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  await releaseExpiredReservations(params.id);

  const numbers = await prisma.raffleNumber.findMany({
    where: { raffleId: params.id },
    orderBy: { number: "asc" },
    include: {
      participant: { select: { name: true, phone: true } },
      order: { select: { id: true, createdAt: true } },
    },
  });

  return NextResponse.json({
    numbers: numbers.map((n) => ({
      number: n.number,
      status: n.status,
      participantName: n.participant?.name ?? null,
      participantPhone: n.participant?.phone ?? null,
      orderId: n.order?.id ?? null,
      orderDate: n.order?.createdAt ?? null,
    })),
  });
}


