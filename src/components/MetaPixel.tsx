"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { trackMeta, CONSENT_KEY } from "@/lib/metaEvents";
const KEY=CONSENT_KEY;
export default function MetaPixel() {
  const pathname = usePathname();
  const [consent,setConsent] = useState<string|null>(null);
  const [ready,setReady] = useState(false);
  const [open,setOpen] = useState(false);
  const excluded = /^\/(admin|api|checkout|pedido)(\/|$)/.test(pathname);
  useEffect(()=>{try {const stored=localStorage.getItem(KEY);setConsent(stored);setOpen(!stored);}catch{setOpen(true);}setReady(true);},[]);
  useEffect(()=>{
    if(consent!=="accepted"||excluded)return;
    trackMeta("PageView");
  },[consent,excluded,pathname]);
  function choose(value:string){try{localStorage.setItem(KEY,value);}catch{}setConsent(value);setOpen(false);window.dispatchEvent(new Event("meta-consent-change"));if(value==="rejected"){window.fbq?.("consent","revoke");for(const name of ["_fbp","_fbc"]) {document.cookie=name+"=; Max-Age=0; Path=/";document.cookie=name+"=; Max-Age=0; Path=/; Domain="+location.hostname;}}}
  if(!ready||excluded)return null;
  return <><button type="button" className="block mx-auto text-xs underline mb-4" onClick={()=>setOpen(true)}>Preferências de cookies</button>{open&&<aside aria-label="Preferências de cookies" className="fixed bottom-4 left-4 right-4 z-50 max-w-xl mx-auto rounded-xl bg-white border shadow-xl p-5 text-sm"><p>Usamos cookies necessários para o site funcionar. Com sua autorização, o Meta Pixel e as tags configuradas no Google Tag Manager medem visitas e ajudam a avaliar anúncios. Você pode recusar e continuar usando o site.</p><a href="/cookies" className="underline text-xs">Política de cookies</a><div className="flex gap-3 mt-4"><button type="button" className="border rounded-lg px-4 py-2" onClick={()=>choose("rejected")}>Recusar opcionais</button><button type="button" className="btn-primary" onClick={()=>choose("accepted")}>Aceitar publicidade</button></div></aside>}</>;
}

