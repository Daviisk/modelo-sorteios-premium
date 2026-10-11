import Link from "next/link";
export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return <main className="max-w-3xl mx-auto px-4 py-10"><Link href="/" className="text-sm underline">← Voltar às rifas</Link>
    <article className="card p-6 sm:p-8 mt-5 space-y-5"><h1 className="text-2xl font-bold">{title}</h1>{children}</article>
  </main>;
}

