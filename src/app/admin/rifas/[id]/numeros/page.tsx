"use client";

import { useEffect, useMemo, useState, use } from "react";

type Num = {
  number: number;
  status: "AVAILABLE" | "RESERVED" | "SOLD";
  participantName: string | null;
  participantPhone: string | null;
  orderId: string | null;
  orderDate: string | null;
};

const pad = (n: number) => String(n).padStart(2, "0");
const filters = [
  { key: "all", label: "Todos" },
  { key: "AVAILABLE", label: "Disponíveis" },
  { key: "RESERVED", label: "Reservados" },
  { key: "SOLD", label: "Vendidos" },
] as const;

export default function NumerosRifa(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [numbers, setNumbers] = useState<Num[]>([]);
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const [selected, setSelected] = useState<Num | null>(null);

  useEffect(() => {
    fetch(`/api/admin/rifas/${params.id}/numeros`)
      .then((r) => r.json())
      .then((d) => setNumbers(d.numbers ?? []));
  }, [params.id]);

  const filtered = useMemo(
    () => (filter === "all" ? numbers : numbers.filter((n) => n.status === filter)),
    [numbers, filter]
  );

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">Números da rifa</h1>

      <div className="flex flex-wrap gap-2 mb-4 text-sm">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`px-3 py-1.5 rounded-lg ${filter === f.key ? "bg-gray-900 text-white" : "border"}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-6">
        {filtered.map((n) => (
          <button
            key={n.number}
            className={`num-cell ${n.status === "SOLD" ? "sold" : n.status === "RESERVED" ? "reserved" : "available"}`}
            onClick={() => setSelected(n)}
          >
            {pad(n.number)}
          </button>
        ))}
      </div>

      {selected && (
        <div className="card p-5 text-sm space-y-1">
          <div className="font-bold text-lg mb-2">Número {pad(selected.number)}</div>
          <div>
            <span className="text-gray-500">Status: </span>
            {selected.status}
          </div>
          {selected.participantName && (
            <>
              <div>
                <span className="text-gray-500">Participante: </span>
                {selected.participantName}
              </div>
              <div>
                <span className="text-gray-500">WhatsApp: </span>
                {selected.participantPhone}
              </div>
              <div>
                <span className="text-gray-500">Pedido: </span>
                #{selected.orderId?.slice(-6).toUpperCase()}
              </div>
              <div>
                <span className="text-gray-500">Data: </span>
                {selected.orderDate ? new Date(selected.orderDate).toLocaleString("pt-BR") : "—"}
              </div>
            </>
          )}
          <button className="text-xs underline mt-2" onClick={() => setSelected(null)}>
            Fechar
          </button>
        </div>
      )}
    </main>
  );
}


