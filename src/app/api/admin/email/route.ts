import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, verifyPassword, logout } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  currentPassword: z.string().min(1).max(72),
});

export async function GET() {
  try {
    const session = await requireAdmin();
    const user = await prisma.user.findUnique({ where: { id: session.sub }, select: { email: true } });
    if (!user) return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
    return NextResponse.json({ email: user.email });
  } catch {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  let session;
  try { session = await requireAdmin(); }
  catch { return NextResponse.json({ error: "Sessão inválida." }, { status: 401 }); }
  if (req.headers.get("origin") !== req.nextUrl.origin)
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.password)))
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 401 });
  const email = parsed.data.email.toLowerCase();
  if (email === user.email.toLowerCase())
    return NextResponse.json({ error: "Informe um e-mail diferente do atual." }, { status: 422 });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Este e-mail já está em uso." }, { status: 409 });
  try {
    await prisma.user.update({ where: { id: user.id }, data: { email } });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar o e-mail." }, { status: 409 });
  }
  await logout();
  return NextResponse.json({ ok: true });
}

