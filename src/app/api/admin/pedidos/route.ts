import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim();

  const orders = await prisma.order.findMany({
    where: {
      ...(status && status !== "all" ? { status: status as any } : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: "insensitive" } },
              { participant: { name: { contains: search, mode: "insensitive" } } },
              { participant: { cpf: { contains: search } } },
              { participant: { phone: { contains: search } } },
              { participant: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: { id: true, raffleId: true, total: true, status: true, createdAt: true, participant: { select: { name: true, phone: true, email: true, cpf: true } }, raffle: { select: { title: true } }, numbers: { select: { number: true } }, payment: { select: { provider: true, status: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // OrderItem is the durable purchase history; RaffleNumber.orderId is cleared on expiration.
  const items = orders.length ? await prisma.orderItem.findMany({
    where: { orderId: { in: orders.map((o) => o.id) } },
    select: { orderId: true, raffleNumberId: true },
  }) : [];
  const numberRows = items.length ? await prisma.raffleNumber.findMany({
    where: { id: { in: items.map((item) => item.raffleNumberId) } },
    select: { id: true, number: true },
  }) : [];
  const numberById = new Map(numberRows.map((row) => [row.id, row.number]));
  const historicalNumbers = new Map<string, number[]>();
  for (const item of items) {
    const number = numberById.get(item.raffleNumberId);
    if (number !== undefined) historicalNumbers.set(item.orderId, [...(historicalNumbers.get(item.orderId) ?? []), number]);
  }

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      raffleId: o.raffleId,
      isManual: o.payment?.provider === "manual",
      participant: o.participant.name,
      contact: { name: o.participant.name, phone: o.participant.phone, email: o.participant.email.endsWith("@invalid.local") ? null : o.participant.email, cpf: o.participant.cpf },
      raffle: o.raffle.title,
      numbers: (historicalNumbers.get(o.id) ?? o.numbers.map((n) => n.number)).sort((a, b) => a - b),
      total: Number(o.total),
      status: o.status,
      paymentStatus: o.payment?.status ?? null,
      createdAt: o.createdAt,
    })),
  });
}

