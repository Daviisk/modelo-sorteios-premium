"use client";

import RaffleGalleryEditor from "@/components/RaffleGalleryEditor";
import { getRaffleGallery, type RaffleImage } from "@/lib/raffleGallery";
import { useState } from "react";
import { useRouter } from "next/navigation";



export default function NovaRifa() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", slug: "", description: "", prize: "", numberPrice: "10,00",
    totalNumbers: "100", drawDate: "", rules: "", gallery: [] as RaffleImage[],
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const res = await fetch("/api/admin/rifas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, numberPrice: Number(form.numberPrice.replace(",", ".")), totalNumbers: Number(form.totalNumbers) }) });
      const data = await res.json();
      if (!res.ok) {
        const labels: Record<string, string> = { title: "Nome da rifa", slug: "Slug", description: "Descrição", prize: "Prêmio", prizeValue: "Valor do prêmio", numberPrice: "Valor por número", totalNumbers: "Quantidade de números", drawDate: "Data do sorteio", imageUrl: "Imagem" };
        const fields = data.error?.fieldErrors as Record<string, string[]> | undefined;
        setError(typeof data.error === "string" ? data.error : fields ? Object.entries(fields).map(([key, messages]) => `${labels[key] || key}: ${messages.join(" ")}`).join(" · ") : "Não foi possível criar a rifa. Confira os campos.");
        return;
      }
      router.push(`/admin/rifas/${data.raffle.id}/editar`);
    } catch { setError("Falha de conexão. Tente novamente."); }
    finally { setLoading(false); }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return <main className="max-w-lg mx-auto px-4 py-8">
    <h1 className="text-xl font-bold mb-4">Criar nova rifa</h1>
    <form onSubmit={handleSubmit} className="card p-5 space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <label className="block text-sm font-medium">Título da campanha<input className="w-full border rounded-lg px-3 py-2 mt-1" placeholder="Ex.: Campanha Especial" value={form.title} onChange={set("title")} required /></label>
      <label className="block text-sm font-medium">Identificador do link (slug)<input className="w-full border rounded-lg px-3 py-2 mt-1" placeholder="Ex.: evento-anual-2026" pattern="[a-z0-9-]+" value={form.slug} onChange={set("slug")} required /></label>
      <label className="block text-sm font-medium">Descrição da campanha<textarea className="w-full border rounded-lg px-3 py-2 mt-1" rows={3} placeholder="Explique a finalidade do sorteio e o que será realizado." value={form.description} onChange={set("description")} required /></label>
      <label className="block text-sm font-medium">Prêmio<input className="w-full border rounded-lg px-3 py-2 mt-1" placeholder="Ex.: 3 dobrões personalizados + bolsa de couro" value={form.prize} onChange={set("prize")} required /></label>
      <label className="block text-sm font-medium">Valor por número (R$)<input className="w-full border rounded-lg px-3 py-2 mt-1" type="text" inputMode="decimal" placeholder="0,01" pattern="[0-9]+([,.][0-9]{1,2})?" title="Digite um valor em reais, como 0,01 ou 10,50" value={form.numberPrice} onChange={set("numberPrice") } required /></label>
      <label className="block text-sm font-medium">Quantidade de números<input className="w-full border rounded-lg px-3 py-2 mt-1" type="number" min="1" max="100000" step="1" value={form.totalNumbers} onChange={set("totalNumbers")} required /></label>
      <label className="block text-sm font-medium">Data e horário do sorteio<input className="w-full border rounded-lg px-3 py-2 mt-1" type="datetime-local" value={form.drawDate} onChange={set("drawDate")} required /></label>
      <div className="space-y-1"><p className="text-sm font-medium">Imagens da campanha</p></div>
      <RaffleGalleryEditor value={form.gallery} onChange={(gallery: RaffleImage[]) => setForm((current: typeof form) => ({ ...current, gallery }))} onBusyChange={setUploading} onError={setError} disabled={loading || uploading} />
      <label className="block text-sm font-medium">Informações adicionais (opcional)<textarea className="w-full border rounded-lg px-3 py-2" rows={4} maxLength={2000} value={form.rules} onChange={set("rules")} placeholder="Destino da arrecadação ou mensagem da campanha" /></label>
      <button className="btn-primary w-full" disabled={loading || uploading}>{loading ? "Criando..." : "Criar rifa"}</button>
      <p className="text-xs text-gray-400">O regulamento é padrão para todas as rifas. Após criar, selecione o status ATIVA e salve para publicar.</p>
    </form>
  </main>;
}

