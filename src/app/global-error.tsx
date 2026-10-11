"use client";
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="pt-BR"><body style={{ fontFamily: "system-ui", background: "#f7f7fb", color: "#1a1a2e", padding: "64px 24px", textAlign: "center" }}>
    <h1>Não conseguimos carregar a página</h1><p>Ocorreu uma falha temporária. Se já pagou, confira seu pedido com o organizador antes de repetir.</p>
    <button onClick={reset}>Tentar novamente</button><p><a href="/">Voltar para as rifas</a></p>
  </body></html>;
}

