import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/lib/services/numberService";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { timingSafeEqual } from "node:crypto";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();
  const expected = secret ? Buffer.from(`Bearer ${secret}`) : null;
  const supplied = Buffer.from(auth ?? "");
  if (!expected || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const numbers = await releaseExpiredReservations();
  const orders = await prisma.order.updateMany({
    where: { status: OrderStatus.RESERVED, expiresAt: { lt: new Date() } },
    data: { status: OrderStatus.EXPIRED },
  });

  return NextResponse.json({ releasedNumbers: numbers.count, expiredOrders: orders.count });
}

