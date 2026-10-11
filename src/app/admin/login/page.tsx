"use client";

import Link from "next/link";

import { useState } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState("401");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setErrorCode(res.status === 429 ? "429" : res.status === 503 ? "503" : "401");
        setError(data?.error ?? "Não foi possível entrar. Tente novamente.");
        return;
      }
      // Carrega o painel com o cookie recém-criado, sem reutilizar o cache da navegação.
      window.location.replace("/admin/dashboard");
    } catch {
      setErrorCode("conexao");
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-20">
      <h1 className="text-xl font-bold mb-4">Painel administrativo</h1>
      <form onSubmit={handleSubmit} className="card p-5 space-y-3">
        {error && <div role="alert" className="text-sm text-red-600"><p>{error}</p><Link className="underline" href={`/erro/${errorCode}`}>Ver orientação</Link></div>}
        <input
          className="w-full border rounded-lg px-3 py-2"
          type="email"
          autoComplete="username"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Senha"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

      </form>
    </main>
  );
}
