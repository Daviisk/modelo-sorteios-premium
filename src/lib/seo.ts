import type { Metadata } from "next";
import { SITE_NAME, siteUrl } from "@/lib/site";
export const SITE_DESCRIPTION = "Sorteios Premium: participe de sorteios de prêmios. Confira os prêmios, escolha seus números, pague via PIX e consulte as regras da Loteria Federal.";
export function pageMetadata(title: string, description: string, path: string, image = "/images/modelo-logo.svg"): Metadata {
 const url = siteUrl(path);
 return {
  title, description, alternates: { canonical: url },
  robots: { index: true, follow: true },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "pt_BR", url, title, description, images: [{ url: image, alt: title }], countryName: "Brasil" },
  twitter: { card: "summary_large_image", title, description, images: [image] },
 };
}
export function jsonLd(value: unknown): string {
 return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

