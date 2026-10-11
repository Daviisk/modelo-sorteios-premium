import Link from "next/link";
import DefaultRaffleRules from "@/components/DefaultRaffleRules";
import { jsonLd, pageMetadata } from "@/lib/seo";
import { SITE_NAME, siteUrl } from "@/lib/site";
export const metadata = pageMetadata("Como participar e regulamento", "Saiba como escolher números, pagar via PIX e acompanhar os sorteios Sorteios Premium pela Loteria Federal. Consulte as regras e a responsabilidade pelo frete.", "/como-participar");
export default function ParticipationPage() {
 const structured = { "@context": "https://schema.org", "@graph": [
  { "@type":"BreadcrumbList", itemListElement:[{ "@type":"ListItem",position:1,name:SITE_NAME,item:siteUrl("/") },{ "@type":"ListItem",position:2,name:"Como participar",item:siteUrl("/como-participar") }] },
 ] };
 return <main className="max-w-3xl mx-auto px-4 py-10">
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(structured)}} />
  <nav aria-label="Navegação estrutural" className="text-sm mb-6"><Link href="/" className="underline">{SITE_NAME}</Link><span> / Como participar</span></nav>
  <h1 className="text-3xl font-bold">Como participar dos sorteios Sorteios Premium</h1>
  <p className="mt-4 text-gray-600">Escolha um sorteio, leia suas condições, selecione os números disponíveis e pague via PIX. A data, o prêmio e o preço são informados na página de cada sorteio.</p>
  <section id="regulamento" className="card p-5 mt-8"><h2 className="text-2xl font-bold mb-5">Regulamento de participação</h2><DefaultRaffleRules /></section>
  <p className="mt-6 text-sm"><Link href="/privacidade" className="underline">Política de Privacidade</Link>{" · "}<Link href="/termos" className="underline">Termos de uso</Link></p>
  <Link href="/" className="btn-primary inline-block mt-6">Ver sorteios disponíveis</Link>
 </main>;
}

