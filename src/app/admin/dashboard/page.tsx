import AdminTabs from "@/components/AdminTabs";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDashboardStats } from "@/lib/services/raffleService";
import { prisma } from "@/lib/prisma";
import DeleteRaffleButton from "@/components/DeleteRaffleButton";
import LogoutButton from "@/components/LogoutButton";
import RefreshDashboardButton from "@/components/RefreshDashboardButton";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const statusLabels: Record<string, string> = { PAID: "Pago", EXPIRED: "Expirado", RESERVED: "Reservado", PENDING: "Pendente", CANCELLED: "Cancelado", ACTIVE: "Ativa", COMPLETED: "Concluída", DRAFT: "Rascunho" };
const statusClasses: Record<string, string> = { PAID: "bg-green-100 text-green-800", EXPIRED: "bg-red-100 text-red-800", RESERVED: "bg-amber-100 text-amber-900", PENDING: "bg-amber-100 text-amber-900", CANCELLED: "bg-gray-100 text-gray-700", ACTIVE: "bg-green-100 text-green-800" };
const statusBadge = (status: string) => <span className={["inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", statusClasses[status] ?? "bg-gray-100 text-gray-700"].join(" ")}>{statusLabels[status] ?? status}</span>;

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const [stats, raffles, recentOrders] = await Promise.all([
    getDashboardStats(),
    prisma.raffle.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, slug: true, status: true, totalNumbers: true, numbers: { select: { status: true } } },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, total: true, status: true, participant: { select: { name: true } }, raffle: { select: { title: true } } },
    }),
  ]);

  const soldPercent = stats.totalNumbers > 0 ? Math.min(100, Math.max(0, (stats.sold / stats.totalNumbers) * 100)) : 0;
  const cards = [
    { label: "Números vendidos", value: `${stats.sold} / ${stats.totalNumbers}`, color: "bg-[#F1EBFF] border-[#E1D4FA] text-[#442477]", icon: "ticket" },
    { label: "Disponíveis", value: stats.available, color: "bg-[#E6F6EC] border-[#C8EAD3] text-[#195D35]", icon: "check" },
    { label: "Reservados", value: stats.reserved, color: "bg-[#FFF4DD] border-[#F3E2BC] text-[#80510B]", icon: "clock" },
    { label: "Total de pedidos", value: stats.totalOrders, color: "bg-[#E8F1FF] border-[#D0E1F8] text-[#244C80]", icon: "bag" },
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 pt-3 pb-8">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-widest text-purple-700">SÃO BENTO DOBRÕES</p>
            <h1 className="text-lg sm:text-xl font-bold leading-tight">Painel administrativo</h1>
          </div>
        </div>
        <div className="flex w-full sm:w-auto justify-end items-center gap-2">
          <RefreshDashboardButton />
          <LogoutButton />
        </div>
      </header>

      <AdminTabs />

      <section aria-label="Indicadores da campanha" className="mb-6 space-y-3">
        <div className="rounded-2xl border border-[#91DCA6] bg-[#C6F2D0] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[#166534]">Total arrecadado</div>
            <div aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#A1E9B3] text-xl text-[#166534]">↗</div>
          </div>
          <div className="text-3xl font-extrabold mt-2 tracking-tight text-[#14532D]">{fmt(stats.totalArrecadado)}</div>
          <div className="text-xs text-[#166534] mt-2">↗ Resumo das campanhas</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {cards.map(c => <div key={c.label} className={`min-w-0 rounded-2xl border p-3.5 sm:p-4 ${c.color}`}>
            <div className="flex items-start justify-between gap-1">
              <div className="text-xs font-semibold leading-snug">{c.label}</div>
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-80">
                {c.icon === "ticket" ? <><path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V6Z"/><path d="M12 6v2m0 3v2m0 3v2"/></> : c.icon === "check" ? <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></> : c.icon === "clock" ? <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></> : <><rect x="4" y="7" width="16" height="14" rx="2"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>}
              </svg>
            </div>
            <div className="text-xl font-bold mt-2 break-words">{c.value}</div>
          </div>)}
        </div>
        <div className="card p-4">
          <div className="flex justify-between gap-3 text-sm mb-3"><span className="font-semibold">Progresso de vendas</span><span className="font-bold text-purple-700">{soldPercent.toFixed(0)}%</span></div>
          <div className="h-2.5 rounded-full bg-purple-100 overflow-hidden" role="progressbar" aria-valuenow={stats.sold} aria-valuemin={0} aria-valuemax={stats.totalNumbers || 1} aria-label="Números vendidos">
            <div className="h-full rounded-full bg-purple-600" style={{ width: soldPercent + "%" }} />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-gray-500"><span>{stats.sold} de {stats.totalNumbers} números vendidos</span><span>{stats.available} disponíveis</span></div>
          <div className="mt-3 border-t border-gray-100 pt-3 flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-600">Taxa de conversão <span className="sr-only">de pedidos pagos</span></span>
            <strong className="text-gray-900">{stats.taxaConversao}%</strong>
          </div>
        </div>
      </section>

      <section aria-labelledby="campaigns-heading" className="mb-7">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 id="campaigns-heading" className="text-lg font-bold">Rifas</h2>
          <a href="/admin/rifas/nova" className="btn-primary text-sm text-center">+ Nova rifa</a>
        </div>
        <div className="space-y-3">
          {raffles.length === 0 && <div className="card p-5 text-sm text-gray-500">Nenhuma rifa cadastrada. Crie uma rifa para começar.</div>}
          {raffles.map((r) => {
            const sold = r.numbers.filter(n => n.status === "SOLD").length;
            const available = r.numbers.filter(n => n.status === "AVAILABLE").length;
            return <article key={r.id} className="card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                {statusBadge(r.status)}
                <details className="relative group">
                  <summary aria-label={`Ações da rifa ${r.title}`} className="cursor-pointer list-none rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Ações ⋯</summary>
                  <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                    <DeleteRaffleButton id={r.id} title={r.title} />
                  </div>
                </details>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold leading-snug break-words">{r.title}</h3>
                <p className="mt-1 text-xs text-gray-500">Rifa cadastrada</p>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-sm">
                <div><p className="text-xs text-gray-500">Vendidos</p><p className="font-bold">{sold} números</p></div>
                <div><p className="text-xs text-gray-500">Disponíveis</p><p className="font-bold">{available} números</p></div>
              </div>
              <a href={`/admin/rifas/${r.id}/editar`} className="block rounded-xl bg-purple-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-purple-800">Gerenciar rifa</a>
            </article>;
          })}
        </div>
      </section>

      <section aria-labelledby="recent-orders-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="recent-orders-heading" className="text-lg font-bold">Últimos pedidos</h2>
          <a href="/admin/pedidos" className="text-sm font-semibold text-purple-700 hover:underline">Ver todos →</a>
        </div>
        <div className="card divide-y">
          {recentOrders.length === 0 && <p className="p-5 text-sm text-gray-500">Ainda não há pedidos registrados.</p>}
          {recentOrders.map((o) => (
            <div key={o.id} className="flex items-center gap-3 p-3 text-sm">
              <div aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{o.participant.name}</p>
                <p className="text-xs text-gray-500">{fmt(Number(o.total))}</p>
              </div>
              {statusBadge(o.status)}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

