"use client";
import { useMemo, useState } from "react";

const TOTAL = 100;
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export default function DemoShowcase() {
  const [selected, setSelected] = useState<number[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const unavailable = useMemo(() => new Set([3,7,12,18,22,29,35,41,47,53,58,63,70,76,82,89,94]), []);
  function toggle(n:number) { if(unavailable.has(n)) return; setSelected(current => current.includes(n) ? current.filter(x => x !== n) : [...current,n].sort((a,b)=>a-b)); }
  return <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
    <header className="flex flex-wrap items-center justify-between gap-3 mb-8">
      <div className="flex items-center gap-3"><span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-700 text-white text-2xl">✦</span><div><p className="font-black text-xl tracking-tight">Sorteios Premium</p><p className="text-xs text-gray-500">Modelo de apresentação</p></div></div>
      <span className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800">DEMONSTRAÇÃO • SEM PAGAMENTOS</span>
    </header>
    <section className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
      <div className="grid md:grid-cols-2">
        <div className="relative flex min-h-64 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-violet-900 via-violet-700 to-fuchsia-500 p-8 text-center text-white">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border-[35px] border-white/10" aria-hidden="true"/>
          <div className="relative"><p className="text-xs font-bold tracking-[.3em] uppercase text-violet-100">Exemplo de campanha</p><div className="my-5 text-7xl drop-shadow-lg" aria-hidden="true">🎁</div><p className="text-3xl font-black">Seu prêmio aqui</p><p className="mt-2 text-violet-100">Imagem ilustrativa e personalizável</p></div>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-9">
          <span className="mb-3 w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">EXEMPLO DE SORTEIO</span>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Campanha demonstrativa</h1>
          <p className="mt-3 leading-relaxed text-gray-600">Explore a seleção de números e visualize como sua campanha pode ser apresentada. Nenhum pedido é criado.</p>
          <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-violet-50 p-4"><p className="text-xs text-violet-700">Valor ilustrativo</p><p className="mt-1 text-2xl font-black text-violet-800">{money(10)}</p></div><div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Números no exemplo</p><p className="mt-1 text-2xl font-black">00 a 99</p></div></div>
          <button type="button" onClick={()=>setShowInfo(x=>!x)} aria-expanded={showInfo} className="mt-5 rounded-xl border border-violet-200 px-4 py-3 text-left font-semibold text-violet-800 hover:bg-violet-50">{showInfo?"Ocultar informações −":"Ver informações do modelo +"}</button>
          {showInfo&&<p className="mt-3 text-sm leading-relaxed text-gray-600">Esta é uma prévia de interface. Os números indisponíveis são fictícios. Não há sorteio real, participantes, inscrição, checkout, PIX ou premiação.</p>}
        </div>
      </div>
    </section>
    <section className="mt-7 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black tracking-tight">Escolha números para visualizar</h2><p className="mt-1 text-sm text-gray-500">Seleção interativa apenas para demonstração</p></div><button type="button" onClick={()=>setSelected([])} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50">Limpar seleção</button></div>
      <div className="mt-5 flex flex-wrap gap-4 text-xs font-medium"><span>⚪ Disponível</span><span>🟣 Selecionado</span><span>🔴 Indisponível (fictício)</span></div>
      <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-10 sm:gap-3" aria-label="Grade de números ilustrativa">{Array.from({length:TOTAL},(_,n)=>{const off=unavailable.has(n);const active=selected.includes(n);return <button key={n} type="button" disabled={off} aria-pressed={active} aria-label={`Número ${String(n).padStart(2,"0")}${off?", indisponível":""}`} onClick={()=>toggle(n)} className={`num-cell min-h-12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-700 ${off?"sold":active?"selected":"available"}`}>{String(n).padStart(2,"0")}</button>})}</div>
      <div className="mt-7 rounded-2xl border border-violet-200 bg-violet-50 p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-violet-700">Prévia da seleção</p><p className="mt-1 text-2xl font-black">{selected.length} {selected.length===1?"número selecionado":"números selecionados"}</p><p className="mt-1 text-sm text-gray-600">{selected.length?selected.map(n=>String(n).padStart(2,"0")).join(", "):"Selecione números acima para testar."}</p></div><div className="text-right"><p className="text-sm text-gray-600">Total ilustrativo</p><p className="text-3xl font-black text-violet-800">{money(selected.length*10)}</p></div></div><p className="mt-4 border-t border-violet-200 pt-3 text-xs font-medium text-violet-800">Sem checkout, cadastro, pagamento, reserva ou transação. A seleção não é salva.</p></div>
    </section>
    <section className="mt-7 grid gap-4 sm:grid-cols-3">{[["Identidade personalizável","Exemplo neutro, preparado para apresentar diferentes marcas."],["Interface responsiva","Experiência visual para celulares, tablets e computadores."],["Sem operações reais","Nenhum dado pessoal, pedido ou pagamento é coletado nesta demonstração."]].map(([title,description])=><article key={title} className="rounded-2xl border border-violet-100 bg-white p-5"><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p></article>)}</section>
  </main>;
}
