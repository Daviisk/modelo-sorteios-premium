import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicNumbersGrid } from "@/lib/services/numberService";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const raffle = await prisma.raffle.findUnique({ where: { slug: params.slug }, select: { id: true } });
  if (!raffle) return NextResponse.json({ error: "Rifa não encontrada." }, { status: 404 });

  const numbers = await getPublicNumbersGrid(raffle.id);
  return NextResponse.json({ numbers: numbers.map((n) => ({ number: n.number, status: n.status })) }, { headers: { "Cache-Control": "no-store" } });
}


