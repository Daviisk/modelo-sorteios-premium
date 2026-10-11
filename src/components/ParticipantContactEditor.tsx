"use client";
import { useState } from "react";
import { formatMobile } from "@/lib/checkoutContact";
type Contact = { id: string; name: string; email: string; phone: string };
export default function ParticipantContactEditor({ contact, onSaved }: { contact: Contact; onSaved: (value: Contact) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: contact.name, email: contact.email, phone: formatMobile(contact.phone) });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/admin/participantes/${contact.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contact: form, identityVerified: true }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "Não foi possível salvar."); return; }
      onSaved(data.contact); setOpen(false);
    } catch { setError("Falha de conexão. Confira os dados antes de repetir."); }
    finally { setBusy(false); }
  }
  if (!open) return <button className="underline text-xs" onClick={() => setOpen(true)}>Corrigir contato</button>;
  return <form className="mt-3 space-y-2 text-left w-full min-w-0" onSubmit={submit}>
    {error && <p role="alert" className="text-red-700 text-xs">{error}</p>}
    <label className="block text-xs">Nome completo<input className="block border rounded p-2 w-full" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
    <label className="block text-xs">Celular<input className="block border rounded p-2 w-full" type="tel" required value={form.phone} onChange={e => setForm({ ...form, phone: formatMobile(e.target.value) })} /></label>
    <label className="block text-xs">E-mail<input className="block border rounded p-2 w-full" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
    <label className="block text-xs"><input type="checkbox" required /> Verifiquei a identidade do titular e a correção solicitada.</label>
    <button className="btn-primary text-xs" disabled={busy}>{busy ? "Salvando..." : "Salvar correção"}</button>
    <button type="button" className="underline text-xs ml-3" onClick={() => setOpen(false)}>Cancelar</button>
  </form>;
}

