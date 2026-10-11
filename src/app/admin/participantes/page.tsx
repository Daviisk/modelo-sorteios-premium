"use client";
import AdminTabs from "@/components/AdminTabs";

import ParticipantContactEditor from "@/components/ParticipantContactEditor";

import { useEffect, useState } from "react";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Participantes() {
  const [list, setList] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      const qs = search ? `?search=${encodeURIComponent(search)}` : "";
      fetch(`/api/admin/participantes${qs}`)
        .then(async (r) => { if (!r.ok) throw new Error("Não foi possível carregar os participantes."); return r.json(); })
        .then((d) => setList(d.participants ?? []))
        .catch(() => setMessage("Não foi possível carregar os participantes. Verifique sua sessão e tente novamente."))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function removeIdentifiers(id: string) {
    if (!window.confirm("Você verificou a identidade do solicitante e analisou as obrigações de retenção? Nome, CPF, celular e e-mail serão removidos; o histórico financeiro e cópias externas permanecem. Essa ação não pode ser desfeita.")) return;
    setBusy(id); setMessage(null);
    try {
      const response = await fetch(`/api/admin/participantes/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "remove-identifiers", identityVerified: true, retentionReviewed: true }) });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error ?? "Não foi possível remover os dados."); return; }
      setList(current => current.map(p => p.id === id ? { ...p, name: "Participante anonimizado", phone: "", email: "" } : p));
      setMessage("Identificadores removidos. Avalie também backups, exportações e registros dos fornecedores.");
    } catch { setMessage("Falha de conexão. Confira o resultado antes de repetir."); }
    finally { setBusy(null); }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-5">
      <h1 className="text-xl font-bold mb-4">Participantes</h1><AdminTabs />
      <details className="mb-4 rounded-xl border border-gray-200 bg-white p-3 text-sm"><summary className="cursor-pointer font-semibold text-gray-700">Privacidade e proteção de dados</summary><p className="mt-2 text-gray-600">Antes de entregar ou apagar dados, confirme a identidade da pessoa. Alguns registros de pagamento precisam ser mantidos por obrigação legal.</p></details>
      {message && <p role="status" className="text-sm mb-4">{message}</p>}
      <input
        className="w-full border rounded-xl px-3 py-3 mb-4 text-sm"
        placeholder="Buscar por nome, e-mail, WhatsApp ou CPF"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="card divide-y overflow-hidden">
        {loading && <div className="p-4 text-sm text-gray-500">Carregando...</div>}
        {!loading && list.length === 0 && <div className="p-4 text-sm text-gray-500">Nenhum participante encontrado.</div>}
        {list.map((p) => (
          <div key={p.id} className="p-4 text-sm min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold break-words">{p.name}</div>
                <div className="text-gray-500 text-xs mt-1 space-y-1"><div>{p.phone || "Telefone não informado"}</div><div className="break-all">{p.email && !p.email.endsWith("@invalid.local") ? p.email : "E-mail não informado"}</div></div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-semibold">{fmt(p.totalSpent)}</div>
                <div className="text-xs text-gray-500">{p.totalNumbers} {p.totalNumbers === 1 ? "número" : "números"}</div>
              </div>
            </div>
            <details className="mt-3 rounded-lg border border-gray-200 bg-gray-50 group">
              <summary className="cursor-pointer px-3 py-2 font-semibold text-purple-800">Gerenciar participante</summary>
              <div className="px-3 pb-3 flex flex-wrap items-center gap-3">
                <ParticipantContactEditor contact={p} onSaved={contact => setList(current => current.map(item => item.id === contact.id ? { ...item, ...contact } : item))} />
                <a className="underline text-xs" href={`/api/admin/participantes/${p.id}`} onClick={event => { if (!window.confirm("Confirme que verificou a identidade do solicitante. Entregue esta exportação apenas por um canal seguro ao titular correto.")) event.preventDefault(); }}>Baixar dados</a>
                <button className="underline text-xs text-red-700" disabled={busy === p.id} onClick={() => removeIdentifiers(p.id)}>{busy === p.id ? "Processando..." : "Remover identificadores"}</button>
              </div>
            </details>
          </div>
        ))}
      </div>
    </main>
  );
}

