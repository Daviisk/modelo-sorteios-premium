import { deleteRaffle } from "@/lib/services/deleteRaffle";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { raffleGallerySchema } from "@/lib/raffleGallery";
import { requireAdmin } from "@/lib/auth";
import { updateRaffle } from "@/lib/services/raffleService";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  gallery: raffleGallerySchema.optional(),
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  prize: z.string().min(3).optional(),
  prizeValue: z.number().positive().optional(),
  numberPrice: z.number().positive().optional(),
  drawDate: z.string().optional(),
  imageUrl: z.string().optional(),
  rules: z.string().trim().max(2000, "Use até 2.000 caracteres nas informações adicionais.").optional(),
  primaryColor: z.string().optional(),
  status: z.enum(["RASCUNHO", "ATIVA", "PAUSADA", "ENCERRADA", "SORTEADA"]).optional(),
});

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const raffle = await prisma.raffle.findUnique({ where: { id: params.id } });
  if (!raffle) return NextResponse.json({ error: "Rifa não encontrada." }, { status: 404 });
  return NextResponse.json({ raffle });
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const raffle = await updateRaffle(params.id, {
      ...parsed.data,
      drawDate: parsed.data.drawDate ? new Date(parsed.data.drawDate) : undefined,
    } as any);
    revalidatePath(`/rifa/${raffle.slug}`);
    revalidatePath("/");
    return NextResponse.json({ ok: true, raffle });
  } catch (err: any) {
    return NextResponse.json({ error: "Não foi possível salvar a rifa. Confira os dados e tente novamente.", code: "500" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try { await requireAdmin(); }
  catch { return NextResponse.json({ error: "Não autorizado." }, { status: 401 }); }
  if (req.headers.get("origin") !== req.nextUrl.origin) return NextResponse.json({ error: "Origem não autorizada." }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (body?.confirmation !== "EXCLUIR" || body?.raffleId !== params.id) {
    return NextResponse.json({ error: "Confirme a exclusão da rifa." }, { status: 400 });
  }
  try {
    if (!(await deleteRaffle(params.id))) return NextResponse.json({ error: "Rifa não encontrada." }, { status: 404 });
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível excluir a rifa. Atualize a página e tente novamente." }, { status: 409 });
  }
}


