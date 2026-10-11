import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function deleteRaffle(id: string) {
  return prisma.$transaction(async (tx) => {
    const raffle = await tx.raffle.findUnique({ where: { id }, select: { id: true } });
    if (!raffle) return false;
    await tx.webhookEvent.deleteMany({ where: { payment: { order: { raffleId: id } } } });
    await tx.payment.deleteMany({ where: { order: { raffleId: id } } });
    await tx.orderItem.deleteMany({ where: { order: { raffleId: id } } });
    await tx.raffleNumber.deleteMany({ where: { raffleId: id } });
    await tx.draw.deleteMany({ where: { raffleId: id } });
    await tx.order.deleteMany({ where: { raffleId: id } });
    await tx.raffle.delete({ where: { id } });
    return true;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

