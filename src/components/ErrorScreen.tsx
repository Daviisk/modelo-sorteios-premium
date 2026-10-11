import Link from "next/link";
import { errorCatalog, type ErrorKind } from "@/lib/errors";
export default function ErrorScreen({ kind, retry }: { kind: ErrorKind; retry?: () => void }) {
  const info = errorCatalog[kind];
  return <main className="max-w-lg mx-auto px-4 py-16 text-center">
    <div className="card p-8"><p className="text-sm font-semibold text-purple-700 mb-3">{/^\d+$/.test(kind) ? `Erro ${kind}` : "Precisamos da sua atenção"}</p>
      <h1 className="text-2xl font-bold mb-3">{info.title}</h1><p className="text-gray-600 mb-6">{info.message}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {retry && <button className="btn-primary" onClick={retry}>Tentar novamente</button>}
        {kind === "401" && <Link className="btn-primary" href="/admin/login">Entrar novamente</Link>}
        <Link className="border rounded-xl px-4 py-3" href="/">Ver rifas disponíveis</Link>
        <Link className="text-sm underline px-4 py-3" href="/privacidade/direitos">Falar com o responsável</Link>
      </div>
    </div>
  </main>;
}

