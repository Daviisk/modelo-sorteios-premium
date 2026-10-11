import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import crypto from "node:crypto";

const schema = z.object({
  orderId: z.string().optional(),
  raffleId: z.string().min(1),
  name: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(8).max(30),
  numbers: z.array(z.number().int().nonnegative()).min(1).max(100),
  status: z.enum(["PENDING", "PAID", "CANCELLED"]),
});
const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function GET() {
  try { await requireAdmin(); } catch { return fail("Não autorizado.", 401); }
  const raffles = await prisma.raffle.findMany({ select: { id: true, title: true, numberPrice: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ raffles: raffles.map(r => ({ ...r, numberPrice: Number(r.numberPrice) })) });
}

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch { return fail("Não autorizado.", 401); }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Preencha nome, telefone, sorteio, números e status válidos.");
  const data = parsed.data;
  if (new Set(data.numbers).size !== data.numbers.length) return fail("Há números repetidos.");
  try {
    const result = await prisma.$transaction(async tx => {
      const raffle = await tx.raffle.findUnique({ where: { id: data.raffleId } });
      if (!raffle) throw new Error("Sorteio não encontrado.");
      const existing = data.orderId ? await tx.order.findUnique({ where: { id: data.orderId }, include: { payment: true, participant: true, items: true } }) : null;
      if (data.orderId && (!existing || existing.payment?.provider !== "manual")) throw new Error("Apenas pedidos manuais podem ser alterados aqui.");
      if (existing && existing.raffleId !== data.raffleId) throw new Error("Não é permitido trocar o sorteio do pedido.");
      const rows = await tx.raffleNumber.findMany({ where: { raffleId: data.raffleId, number: { in: data.numbers } } });
      if (rows.length !== data.numbers.length) throw new Error("Um ou mais números não existem neste sorteio.");
      if (data.status !== "CANCELLED" && rows.some(n => n.status !== "AVAILABLE" && n.orderId !== existing?.id)) throw new Error("Um ou mais números já estão reservados ou vendidos.");
      const participant = existing ? await tx.participant.update({ where: { id: existing.participantId }, data: { name: data.name, phone: data.phone } }) :
        await tx.participant.create({ data: { name: data.name, phone: data.phone, cpf: "", email: `manual-${crypto.randomUUID()}@invalid.local` } });
      const total = new Prisma.Decimal(raffle.numberPrice).mul(data.numbers.length);
      const order = existing ? await tx.order.update({ where: { id: existing.id }, data: { status: data.status, total, expiresAt: null } }) :
        await tx.order.create({ data: { raffleId: raffle.id, participantId: participant.id, total, status: data.status, expiresAt: null } });
      if (existing) {
        await tx.raffleNumber.updateMany({ where: { orderId: order.id }, data: { status: "AVAILABLE", orderId: null, participantId: null, reservationExpiresAt: null } });
        await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      }
      if (data.status !== "CANCELLED") {
        // Conditional updates prevent a concurrent checkout from taking a number.
        const updated = await tx.raffleNumber.updateMany({ where: { id: { in: rows.map(r => r.id) }, status: "AVAILABLE" }, data: { status: data.status === "PAID" ? "SOLD" : "RESERVED", orderId: order.id, participantId: participant.id, reservationExpiresAt: null } });
        if (updated.count !== rows.length) throw new Error("Os números foram ocupados durante o cadastro. Atualize e tente novamente.");
      }
      await tx.orderItem.createMany({ data: rows.map(row => ({ orderId: order.id, raffleNumberId: row.id, price: raffle.numberPrice })) });
      if (existing) {
        await tx.payment.update({ where: { orderId: order.id }, data: { status: data.status === "PAID" ? "APPROVED" : data.status === "CANCELLED" ? "FAILED" : "PENDING", paidAt: data.status === "PAID" ? new Date() : null, amount: total } });
      } else {
        await tx.payment.create({ data: { orderId: order.id, provider: "manual", amount: total, status: data.status === "PAID" ? "APPROVED" : data.status === "CANCELLED" ? "FAILED" : "PENDING", paidAt: data.status === "PAID" ? new Date() : null } });
      }
      return order.id;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ ok: true, orderId: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar pedido.";
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return fail("Conflito de reserva. Tente novamente.", 409);
    return fail(message, 409);
  }
}

