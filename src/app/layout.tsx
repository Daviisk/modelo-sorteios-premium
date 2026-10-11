import { SITE_DESCRIPTION } from "@/lib/seo";
import GoogleTagManager from "@/components/GoogleTagManager";
import MetaPixel from "@/components/MetaPixel";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import Link from "next/link";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} | Sorteios de prêmios`, template: `%s | ${SITE_NAME}` },
  applicationName: SITE_NAME,
  category: "Sorteios",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  formatDetection: { telephone: false },
  openGraph: { siteName: SITE_NAME, locale: "pt_BR", type: "website", images: ["/images/modelo-logo.svg"] },
  description: SITE_DESCRIPTION,
  twitter: { card: "summary_large_image", description: SITE_DESCRIPTION, images: ["/images/modelo-logo.svg"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">

      <body>{children}<footer className="max-w-3xl mx-auto px-4 pt-6 pb-28 text-xs text-gray-500 flex flex-wrap justify-center gap-4">
        <Link href="/como-participar">Como participar e regulamento</Link><Link href="/privacidade">Privacidade</Link><Link href="/cookies">Cookies</Link><Link href="/termos">Termos de uso</Link><Link href="/privacidade/direitos">Seus direitos e contato</Link>
        <p className="w-full text-center">Desenvolvido por <a href="https://drv-digital.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4 hover:text-gray-700">DRV Digital</a></p>
      </footer><GoogleTagManager /><MetaPixel /></body>
    </html>
  );
}

