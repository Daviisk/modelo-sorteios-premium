import { jsonLd, pageMetadata, SITE_DESCRIPTION } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getRaffleNumberPrice } from "@/lib/rafflePricing";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = pageMetadata(`${SITE_NAME} — Sorteios de dobrões para capoeira`, SITE_DESCRIPTION, "/");

export const dynamic = "force-dynamic";

export default async function Home() {
  const activeRaffles = await prisma.raffle.findMany({
    where: { status: "ATIVA" },
    orderBy: { createdAt: "desc" },
  });

  const structured = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: SITE_NAME, inLanguage: "pt-BR", description: SITE_DESCRIPTION },
    { "@type": "CollectionPage", "@id": `${SITE_URL}/#page`, url: SITE_URL, name: "Sorteios de dobrões para capoeira", isPartOf: { "@id": `${SITE_URL}/#website` }, mainEntity: { "@type": "ItemList", itemListElement: activeRaffles.map((raffle,index)=>({ "@type":"ListItem", position:index+1, name:raffle.title, url: `${SITE_URL}/rifa/${encodeURIComponent(raffle.slug)}` })) } },
  ] };
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-center">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(structured)}} />
      <h1 className="text-3xl font-bold">{SITE_NAME}</h1>
      <p className="text-gray-500 mt-2">
        Sorteios de dobrões para capoeira com pagamento via PIX e resultado baseado na Loteria Federal. Consulte os prêmios, a data e o regulamento de cada sorteio.
      </p>
      {activeRaffles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 mt-6 text-left">
          {activeRaffles.map((raffle) => (
            <article key={raffle.id} className="card p-5 flex flex-col gap-3">
              <h2 className="text-lg font-bold">{raffle.title}</h2>
              <p className="text-sm text-gray-500">Prêmio: {raffle.prize}</p>
              <p className="text-sm">
                Número por <span className="text-2xl sm:text-3xl font-bold">{getRaffleNumberPrice(raffle.numberPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </p>
              <Link href={`/rifa/${encodeURIComponent(raffle.slug)}`} className="btn-primary text-center mt-auto" aria-label={`Participar da rifa ${raffle.title}`}>
                Ver sorteio e escolher números
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-gray-400">Nenhuma rifa ativa no momento.</p>
      )}
      <div className="mt-10 text-xs text-gray-400">
        <Link href="/admin/login">Acesso administrativo</Link>
      </div>
    </main>
  );
}
