import type { RaffleImage } from "@/lib/raffleGallery";
import { prisma } from "@/lib/prisma";
import { RaffleStatus } from "@prisma/client";
import { ensureNumbersExist } from "./numberService";

export type CreateRaffleInput = {
  title: string;
  slug: string;
  description: string;
  prize: string;
  prizeValue: number;
  numberPrice: number;
  totalNumbers?: number;
  drawDate: Date;
  gallery?: RaffleImage[];
  imageUrl?: string;
  bannerUrl?: string;
  rules?: string;
  primaryColor?: string;
};

export async function createRaffle(input: CreateRaffleInput) {
  const raffle = await prisma.raffle.create({
    data: {
      ...input,
      ...(input.gallery !== undefined ? { imageUrl: input.gallery[0]?.url ?? "" } : {}),
      totalNumbers: input.totalNumbers ?? 100,
      status: RaffleStatus.RASCUNHO,
    },
  });
  await ensureNumbersExist(raffle.id, raffle.totalNumbers);
  return raffle;
}

export async function updateRaffle(id: string, input: Partial<CreateRaffleInput> & { status?: RaffleStatus }) {
  // Regra de segurança: não permitir reduzir totalNumbers abaixo do maior
  // número já vendido/reservado, para não gerar inconsistência.
  if (input.totalNumbers) {
    const maxSold = await prisma.raffleNumber.findFirst({
      where: { raffleId: id, status: { in: ["SOLD", "RESERVED"] } },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    if (maxSold && input.totalNumbers <= maxSold.number) {
      throw new Error("Não é possível reduzir a quantidade de números abaixo dos já vendidos/reservados.");
    }
  }
  return prisma.raffle.update({ where: { id }, data: { ...input, ...(input.gallery !== undefined ? { imageUrl: input.gallery[0]?.url ?? "" } : {}) } });
}

export async function getRaffleBySlug(slug: string) {
  return prisma.raffle.findUnique({ where: { slug } });
}

export async function listRaffles() {
  return prisma.raffle.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getDashboardStats(raffleId?: string) {
  const where = raffleId ? { raffleId } : {};
  const [groups, orders, paidOrders] = await Promise.all([
    prisma.raffleNumber.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.order.count({ where }),
    prisma.order.aggregate({ where: { ...where, status: "PAID" }, _sum: { total: true }, _count: { _all: true } }),
  ]);
  const count = (status: string) => groups.find(group => group.status === status)?._count._all ?? 0;
  return {
    totalNumbers: groups.reduce((sum, group) => sum + group._count._all, 0),
    sold: count("SOLD"),
    reserved: count("RESERVED"),
    available: count("AVAILABLE"),
    totalOrders: orders,
    totalArrecadado: Number(paidOrders._sum.total ?? 0),
    taxaConversao: Number((orders > 0 ? paidOrders._count._all / orders * 100 : 0).toFixed(1)),
  };
}

