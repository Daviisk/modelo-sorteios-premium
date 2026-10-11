"use client";
import { useEffect, useState } from "react";

export default function AdminEmailForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/admin/email").then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setEmail(data.email ?? "")).catch(() => setError("Não foi possível carregar o e-mail da conta."));
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/admin/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword: password })
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "Não foi possível alterar o e-mail."); return; }
      window.location.replace("/admin/login");
    } catch { setError("Falha de conexão. Tente novamente."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="card p-5 space-y-3 mt-6">
    <h2 className="font-bold">E-mail de acesso ao administrador</h2>
    <p className="text-xs text-gray-500">Este e-mail é usado para entrar no painel, não é o e-mail público de contato. Após alterar, entre novamente.</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <label className="block text-sm">E-mail de login<input className="w-full border rounded-lg px-3 py-2 mt-1" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" maxLength={254} /></label>
    <label className="block text-sm">Senha atual para confirmar<input className="w-full border rounded-lg px-3 py-2 mt-1" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" maxLength={72} /></label>
    <button className="btn-primary" disabled={busy}>{busy ? "Alterando..." : "Alterar e-mail e sair"}</button>
  </form>;
}

