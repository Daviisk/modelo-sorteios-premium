import crypto from "node:crypto";
import { getRaffleNumberPrice } from "@/lib/rafflePricing";
import { prisma } from "@/lib/prisma";
import { OrderStatus, NumberStatus } from "@prisma/client";
import { reserveNumbers } from "./numberService";
import { createPayment } from "./paymentService";

const RESERVATION_MINUTES = Math.max(Number(process.env.RESERVATION_MINUTES ?? 10), process.env.PAYMENT_PROVIDER === "mercadopago" ? 32 : 10);

export type ParticipantInput = {
  name: string;
  phone: string;
  email?: string;
};

/**
 * Fluxo completo de checkout:
 * 1. valida números pedidos
 * 2. cria/atualiza participante
 * 3. cria o Order (status RESERVED) e tenta reservar os números atomicamente
 * 4. se falhar (números indisponíveis), cancela o pedido e retorna o motivo
 * 5. se ok, cria o pagamento PIX (mock ou gateway real) e retorna tudo
 */
export async function createOrderWithReservation(
  raffleSlug: string,
  numbers: number[],
  participantData: ParticipantInput
) {
  numbers = Array.from(new Set(numbers));
  if (numbers.length === 0) {
    throw new Error("Selecione ao menos um número.");
  }

  const raffle = await prisma.raffle.findUnique({ where: { slug: raffleSlug } });
  if (!raffle || raffle.status !== "ATIVA") {
    throw new Error("Rifa não encontrada ou não está ativa.");
  }
  const invalid = numbers.some((n) => n < 0 || n >= raffle.totalNumbers);
  if (invalid) throw new Error("Número inválido para esta rifa.");

  const participant = participantData.email
    ? await prisma.participant.upsert({
        where: { email: participantData.email },
        // Unauthenticated checkout must never overwrite an existing profile.
        update: {},
        create: { name: participantData.name, phone: participantData.phone, email: participantData.email, cpf: "" },
      })
    : await prisma.participant.create({
        data: {
          name: participantData.name,
          phone: participantData.phone,
          // The current schema requires a unique email. Keep an internal,
          // non-routable value when the buyer chooses not to provide one.
          email: `checkout-${crypto.randomUUID()}@invalid.local`,
          cpf: "",
        },
      });

  const total = getRaffleNumberPrice(raffle.numberPrice) * numbers.length;
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60_000);

  const order = await prisma.order.create({
    data: {
      raffleId: raffle.id,
      participantId: participant.id,
      total,
      status: OrderStatus.RESERVED,
      expiresAt,
    },
  });

  const reservation = await reserveNumbers(raffle.id, numbers, order.id);

  if (!reservation.ok) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED },
    });
    const err = new Error("NUMBERS_UNAVAILABLE") as Error & { conflictingNumbers: number[] };
    err.conflictingNumbers = reservation.conflictingNumbers;
    throw err;
  }

  // Agora que os números estão reservados de fato, registra os itens do
  // pedido apontando para as linhas reais de RaffleNumber.
  const reservedNumbers = await prisma.raffleNumber.findMany({
    where: { orderId: order.id },
    select: { id: true },
  });
  await prisma.orderItem.createMany({
    data: reservedNumbers.map((rn) => ({
      orderId: order.id,
      raffleNumberId: rn.id,
      price: getRaffleNumberPrice(raffle.numberPrice),
    })),
  });

  const payment = await createPayment(order.id, total);

  return { order, payment, raffle, participant };
}

export async function getOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      raffle: true,
      participant: true,
      payment: true,
      numbers: { select: { number: true } },
    },
  });
}

/** Cancela um pedido pendente e libera os números de volta para AVAILABLE. */
export async function cancelOrder(orderId: string) {
  await prisma.$transaction([
    prisma.raffleNumber.updateMany({
      where: { orderId, status: NumberStatus.RESERVED },
      data: { status: NumberStatus.AVAILABLE, reservationExpiresAt: null, orderId: null },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    }),
  ]);
}

