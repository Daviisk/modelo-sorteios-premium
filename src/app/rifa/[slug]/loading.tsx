export default function LoadingRaffle() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8" role="status" aria-live="polite" aria-busy="true">
      <p className="font-semibold mb-4">Abrindo rifa…</p>
      <div className="card p-5 mb-5 motion-safe:animate-pulse" aria-hidden="true">
        <div className="h-6 w-2/3 rounded bg-gray-200 mb-4" />
        <div className="h-32 rounded bg-gray-100" />
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 motion-safe:animate-pulse" aria-hidden="true">
        {Array.from({ length: 20 }, (_, i) => <div key={i} className="h-10 rounded bg-gray-200" />)}
      </div>
    </main>
  );
}

