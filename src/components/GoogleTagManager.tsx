"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { activateGoogleAnalytics } from "@/lib/googleEvents";
import { CONSENT_KEY } from "@/lib/metaEvents";
declare global { interface Window { dataLayer?: unknown[]; } }
export default function GoogleTagManager() {
 const pathname = usePathname();
 useEffect(() => {
  const update = () => {
   try {
    const publicPage = !/^\/(admin|api|pedido|checkout)(\/|$)/.test(pathname);
    const allowed = publicPage && localStorage.getItem(CONSENT_KEY) === "accepted";
    window.dataLayer ??= [];
    function command(..._args: unknown[]) { window.dataLayer!.push(arguments); }
    command("consent", "update", {
     analytics_storage: allowed ? "granted" : "denied",
     ad_storage: allowed ? "granted" : "denied",
     ad_user_data: allowed ? "granted" : "denied",
     ad_personalization: allowed ? "granted" : "denied",
    });
    if (allowed) activateGoogleAnalytics();
    if (!allowed) {
     for (const name of document.cookie.split(";").map(cookie => cookie.trim().split("=")[0]).filter(name => /^_ga(?:_|$)|^_gid$|^_gat|^_gcl_/.test(name))) {
      document.cookie = name + "=; Max-Age=0; Path=/";
      const parts = location.hostname.split(".");
      for (let index = 0; index < parts.length - 1; index++) {
       document.cookie = name + "=; Max-Age=0; Path=/; Domain=" + parts.slice(index).join(".");
      }
     }
    }
   } catch {}
  };
  update();
  window.addEventListener("meta-consent-change", update);
  return () => window.removeEventListener("meta-consent-change", update);
 }, [pathname]);
 return null;
}

