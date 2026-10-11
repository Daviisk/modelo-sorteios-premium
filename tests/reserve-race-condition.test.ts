import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { ensureNumbersExist, reserveNumbers } from "@/lib/services/numberService";

/**
 * Este teste exige um banco PostgreSQL real (configurado via DATABASE_URL),
 * pois o comportamento sob concorrência depende do isolamento de
 * transações do banco de dados — não pode ser simulado com mocks.
 *
 * Rodar com: npm test
 */
describe("reserveNumbers — condição de corrida", () => {
  let raffleId: string;

  beforeAll(async () => {
    const raffle = await prisma.raffle.create({
      data: {
        title: "Rifa de teste",
        slug: `teste-${Date.now()}`,
        description: "teste",
        prize: "teste",
        prizeValue: 100,
        numberPrice: 10,
        totalNumbers: 10,
        drawDate: new Date(),
        status: "ATIVA",
      },
    });
    raffleId = raffle.id;
    await ensureNumbersExist(raffleId, 10);
  });

  afterAll(async () => {
    await prisma.raffleNumber.deleteMany({ where: { raffleId } });
    await prisma.raffle.delete({ where: { id: raffleId } });
    await prisma.$disconnect();
  });

  it("permite que apenas um de dois pedidos concorrentes reserve o mesmo número", async () => {
    const orderA = await prisma.order.create({
      data: { raffleId, participantId: (await createParticipant("a")).id, total: 10, status: "PENDING" },
    });
    const orderB = await prisma.order.create({
      data: { raffleId, participantId: (await createParticipant("b")).id, total: 10, status: "PENDING" },
    });

    const [resultA, resultB] = await Promise.all([
      reserveNumbers(raffleId, [5], orderA.id),
      reserveNumbers(raffleId, [5], orderB.id),
    ]);

    const successes = [resultA, resultB].filter((r) => r.ok);
    expect(successes.length).toBe(1);

    const number = await prisma.raffleNumber.findFirst({ where: { raffleId, number: 5 } });
    expect(number?.status).toBe("RESERVED");
  });

  async function createParticipant(suffix: string) {
    return prisma.participant.create({
      data: { name: `Teste ${suffix}`, cpf: "00000000000", phone: "62999990000", email: `teste-${suffix}-${Date.now()}@ex.com` },
    });
  }
});

