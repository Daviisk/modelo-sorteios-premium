import { SITE_NAME } from "@/lib/site";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", platformName: SITE_NAME },
  });
  return NextResponse.json({ settings: { ...settings, platformName: SITE_NAME } });
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  // Nunca aceitar credenciais de gateway aqui — essas ficam só em variáveis de ambiente.
  const { platformName, logoUrl, faviconUrl, whatsapp, email, pixKey, primaryColor, termsUrl, privacyUrl } = body;
  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { platformName, logoUrl, faviconUrl, whatsapp, email, pixKey, primaryColor, termsUrl, privacyUrl },
    create: { id: "singleton", platformName, logoUrl, faviconUrl, whatsapp, email, pixKey, primaryColor, termsUrl, privacyUrl },
  });
  return NextResponse.json({ ok: true, settings });
}

