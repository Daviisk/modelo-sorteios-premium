"use client";
import AdminTabs from "@/components/AdminTabs";

import { useEffect, useState } from "react";

type RaffleOpt = {
  id: string;
  title: string;
  drawDate: string;
  soldCount: number;
  alreadyDrawn: boolean;
  winningNumber: number | null;
};

const pad = (n: number) => String(n).padStart(2, "0");

export default function Sorteio() {
  const [raffles, setRaffles] = useState<RaffleOpt[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/sorteio")
      .then((r) => r.json())
      .then((d) => {
        setRaffles(d.raffles ?? []);
        if (!selectedId && d.raffles?.[0]) setSelectedId(d.raffles[0].id);
      });
  }

  useEffect(load, []);

  const selected = raffles.find((r) => r.id === selectedId);

  async function handleDraw() {
    if (!selected || selected.alreadyDrawn) return;
    if (new Date(selected.drawDate).getTime() > Date.now()) {
      setError("O sorteio só pode ser realizado na data programada.");
      return;
    }
    const typed = window.prompt(`CONFIRMAÇÃO DE SEGURANÇA\n\nRifa: ${selected.title}\n\nPara autorizar o sorteio definitivo, digite SORTEAR:`);
    if (typed !== "SORTEAR") return;
    if (!window.confirm(`Confirmar DEFINITIVAMENTE o sorteio da rifa "${selected.title}"? Esta operação registra um resultado oficial.`)) return;
    setError(null);
    setResult(null);
    setSpinning(true);

    // Animação visual: números aleatórios "rodando" antes de revelar o resultado real
    const spinInterval = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 100));
    }, 80);

    const res = await fetch("/api/admin/sorteio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raffleId: selected.id, confirmation: "SORTEAR" }),
    });
    const data = await res.json();

    setTimeout(() => {
      clearInterval(spinInterval);
      setSpinning(false);
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setDisplayNumber(data.winningNumber);
      setResult(data.winningNumber);
      load();
    }, 2500);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 text-center">
      <h1 className="text-xl font-bold mb-4">Sorteio</h1><AdminTabs />

      <select
        className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
        value={selectedId}
        onChange={(e) => {
          setSelectedId(e.target.value);
          setResult(null);
          setDisplayNumber(null);
        }}
      >
        {raffles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.title} {r.alreadyDrawn ? "(já sorteada)" : ""}
          </option>
        ))}
      </select>

      {selected && (
        <div className="card p-5 mb-4 text-sm text-left">
          <div>
            Data do sorteio: {new Date(selected.drawDate).toLocaleString("pt-BR")}
          </div>
          <div>Números vendidos participantes: {selected.soldCount}</div>
        </div>
      )}

      <div className="card p-10 mb-4">
        <div className="text-6xl font-black" style={{ color: "var(--accent)" }}>
          {displayNumber !== null ? pad(displayNumber) : "--"}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {result !== null && !spinning && (
        <p className="text-sm font-semibold text-green-700 mb-3">
          🏆 Número vencedor: {pad(result)}
        </p>
      )}

      <button
        className="btn-primary w-full"
        disabled={!selected || selected.alreadyDrawn || spinning || new Date(selected.drawDate).getTime() > Date.now()}
        onClick={handleDraw}
      >
        {spinning ? "Sorteando..." : selected?.alreadyDrawn ? "Rifa já sorteada" : selected && new Date(selected.drawDate).getTime() > Date.now() ? "Aguardando data do sorteio" : "Realizar sorteio"}
      </button>
      {selected && !selected.alreadyDrawn && new Date(selected.drawDate).getTime() > Date.now() && <p className="text-xs text-amber-700 mt-2">Sorteio bloqueado até a data programada. Nenhum resultado será registrado antes disso.</p>}
      <p className="text-xs text-gray-400 mt-2">
        Utiliza crypto.randomInt (CSPRNG) sobre os números vendidos. O sorteio fica registrado com data, semente e administrador responsável.
      </p>
    </main>
  );
}

