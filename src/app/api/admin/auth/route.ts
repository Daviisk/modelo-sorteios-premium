import { isRateLimited } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { login, logout } from "@/lib/auth";

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });

export async function POST(req: NextRequest) {
  if (isRateLimited("login", req.headers.get("x-forwarded-for") ?? "unknown", 5)) return NextResponse.json({ error: "Muitas tentativas. Aguarde um minuto.", code: "429" }, { status: 429, headers: { "Retry-After": "60" } });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  try {
    const user = await login(parsed.data.email, parsed.data.password);
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err: any) {
    const invalid = err instanceof Error && err.message === "Credenciais inválidas.";
    return NextResponse.json({ error: invalid ? "Credenciais inválidas." : "Login temporariamente indisponível. Procure o responsável.", code: invalid ? "401" : "503" }, { status: invalid ? 401 : 503 });
  }
}

export async function DELETE() {
  await logout();
  return NextResponse.json({ ok: true });
}
