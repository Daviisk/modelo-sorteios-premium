/**
 * Libera reservas expiradas em todas as rifas.
 *
 * Uso:
 *   npm run cron:release
 *
 * Em produção, agende para rodar a cada 1 minuto, por exemplo:
 *   - cron do sistema: * * * * * cd /app && npm run cron:release
 *   - Vercel Cron (vercel.json) chamando GET /api/cron/release-expired
 *     com o header "Authorization: Bearer $CRON_SECRET"
 */
import { prisma } from "@/lib/prisma";
import { OrderStatus, NumberStatus } from "@prisma/client";

async function main() {
  const now = new Date();

  const expiredNumbers = await prisma.raffleNumber.updateMany({
    where: { status: NumberStatus.RESERVED, reservationExpiresAt: { lt: now } },
    data: { status: NumberStatus.AVAILABLE, reservationExpiresAt: null, orderId: null },
  });

  const expiredOrders = await prisma.order.updateMany({
    where: { status: OrderStatus.RESERVED, expiresAt: { lt: now } },
    data: { status: OrderStatus.EXPIRED },
  });

  console.log(
    `[release-expired] ${expiredNumbers.count} número(s) liberado(s), ${expiredOrders.count} pedido(s) marcado(s) como expirado(s).`
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

