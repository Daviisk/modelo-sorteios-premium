"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function AdminNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const lastPath = useRef(pathname);
  const hasInternalNavigation = useRef(false);

  useEffect(() => {
    if (lastPath.current !== pathname) {
      hasInternalNavigation.current = true;
      lastPath.current = pathname;
    }
  }, [pathname]);

  const isLogin = pathname === "/admin/login";
  const isDashboard = pathname === "/admin/dashboard";
  const fallback = isLogin || isDashboard ? "/" : "/admin/dashboard";

  function goBack() {
    let internalReferrer = false;
    try {
      const referrer = new URL(document.referrer);
      internalReferrer = referrer.origin === window.location.origin &&
        referrer.pathname !== "/admin/login" &&
        referrer.pathname !== pathname;
    } catch { /* Acesso direto: utiliza o destino de retorno. */ }
    if (window.history.length > 1 && (hasInternalNavigation.current || internalReferrer)) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <nav aria-label="Navegação administrativa" className="max-w-5xl mx-auto px-4 pt-4 flex flex-wrap items-center gap-3">
      <button type="button" onClick={goBack} className="border rounded-lg px-4 py-2 min-h-11 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
        ← Voltar
      </button>
      {!isLogin && !isDashboard && <Link href="/admin/dashboard" className="text-sm underline px-2 py-2">Painel</Link>}
      <Link href="/" className="text-sm underline px-2 py-2">Ver site</Link>
    </nav>
  );
}

