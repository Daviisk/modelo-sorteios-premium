"use client";
import AdminTabs from "@/components/AdminTabs";

import { useEffect, useState } from "react";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pad = (n: number) => String(n).padStart(2, "0");
const displayEmail = (email?: string | null) => !email || /@invalid\.local$/i.test(email) ? "Não informado" : email;
const displayNumbers = (numbers?: number[]) => numbers?.length ? numbers.map(pad).join(", ") : "Números não registrados";
const statusLabels: Record<string, string> = { PAID: "Pago", EXPIRED: "Expirado", RESERVED: "Reservado", PENDING: "Pendente", CANCELLED: "Cancelado" };
const statusColors: Record<string, string> = { PAID: "bg-green-100 text-green-800", EXPIRED: "bg-red-100 text-red-800", RESERVED: "bg-amber-100 text-amber-900", PENDING: "bg-amber-100 text-amber-900", CANCELLED: "bg-gray-100 text-gray-700" };

const STATUS_FILTERS = [
  { key: "all", label: "Todos" },
  { key: "PENDING", label: "Pendentes" },
  { key: "RESERVED", label: "Reservados" },
  { key: "PAID", label: "Pagos" },
  { key: "EXPIRED", label: "Expirados" },
  { key: "CANCELLED", label: "Cancelados" },
];

