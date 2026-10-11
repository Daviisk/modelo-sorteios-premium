import { SITE_NAME } from "@/lib/site";
import { prisma } from "@/lib/prisma";
export const PRIVACY_VERSION = "2026-10-02";
export async function getPrivacyContact() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" }, select: { platformName: true, email: true, whatsapp: true } }).catch(() => null);
  const email = (process.env.PRIVACY_CONTACT_EMAIL ?? settings?.email ?? "").trim();
  const phone = (settings?.whatsapp ?? "").replace(/\D/g, "");
  return {
    platform: SITE_NAME,
    controller: process.env.PRIVACY_CONTROLLER_NAME?.trim() || "Identificação do responsável pendente de preenchimento",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !/@(?:rifademo\.com\.br|example\.com|removido\.local)$/i.test(email) ? email : null,
    phone: /^\d{10,13}$/.test(phone) ? phone : null,
  };
}

