import { PrismaClient, RaffleStatus, NumberStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@rifademo.com.br";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  if (process.env.NODE_ENV === "production" && (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD || adminPassword.length < 12)) {
    throw new Error("Em produção, configure SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD com pelo menos 12 caracteres antes de executar o seed.");
  }
  console.log("Criando usuário administrador, se ainda não existir...");
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { name: "Administrador", email: adminEmail, password: passwordHash, role: "ADMIN" },
  });

  console.log("Criando configurações da plataforma...");
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", platformName: "Sorteios Premium" },
  });

  console.log("Criando rifa de demonstração...");
  const raffle = await prisma.raffle.upsert({
    where: { slug: "iphone-17-pro-max" },
    update: {},
    create: {
      title: "Rifa iPhone 17 Pro Max [DADOS DE DEMONSTRAÇÃO]",
      slug: "iphone-17-pro-max",
      description: "Concorra a um iPhone 17 Pro Max 256GB. Esta é uma rifa de demonstração do sistema.",
      prize: "iPhone 17 Pro Max 256GB",
      prizeValue: 9999,
      numberPrice: 10,
      totalNumbers: 100,
      drawDate: new Date("2026-12-20T20:00:00-03:00"),
      status: RaffleStatus.ATIVA,
      rules:
        "Rifa de demonstração. O organizador é responsável por verificar as regras e autorizações aplicáveis à modalidade e jurisdição antes de realizar campanhas reais.",
    },
  });

  console.log("Criando grade de 100 números...");
  const existing = await prisma.raffleNumber.count({ where: { raffleId: raffle.id } });
  if (existing === 0) {
    await prisma.raffleNumber.createMany({
      data: Array.from({ length: 100 }, (_, n) => ({
        raffleId: raffle.id,
        number: n,
        status: NumberStatus.AVAILABLE as NumberStatus,
      })),
    });
  }

  console.log("Marcando alguns números como vendidos/reservados (demonstração)...");
  const participant = await prisma.participant.upsert({
    where: { email: "demo.participante@example.com" },
    update: { name: "Participante Demonstração" },
    create: {
      name: "Participante Demonstração",
      cpf: "00000000000",
      phone: "62999990000",
      email: "demo.participante@example.com",
    },
  });

  const order = await prisma.order.create({
    data: {
      raffleId: raffle.id,
      participantId: participant.id,
      total: 50,
      status: "PAID",
    },
  });

  const soldNumbers = [3, 7, 12, 19, 22, 29, 34, 41, 48, 55];
  const reservedNumbers = [60, 63, 67];

  for (const n of soldNumbers) {
    await prisma.raffleNumber.update({
      where: { raffleId_number: { raffleId: raffle.id, number: n } },
      data: { status: NumberStatus.SOLD, participantId: participant.id, orderId: order.id },
    });
  }
  for (const n of reservedNumbers) {
    await prisma.raffleNumber.update({
      where: { raffleId_number: { raffleId: raffle.id, number: n } },
      data: { status: NumberStatus.RESERVED, reservationExpiresAt: new Date(Date.now() + 10 * 60_000) },
    });
  }

  console.log("Seed concluído. Credenciais existentes do administrador foram preservadas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

