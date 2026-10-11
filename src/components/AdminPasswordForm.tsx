"use client";
import { useState } from "react";
export default function AdminPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/senha", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: form.get("currentPassword"), newPassword: form.get("newPassword") }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "Não foi possível alterar a senha."); return; }
      window.location.replace("/admin/login");
    } catch { setError("Falha de conexão. Confira sua sessão antes de repetir."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="card p-5 space-y-3 mt-6"><h2 className="font-bold">Segurança da conta</h2>
    <p className="text-xs text-gray-500">Se ainda usa a senha de demonstração, substitua-a. Ao alterar a senha, as sessões administrativas anteriores deixam de ser válidas.</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <label className="block text-sm">Senha atual<input className="w-full border rounded-lg px-3 py-2 mt-1" type="password" name="currentPassword" autoComplete="current-password" required maxLength={72} /></label>
    <label className="block text-sm">Nova senha<input className="w-full border rounded-lg px-3 py-2 mt-1" type="password" name="newPassword" autoComplete="new-password" required minLength={8} maxLength={72} /></label>
    <button className="btn-primary" disabled={busy}>{busy ? "Alterando..." : "Alterar senha e sair"}</button>
  </form>;
}

