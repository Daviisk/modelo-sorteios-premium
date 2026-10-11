import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { RaffleStatus } from "@prisma/client";

/**
 * Sorteia o número vencedor dentre os números VENDIDOS da rifa, usando
 * crypto.randomInt (CSPRNG do Node/OpenSSL) — não Math.random().
 * Registra o método e a semente para auditoria.
 */
export async function runDraw(raffleId: string, adminUserId: string) {
  const raffle = await prisma.raffle.findUnique({ where: { id: raffleId }, select: { drawDate: true, status: true } });
  if (!raffle) throw new Error("Rifa não encontrada.");
  if (raffle.drawDate.getTime() > Date.now()) throw new Error("O sorteio só pode ser realizado na data programada.");
  if (!["ATIVA", "ENCERRADA"].includes(raffle.status)) throw new Error("Esta rifa não está apta ao sorteio.");

  const existing = await prisma.draw.findUnique({ where: { raffleId } });
  if (existing) throw new Error("Esta rifa já foi sorteada.");

  const soldNumbers = await prisma.raffleNumber.findMany({
    where: { raffleId, status: "SOLD" },
    select: { number: true },
  });
  if (soldNumbers.length === 0) throw new Error("Não há números vendidos para sortear.");

  const seed = crypto.randomBytes(16).toString("hex");
  const index = crypto.randomInt(0, soldNumbers.length);
  const winningNumber = soldNumbers[index].number;

  const [draw] = await prisma.$transaction([
    prisma.draw.create({
      data: {
        raffleId,
        winningNumber,
        method: "crypto.randomInt (Node.js CSPRNG)",
        seed,
        drawnById: adminUserId,
      },
    }),
    prisma.raffle.update({ where: { id: raffleId }, data: { status: RaffleStatus.SORTEADA } }),
  ]);

  return draw;
}

export async function getDrawResult(raffleId: string) {
  const draw = await prisma.draw.findUnique({
    where: { raffleId },
    include: { drawnBy: { select: { name: true } } },
  });
  if (!draw) return null;

  const winnerNumber = await prisma.raffleNumber.findFirst({
    where: { raffleId, number: draw.winningNumber },
    include: { participant: { select: { name: true } } },
  });

  return { draw, winner: winnerNumber?.participant ?? null };
}

