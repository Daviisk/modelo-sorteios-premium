"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteRaffleButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    if (!window.confirm(`Excluir a rifa "${title}"?\n\nOs números, pedidos, pagamentos registrados e sorteio desta rifa serão apagados permanentemente. Isso não estorna pagamentos no Mercado Pago.\n\nConfirma a exclusão?`)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/rifas/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "EXCLUIR", raffleId: id }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Não foi possível excluir. Tente novamente.");
      }
      router.replace("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir.");
    } finally { setBusy(false); }
  }
  return <div>
    <button type="button" disabled={busy} onClick={remove} className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50">{busy ? "Excluindo..." : "Excluir rifa"}</button>
    {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
  </div>;
}

