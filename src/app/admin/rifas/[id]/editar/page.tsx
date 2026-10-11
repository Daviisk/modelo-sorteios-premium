"use client";

import DeleteRaffleButton from "@/components/DeleteRaffleButton";
import RaffleGalleryEditor from "@/components/RaffleGalleryEditor";
import { getRaffleGallery, type RaffleImage } from "@/lib/raffleGallery";
import { useEffect, useState, use } from "react";

const STATUSES = ["RASCUNHO", "ATIVA", "PAUSADA", "ENCERRADA", "SORTEADA"];


export default function EditarRifa(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [form, setForm] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetch(`/api/admin/rifas/${params.id}`).then((r) => r.json()).then((d) => { if (d.raffle) setForm({ ...d.raffle, gallery: getRaffleGallery(d.raffle.gallery, d.raffle.imageUrl), numberPrice: Number(d.raffle.numberPrice).toFixed(2).replace(".", ","), drawDate: new Date(d.raffle.drawDate).toISOString().slice(0, 16) }); }); }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null); setSaved(false);
    try {
    const res = await fetch(`/api/admin/rifas/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.title, description: form.description, prize: form.prize, numberPrice: Number(String(form.numberPrice).replace(",", ".")), drawDate: form.drawDate, gallery: form.gallery, status: form.status, rules: form.rules ?? "" }) });
    setLoading(false); if (!res.ok) { setError("Erro ao salvar. Verifique os campos."); return; } setSaved(true);
    } catch { setError("Falha de conexão. Tente novamente."); } finally { setLoading(false); }
  }

  if (!form) return <main className="max-w-lg mx-auto px-4 py-8">Carregando...</main>;
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  return <main className="max-w-lg mx-auto px-4 py-8">
    <div className="flex items-center justify-between mb-4"><h1 className="text-xl font-bold">Editar rifa</h1><a href={`/admin/rifas/${params.id}/numeros`} className="text-sm underline">Ver grade de números →</a></div>
    <form onSubmit={handleSubmit} className="card p-5 space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}{saved && <p className="text-sm text-green-600">Alterações salvas!</p>}
      <label className="text-xs text-gray-500">Status</label><select className="w-full border rounded-lg px-3 py-2" value={form.status} onChange={set("status")}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
      <input className="w-full border rounded-lg px-3 py-2" aria-label="Título da campanha" placeholder="Título da campanha / rifa" value={form.title} onChange={set("title")} />
      <textarea className="w-full border rounded-lg px-3 py-2" placeholder="Descrição" value={form.description} onChange={set("description")} />
      <input className="w-full border rounded-lg px-3 py-2" aria-label="Prêmio" placeholder="Prêmio (ex.: 3 Dobrões personalizados + Bolsa)" value={form.prize} onChange={set("prize")} />
      <input className="w-full border rounded-lg px-3 py-2" type="text" inputMode="decimal" pattern="[0-9]+([,.][0-9]{1,2})?" title="Digite um valor em reais, como 0,01 ou 10,50" placeholder="Valor por número (ex.: 0,01)" value={form.numberPrice} onChange={set("numberPrice")} />
      <input className="w-full border rounded-lg px-3 py-2" type="datetime-local" value={form.drawDate} onChange={set("drawDate")} />
      <RaffleGalleryEditor value={form.gallery} onChange={(gallery: RaffleImage[]) => setForm((current: typeof form) => ({ ...current, gallery }))} onBusyChange={setUploading} onError={setError} disabled={loading || uploading} />
      <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">O regulamento é padrão e igual para todas as rifas, por isso não é editável aqui.</div>
      <div className="border-t pt-4">
        <label htmlFor="raffle-info" className="block text-sm font-semibold mb-1">Informações adicionais (opcional)</label>
        <p id="raffle-info-help" className="text-xs text-gray-500 mb-2">Informe o destino da arrecadação ou uma mensagem sobre esta rifa. Deixe vazio para não exibir essa área no site.</p>
        <textarea id="raffle-info" aria-describedby="raffle-info-help" className="w-full border rounded-lg px-3 py-2" rows={4} maxLength={2000} placeholder="Toda a arrecadação será destinada à iniciativa informada pelo organizador." value={form.rules ?? ""} onChange={set("rules")} />
      </div>
      <button className="btn-primary w-full" disabled={loading || uploading}>{loading ? "Salvando..." : "Salvar alterações"}</button>
    </form>
    <div className="mt-5"><DeleteRaffleButton id={params.id} title={form.title} /></div>
    <p className="text-xs text-gray-400 mt-3">A quantidade de números não pode ser reduzida abaixo do maior número já vendido/reservado.</p>
  </main>;
}


