import { canReadOrder } from "@/lib/orderAccess";
import { notFound, redirect } from "next/navigation";
import { getOrderById } from "@/lib/services/orderService";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pad = (n: number) => String(n).padStart(2, "0");

const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  RESERVED: "Reservado",
  PAID: "Pago",
  CANCELLED: "Cancelado",
  EXPIRED: "Expirado",
};

export default async function OrderPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!(await canReadOrder(params.id))) redirect("/erro/403");
  const order = await getOrderById(params.id);
  if (!order) notFound();

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <div className="card p-5">
        <h1 className="font-bold text-lg mb-1">Pedido #{order.id.slice(-6).toUpperCase()}</h1>
        <p className="text-sm text-gray-500 mb-4">{order.raffle.title}</p>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between">
            <dt className="text-gray-500">Participante</dt>
            <dd>{order.participant.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Números</dt>
            <dd>{order.numbers.map((n) => pad(n.number)).join(", ")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Valor</dt>
            <dd>{fmt(Number(order.total))}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Status do pedido</dt>
            <dd className="font-semibold">{statusLabel[order.status] ?? order.status}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Status do pagamento</dt>
            <dd>{order.payment?.status ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Data</dt>
            <dd>{order.createdAt.toLocaleString("pt-BR")}</dd>
          </div>
        </dl>
      </div>
    </main>
  );
}


