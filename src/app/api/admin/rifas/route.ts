import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { raffleGallerySchema } from "@/lib/raffleGallery";
import { requireAdmin } from "@/lib/auth";
import { createRaffle } from "@/lib/services/raffleService";

const schema = z.object({
  gallery: raffleGallerySchema.optional(),
  rules: z.string().trim().max(2000).optional(),
  title: z.string().min(3),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens."),
  description: z.string().min(10),
  prize: z.string().min(3),
  prizeValue: z.number().nonnegative().default(0),
  numberPrice: z.number().positive(),
  totalNumbers: z.number().int().positive().max(100000).optional(),
  drawDate: z.string(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const raffle = await createRaffle({
      ...parsed.data,
      drawDate: new Date(parsed.data.drawDate),
    });
    return NextResponse.json({ ok: true, raffle });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Já existe uma rifa com esse slug." }, { status: 409 });
    }
    return NextResponse.json({ error: "Não foi possível salvar a rifa. Confira os dados e tente novamente.", code: "500" }, { status: 500 });
  }
}

