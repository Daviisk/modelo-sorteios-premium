import { prisma } from "@/lib/prisma";
import { Prisma, NumberStatus } from "@prisma/client";

const RESERVATION_MINUTES = Math.max(Number(process.env.RESERVATION_MINUTES ?? 10), process.env.PAYMENT_PROVIDER === "mercadopago" ? 32 : 10);

/**
 * Garante que a grade de números de uma rifa existe (idempotente).
 * Chamar ao criar a rifa.
 */
export async function ensureNumbersExist(raffleId: string, totalNumbers: number) {
  const existing = await prisma.raffleNumber.count({ where: { raffleId } });
  if (existing >= totalNumbers) return;

  const data = Array.from({ length: totalNumbers }, (_, n) => ({
    raffleId,
    number: n,
    status: NumberStatus.AVAILABLE as NumberStatus,
  }));

  await prisma.raffleNumber.createMany({ data, skipDuplicates: true });
}

// Leitura pública sem UPDATE: a reserva transacional já aceita reservas vencidas.
export async function getPublicNumbersGrid(raffleId: string) {
  const numbers = await prisma.raffleNumber.findMany({
    where: { raffleId },
    orderBy: { number: "asc" },
    select: { number: true, status: true, reservationExpiresAt: true },
  });
  const now = Date.now();
  return numbers.map(n => ({
    number: n.number,
    status: n.status === NumberStatus.RESERVED && n.reservationExpiresAt &&
      n.reservationExpiresAt.getTime() < now ? NumberStatus.AVAILABLE : n.status,
  }));
}

export async function getNumbersGrid(raffleId: string) {
  await releaseExpiredReservations(raffleId);
  return prisma.raffleNumber.findMany({
    where: { raffleId },
    orderBy: { number: "asc" },
    select: { number: true, status: true, reservationExpiresAt: true },
  });
}

/**
 * Núcleo crítico: reserva atomicamente um conjunto de números para um pedido.
 *
 * Estratégia contra condição de corrida:
 * - Cada número só é "capturado" via updateMany com WHERE que exige o status
 *   atual ser AVAILABLE (ou RESERVED porém expirado). O banco resolve a
 *   corrida: apenas uma transação consegue casar a condição WHERE por vez.
 * - Se o número de linhas afetadas for menor que o número de números
 *   solicitados, alguém chegou primeiro em pelo menos um deles — a
 *   transação inteira é revertida (nenhum número fica "meio reservado").
 * - Roda dentro de uma transação Prisma com isolamento Serializable para
 *   máxima segurança contra leituras/escritas concorrentes.
 */
export async function reserveNumbers(
  raffleId: string,
  numbers: number[],
  orderId: string
): Promise<{ ok: true } | { ok: false; conflictingNumbers: number[] }> {
  const uniqueNumbers = Array.from(new Set(numbers));
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60_000);
  const now = new Date();

  try {
    await prisma.$transaction(
      async (tx) => {
        let totalUpdated = 0;

        for (const number of uniqueNumbers) {
          const result = await tx.raffleNumber.updateMany({
            where: {
              raffleId,
              number,
              OR: [
                { status: NumberStatus.AVAILABLE },
                {
                  status: NumberStatus.RESERVED,
                  reservationExpiresAt: { lt: now },
                },
              ],
            },
            data: {
              status: NumberStatus.RESERVED,
              reservationExpiresAt: expiresAt,
              orderId,
            },
          });
          totalUpdated += result.count;
        }

        if (totalUpdated !== uniqueNumbers.length) {
          // Aborta e reverte tudo: pelo menos um número já estava
          // reservado/vendido por outra pessoa.
          throw new Error("NUMBERS_UNAVAILABLE");
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return { ok: true };
  } catch (err) {
    // Descobre quais números específicos já não estavam mais disponíveis,
    // para devolver uma mensagem útil ao usuário.
    const current = await prisma.raffleNumber.findMany({
      where: { raffleId, number: { in: uniqueNumbers } },
      select: { number: true, status: true, reservationExpiresAt: true },
    });
    const conflicting = current
      .filter(
        (n) =>
          n.status === NumberStatus.SOLD ||
          (n.status === NumberStatus.RESERVED &&
            (!n.reservationExpiresAt || n.reservationExpiresAt > now))
      )
      .map((n) => n.number);

    return { ok: false, conflictingNumbers: conflicting };
  }
}

/** Confirma o pagamento: RESERVED -> SOLD, vincula participante. */
export async function markNumbersSold(orderId: string, participantId: string) {
  await prisma.raffleNumber.updateMany({
    where: { orderId },
    data: { status: NumberStatus.SOLD, participantId, reservationExpiresAt: null },
  });
}

/** Libera reservas expiradas de uma rifa específica (chamado sob demanda). */
export async function releaseExpiredReservations(raffleId?: string) {
  return prisma.raffleNumber.updateMany({
    where: {
      ...(raffleId ? { raffleId } : {}),
      status: NumberStatus.RESERVED,
      reservationExpiresAt: { lt: new Date() },
    },
    data: { status: NumberStatus.AVAILABLE, reservationExpiresAt: null, orderId: null },
  });
}

