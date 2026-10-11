"use client";
import AdminTabs from "@/components/AdminTabs";

import AdminPasswordForm from "@/components/AdminPasswordForm";
import AdminEmailForm from "@/components/AdminEmailForm";

import { useEffect, useState } from "react";

export default function Configuracoes() {
  const [form, setForm] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoadError("");
    fetch("/api/admin/configuracoes", { cache: "no-store", signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 401 ? "Sua sessão expirou. Entre novamente no painel." : "Não foi possível carregar as configurações.");
        const data = await r.json();
        if (!data.settings || typeof data.settings !== "object") throw new Error("Os dados das configurações não estão disponíveis.");
        return data.settings;
      })
      .then((settings) => { if (!controller.signal.aborted) setForm(settings); })
      .catch((error) => { if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Falha ao carregar as configurações."); });
    return () => controller.abort();
  }, [reloadKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setSaveError("");
    try {
    const response = await fetch("/api/admin/configuracoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!response.ok) throw new Error("Não foi possível salvar as configurações.");
    setSaved(true);
    } catch (error) { setSaveError(error instanceof Error ? error.message : "Falha ao salvar."); }
    finally { setLoading(false); }
  }

  if (!form) return <main className="max-w-3xl mx-auto px-4 py-5"><h1 className="text-xl font-bold mb-4">Configurações</h1><AdminTabs /><div className="card p-5 mt-4">{loadError ? <><p role="alert" className="text-red-700 mb-4">{loadError}</p><button type="button" className="btn-primary" onClick={() => setReloadKey(k => k + 1)}>Tentar novamente</button></> : <p role="status">Carregando configurações...</p>}</div></main>;
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  return (
    <main className="max-w-3xl mx-auto px-4 py-5">
      <h1 className="text-xl font-bold mb-4">Configurações da plataforma</h1><AdminTabs />
      <p className="text-sm mb-4 text-gray-600">Atualize os dados do site. Abra a seção que deseja editar e salve as alterações ao terminar.</p>
      <form onSubmit={handleSubmit} className="card p-5 space-y-3">
        {saved && <p role="status" className="text-sm text-green-700">Configurações salvas!</p>}
        {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
        <details open className="rounded-xl border border-gray-200 p-3 sm:p-4">
          <summary className="cursor-pointer font-semibold">Identidade do site</summary>
          <div className="mt-3 space-y-3">
            <label className="block text-sm font-medium">Nome do site<input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.platformName ?? ""} onChange={set("platformName")} /></label>
            <label className="block text-sm font-medium">Endereço da imagem do logotipo<input className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="https://..." value={form.logoUrl ?? ""} onChange={set("logoUrl")} /></label>
            <label className="block text-sm font-medium">Cor principal do site<input className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="#7c3aed" value={form.primaryColor ?? ""} onChange={set("primaryColor")} /></label>
          </div>
        </details>
        <details className="rounded-xl border border-gray-200 p-3 sm:p-4">
          <summary className="cursor-pointer font-semibold">Contato</summary>
          <p className="mt-2 text-xs text-gray-500">Estes contatos podem aparecer nas páginas de atendimento e privacidade.</p>
          <div className="mt-3 space-y-3">
            <label className="block text-sm font-medium">WhatsApp para contato<input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.whatsapp ?? ""} onChange={set("whatsapp")} /></label>
            <label className="block text-sm font-medium">E-mail para contato<input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.email ?? ""} onChange={set("email")} /></label>
          </div>
        </details>
        <details className="rounded-xl border border-gray-200 p-3 sm:p-4">
          <summary className="cursor-pointer font-semibold">Pagamento</summary>
          <p className="mt-2 text-xs text-gray-500">Esta chave PIX é apenas informativa. Ela não altera o sistema que confirma os pagamentos.</p>
          <label className="mt-3 block text-sm font-medium">Chave PIX exibida no site<input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.pixKey ?? ""} onChange={set("pixKey")} /></label>
        </details>
        <details className="rounded-xl border border-gray-200 p-3 sm:p-4">
          <summary className="cursor-pointer font-semibold">Termos e privacidade</summary>
          <div className="mt-3 space-y-3">
            <label className="block text-sm font-medium">Link dos Termos de Uso<input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.termsUrl ?? ""} onChange={set("termsUrl")} /></label>
            <label className="block text-sm font-medium">Link da Política de Privacidade<input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.privacyUrl ?? ""} onChange={set("privacyUrl")} /></label>
          </div>
        </details>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </button>
        <p className="text-xs text-gray-400">
          As senhas e chaves do serviço de pagamento são configuradas separadamente, por segurança.
        </p>
      </form>
      <section aria-label="Conta do administrador" className="space-y-4 mt-6"><h2 className="text-lg font-bold">Conta e segurança</h2><details className="rounded-xl border border-gray-200 bg-white p-4"><summary className="cursor-pointer font-semibold">Alterar e-mail de acesso</summary><div className="mt-3"><AdminEmailForm /></div></details><details className="rounded-xl border border-gray-200 bg-white p-4"><summary className="cursor-pointer font-semibold">Alterar senha</summary><div className="mt-3"><AdminPasswordForm /></div></details></section>
    </main>
  );
}

