import { prisma } from "@/lib/prisma";

export async function listParticipants(search?: string) {
  const participants = await prisma.participant.findMany({
    where: {
      orders: { some: { status: "PAID", numbers: { some: { status: "SOLD" } } } },
      ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { cpf: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {}),
    },
    include: {
      orders: { where: { status: "PAID", numbers: { some: { status: "SOLD" } } }, select: { total: true, createdAt: true } },
      numbers: { where: { status: "SOLD", order: { status: "PAID" } }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return participants.map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    email: p.email,
    totalNumbers: p.numbers.length,
    totalSpent: p.orders.reduce((sum, o) => sum + Number(o.total), 0),
    lastPurchaseAt: p.orders.length
      ? p.orders.reduce((latest, o) => (o.createdAt > latest ? o.createdAt : latest), p.orders[0].createdAt)
      : null,
  }));
}

export async function getParticipantDetail(id: string) {
  return prisma.participant.findUnique({
    where: { id },
    include: {
      orders: { include: { raffle: { select: { title: true } }, numbers: { select: { number: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
}

/**
 * LGPD: anonimiza os dados pessoais de um participante mantendo a
 * integridade histórica dos pedidos (não apaga registros financeiros).
 * Usar apenas mediante solicitação válida do titular dos dados.
 */
export async function anonymizeParticipant(id: string) {
  return prisma.participant.update({
    where: { id },
    data: {
      name: "Participante anonimizado",
      cpf: "",
      phone: "",
      email: `anonimizado-${id}@removido.local`,
    },
  });
}