export default function Pedidos() {
  const [orders, setOrders] = useState<any[]>([]);
  const [raffles, setRaffles] = useState<any[]>([]);
  const [manualOpen, setManualOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manualError, setManualError] = useState("");
  const [manual, setManual] = useState({ orderId: "", raffleId: "", name: "", phone: "", numbers: "", status: "PENDING" });
  const openManual = async (order?: any) => {
    setManualError("");
    try {
      const res = await fetch("/api/admin/pedidos/manual", { cache: "no-store" });
      if (!res.ok) throw new Error("Não foi possível carregar os sorteios.");
      const data = await res.json();
      setRaffles(data.raffles ?? []);
      setManual(order ? { orderId: order.id, raffleId: order.raffleId, name: order.contact?.name ?? order.participant, phone: order.contact?.phone ?? "", numbers: (order.numbers ?? []).map(pad).join(", "), status: order.status === "PAID" ? "PAID" : order.status === "CANCELLED" ? "CANCELLED" : "PENDING" } : { orderId: "", raffleId: data.raffles?.[0]?.id ?? "", name: "", phone: "", numbers: "", status: "PENDING" });
      setManualOpen(true);
    } catch (e) { setManualError(e instanceof Error ? e.message : "Erro ao abrir formulário."); }
  };
  const saveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setManualError("");
    try {
      const tokens = manual.numbers.split(/[\s,;]+/).filter(Boolean);
      if (!tokens.length || tokens.some(n => !/^\d+$/.test(n))) throw new Error("Informe números separados por vírgula.");
      const response = await fetch("/api/admin/pedidos/manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...manual, numbers: tokens.map(Number) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível salvar.");
      setManualOpen(false); setRefreshKey(v => v + 1);
    } catch (e) { setManualError(e instanceof Error ? e.message : "Erro ao salvar."); }
    finally { setSaving(false); }
  };
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadOrders = async (showLoading = false) => {
      if (cancelled || document.hidden) return;
      if (showLoading) setLoading(true);
      setLoadError("");
      try {
        const qs = new URLSearchParams({ status, ...(search ? { search } : {}) });
        const response = await fetch(`/api/admin/pedidos?${qs}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Não foi possível carregar os pedidos.");
        const data = await response.json();
        if (!cancelled) setOrders(data.orders ?? []);
      } catch (error) {
        if (!cancelled && !controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Falha ao carregar pedidos.");
      } finally {
        if (!cancelled && showLoading) setLoading(false);
      }
    };

    const initial = setTimeout(() => void loadOrders(true), search ? 350 : 0);

    return () => {
      cancelled = true;
      clearTimeout(initial);
      controller.abort();
    };
  }, [status, search, refreshKey]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold">Pedidos</h1>
        <button
          type="button"
          className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          disabled={loading}
          onClick={() => setRefreshKey((value) => value + 1)}
        >
          {loading ? "Atualizando..." : "Atualizar pedidos"}
        </button>
      </div>

      <AdminTabs />
      <button type="button" className="mb-4 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white" onClick={() => void openManual()}>+ Novo pedido manual</button>
      {manualError && !manualOpen && <p role="alert" className="mb-3 text-sm text-red-700">{manualError}</p>}
      {manualOpen && <form onSubmit={saveManual} className="card p-4 mb-5 space-y-3">
        <h2 className="font-semibold">{manual.orderId ? "Editar pedido manual" : "Novo pedido manual"}</h2>
        <label className="block text-sm">Rifa
          <select className="w-full border rounded p-2" required disabled={!!manual.orderId} value={manual.raffleId} onChange={e => setManual(v => ({ ...v, raffleId: e.target.value }))}>
            {raffles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </label>
        <label className="block text-sm">Nome completo<input className="w-full border rounded p-2" required minLength={2} value={manual.name} onChange={e => setManual(v => ({ ...v, name: e.target.value }))}/></label>
        <label className="block text-sm">WhatsApp<input className="w-full border rounded p-2" required value={manual.phone} onChange={e => setManual(v => ({ ...v, phone: e.target.value }))}/></label>
        <label className="block text-sm">Números (separados por vírgula)<input className="w-full border rounded p-2" required placeholder="00, 12, 27" value={manual.numbers} onChange={e => setManual(v => ({ ...v, numbers: e.target.value }))}/></label>
        <label className="block text-sm">Situação<select className="w-full border rounded p-2" value={manual.status} onChange={e => setManual(v => ({ ...v, status: e.target.value }))}>
          <option value="PENDING">Pendente — reservar números</option><option value="PAID">Pago — vender números</option><option value="CANCELLED">Cancelado — liberar números</option>
        </select></label>
        <p className="text-xs text-gray-500">Pedidos manuais pendentes não expiram automaticamente. Números ocupados não podem ser selecionados.</p>
        {manualError && <p role="alert" className="text-sm text-red-700">{manualError}</p>}
        <div className="flex flex-wrap gap-2"><button disabled={saving} className="bg-gray-900 text-white rounded px-4 py-2 disabled:opacity-50">{saving ? "Salvando..." : "Salvar pedido"}</button><button type="button" className="border rounded px-4 py-2" onClick={() => { setManualOpen(false); setManualError(""); }}>Cancelar</button></div>
      </form>}
      <div className="flex flex-wrap gap-2 mb-3 text-sm">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            className={`px-3 py-2 rounded-lg font-semibold ${status === f.key ? "bg-purple-700 text-white" : "border bg-white"}`}
            onClick={() => setStatus(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <input
        className="w-full border rounded-xl px-3 py-3 mb-4 text-sm"
        placeholder="Buscar nome, WhatsApp ou número do pedido"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loadError && <p role="alert" className="mb-3 text-sm text-red-700">{loadError}</p>}
      <div className="card divide-y overflow-hidden">
        {loading && <div className="p-4 text-sm text-gray-500">Carregando...</div>}
        {!loading && orders.length === 0 && <div className="p-4 text-sm text-gray-500">Nenhum pedido encontrado.</div>}
        {orders.map((o) => (
          <details key={o.id} className="text-sm group">
          <summary className="p-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 cursor-pointer hover:bg-gray-50 focus-visible:outline focus-visible:outline-purple-600">
            <div className="min-w-0 flex-1">
              <div className="font-semibold break-words">
                #{o.id.slice(-6).toUpperCase()} · {o.participant}
              </div>
              <div className="text-gray-500 text-xs break-words">
                Números: {displayNumbers(o.numbers)}
              </div>
              <div className="text-gray-400 text-xs">{new Date(o.createdAt).toLocaleString("pt-BR")}</div>
            </div>
            <div className="text-right shrink-0 ml-auto">
              <div className="font-semibold">{fmt(o.total)}</div>
              <span className={`inline-flex mt-1 text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[o.status] ?? "bg-gray-100 text-gray-700"}`}>{statusLabels[o.status] ?? o.status}</span>
              <div className="text-xs font-semibold text-purple-700 mt-2 group-open:hidden">Ver detalhes →</div>
            </div>
          </summary>
          <div className="border-t bg-gray-50 px-4 py-4">
            <h2 className="font-semibold mb-3">Detalhes do pedido</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 break-words">
              <div><dt className="text-xs text-gray-500">Nome completo</dt><dd>{o.contact?.name ?? o.participant}</dd></div>
              <div><dt className="text-xs text-gray-500">Celular / WhatsApp</dt><dd>{o.contact?.phone || "Não informado"}</dd></div>
              <div><dt className="text-xs text-gray-500">E-mail</dt><dd>{displayEmail(o.contact?.email)}</dd></div>
              {o.contact?.cpf && <div><dt className="text-xs text-gray-500">CPF</dt><dd>{o.contact.cpf}</dd></div>}
              <div><dt className="text-xs text-gray-500">Números escolhidos</dt><dd>{displayNumbers(o.numbers)}</dd></div>
              <div><dt className="text-xs text-gray-500">Situação do pagamento</dt><dd>{statusLabels[o.status] ?? "Pendente"}</dd></div>
            </dl>
            {o.isManual && <button type="button" className="block mt-3 border rounded px-3 py-2" onClick={() => void openManual(o)}>Editar pedido manual</button>}
            {o.contact?.phone && <a className="inline-block mt-3 underline" href={`https://wa.me/${o.contact.phone.replace(/\D/g,"").startsWith("55") && o.contact.phone.replace(/\D/g,"").length >= 12 ? o.contact.phone.replace(/\D/g,"") : "55"+o.contact.phone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>}
          </div>
          </details>
        ))}
      </div>
    </main>
  );
}

