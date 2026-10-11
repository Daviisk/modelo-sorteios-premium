import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDrawResult } from "@/lib/services/drawService";

const pad = (n: number) => String(n).padStart(2, "0");

export default async function ResultadoRifa(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const raffle = await prisma.raffle.findUnique({ where: { slug: params.slug } });
  if (!raffle) notFound();

  const result = await getDrawResult(raffle.id);

  return (
    <main className="max-w-md mx-auto px-4 py-16 text-center">
      <h1 className="text-xl font-bold mb-1">Resultado do sorteio</h1>
      <p className="text-sm text-gray-500 mb-6">{raffle.title}</p>

      {!result ? (
        <div className="card p-8 text-gray-500">Esta rifa ainda não foi sorteada.</div>
      ) : (
        <div className="card p-8">
          <div className="text-sm text-gray-500 mb-1">Número vencedor</div>
          <div className="text-5xl font-black mb-4" style={{ color: "var(--accent)" }}>
            {pad(result.draw.winningNumber)}
          </div>
          {result.winner && (
            <div className="text-sm mb-2">
              Ganhador: <span className="font-semibold">{result.winner.name.trim().split(/\s+/).map((part, index) => index === 0 ? part : `${part[0]}.`).join(" ")}</span>
            </div>
          )}
          <div className="text-xs text-gray-400">
            Sorteado em {result.draw.drawnAt.toLocaleString("pt-BR")}
          </div>
        </div>
      )}
    </main>
  );
}


