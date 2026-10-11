import { SITE_URL, siteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 const raffles = await prisma.raffle.findMany({ where: { status: { in: ["ATIVA", "SORTEADA"] } }, select: { slug: true, updatedAt: true }, orderBy: { updatedAt: "desc" } });
 return [
  { url: SITE_URL, ...(raffles[0] ? { lastModified: raffles[0].updatedAt } : {}) },
  { url: siteUrl("/como-participar") },
  { url: siteUrl("/privacidade") },
  { url: siteUrl("/termos") },
  ...raffles.map(raffle=>({ url: siteUrl(`/rifa/${encodeURIComponent(raffle.slug)}`), lastModified: raffle.updatedAt })),
 ];
}

