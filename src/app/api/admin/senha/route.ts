import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, verifyPassword, hashPassword, logout } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const schema = z.object({ currentPassword: z.string().min(1).max(72), newPassword: z.string().min(8, "Use pelo menos 8 caracteres.").max(72) });
export async function POST(req: NextRequest) {
  let session;
  try { session = await requireAdmin(); } catch { return NextResponse.json({ error: "Sessão inválida." }, { status: 401 }); }
  if (req.headers.get("origin") !== req.nextUrl.origin) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user || !await verifyPassword(parsed.data.currentPassword, user.password)) return NextResponse.json({ error: "Senha atual incorreta." }, { status: 401 });
  if (parsed.data.newPassword === parsed.data.currentPassword) return NextResponse.json({ error: "Escolha uma senha diferente." }, { status: 422 });
  await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(parsed.data.newPassword) } });
  await logout();
  return NextResponse.json({ ok: true });
}

