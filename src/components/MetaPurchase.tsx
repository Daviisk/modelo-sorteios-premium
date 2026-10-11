"use client";
import { useEffect } from "react";
import { trackMeta } from "@/lib/metaEvents";
export default function MetaPurchase({orderId,total,quantity,slug}:{orderId:string;total:number;quantity:number;slug:string}){
 useEffect(()=>{const send=()=>trackMeta("Purchase",{value:total,currency:"BRL",num_items:quantity,content_ids:[slug],content_type:"product"},`purchase:${orderId}`);send();window.addEventListener("meta-consent-change",send);return()=>window.removeEventListener("meta-consent-change",send);},[orderId,total,quantity,slug]);return null;
}

