"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function RefreshDashboardButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => setBusy(false), 500);
    });
  };

  const loading = pending || busy;
  return (
    <button
      type="button"
      onClick={refresh}
      disabled={loading}
      className="px-3 py-1.5 rounded-lg border text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? "Atualizando..." : "Atualizar painel"}
    </button>
  );
}

