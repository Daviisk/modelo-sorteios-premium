import Link from "next/link";
import { jsonLd, pageMetadata } from "@/lib/seo";
import { getRaffleGallery } from "@/lib/raffleGallery";
import { cache } from "react";
import { SITE_NAME, siteUrl } from "@/lib/site";
import { getRaffleNumberPrice } from "@/lib/rafflePricing";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getPublicNumbersGrid } from "@/lib/services/numberService";
import RaffleExperience from "@/components/RaffleExperience";

// Reutiliza a consulta somente dentro da mesma renderização, sem guardar estoque em cache.
const getRaffle = cache((slug: string) => prisma.raffle.findUnique({ where: { slug } }));

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const raffle = await getRaffle(params.slug);
  if (!raffle) return { title: "Sorteio não encontrado", robots: { index: false, follow: false } };
  const price = getRaffleNumberPrice(raffle.numberPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const description = (raffle.description?.trim() || `${raffle.prize}. Números por ${price}, pagamento via PIX. Consulte a data e o regulamento do sorteio baseado na Loteria Federal.`).replace(/\s+/g, " ").slice(0, 160);
  const image = getRaffleGallery(raffle.gallery, raffle.imageUrl)[0]?.url || raffle.imageUrl || "/images/sao-bento-logo.png";
  const shareImage = image.startsWith("data:") ? siteUrl(`/rifa/${encodeURIComponent(raffle.slug)}/imagem`) : image;
  return { ...pageMetadata(raffle.title, description, `/rifa/${encodeURIComponent(raffle.slug)}`, shareImage), robots: { index: ["ATIVA", "SORTEADA"].includes(raffle.status), follow: true } };
}

export default async function RafflePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const raffle = await getRaffle(params.slug);
  if (!raffle) notFound();
  const numbers = await getPublicNumbersGrid(raffle.id);
  const sold = numbers.filter((n) => n.status === "SOLD").length;

  const url = siteUrl(`/rifa/${encodeURIComponent(raffle.slug)}`);
  const structured = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", "@id": `${url}#page`, url, name: raffle.title, description: raffle.description, inLanguage: "pt-BR", dateModified: raffle.updatedAt.toISOString(), isPartOf: { "@id": siteUrl("/#website") }, about: { "@type": "Thing", name: raffle.prize } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: SITE_NAME, item: siteUrl("/") }, { "@type": "ListItem", position: 2, name: raffle.title, item: url }] },
  ] };
  return (
    <main>
    {["ATIVA", "SORTEADA"].includes(raffle.status) && <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(structured)}} />}
    <nav aria-label="Navegação estrutural" className="max-w-3xl mx-auto px-4 pt-4 text-sm"><Link href="/" className="underline">{SITE_NAME}</Link><span> / {raffle.title}</span></nav>
    <RaffleExperience
      raffle={{
        slug: raffle.slug,
        title: raffle.title,
        prize: raffle.prize,
        prizeValue: Number(raffle.prizeValue),
        numberPrice: getRaffleNumberPrice(raffle.numberPrice),
        totalNumbers: raffle.totalNumbers,
        drawDate: raffle.drawDate.toISOString(),
        imageUrl: raffle.imageUrl,
        gallery: getRaffleGallery(raffle.gallery, raffle.imageUrl),
        rules: raffle.rules,
        soldCount: sold,
      }}
      initialNumbers={numbers.map((n) => ({ number: n.number, status: n.status }))}
    />
    <section className="max-w-3xl mx-auto px-4 pb-12"><h2 className="font-bold text-lg">Sobre este sorteio</h2>{raffle.description?.trim() && <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{raffle.description}</p>}<p className="mt-3 text-sm"><Link href="/como-participar" className="underline">Como participar, pagamento via PIX e regulamento</Link></p></section>
    </main>
  );
}

