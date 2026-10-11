"use client";
import { trackGoogle } from "@/lib/googleEvents";
type Pixel = ((...args: unknown[]) => void) & {queue?:unknown[][];callMethod?:(...args:unknown[])=>void;loaded?:boolean;version?:string};
declare global {interface Window {fbq?:Pixel;_fbq?:Pixel;}}
export const CONSENT_KEY="sorteios-premium-marketing-consent";
export function trackMeta(event:string,params:Record<string,unknown>={},onceKey?:string){
 trackGoogle(event, params, onceKey);
 try {
  const pixelId=process.env.NEXT_PUBLIC_META_PIXEL_ID; if(!pixelId)return;
  if(localStorage.getItem(CONSENT_KEY)!=="accepted")return;
  if(onceKey&&localStorage.getItem("meta-event:"+onceKey))return;
  if(!window.fbq){const pixel:Pixel=(...args)=>{if(pixel.callMethod)pixel.callMethod(...args);else pixel.queue?.push(args);};pixel.queue=[];pixel.loaded=true;pixel.version="2.0";window.fbq=pixel;window._fbq=pixel;pixel("set","autoConfig",false,pixelId);pixel("init",pixelId);const script=document.createElement("script");script.async=true;script.src="https://connect.facebook.net/en_US/fbevents.js";document.head.appendChild(script);}
  window.fbq("consent","grant");
  window.fbq("track",event,params,...(onceKey?[{eventID:onceKey}]:[]));
  if(onceKey)localStorage.setItem("meta-event:"+onceKey,"1");
 }catch{}
}

