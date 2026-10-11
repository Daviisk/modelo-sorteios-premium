"use client";
import { useState } from "react";
import { MAX_GALLERY_IMAGES, type RaffleImage } from "@/lib/raffleGallery";
async function resize(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use fotos JPG, PNG ou WebP.");
  if(file.size > 15 * 1024 * 1024) throw new Error("Cada arquivo deve ter até 15 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d"); if (!context) throw new Error("Não foi possível processar a foto.");
    context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    let result = canvas.toDataURL("image/webp",.8);
    for (let quality=.7; result.length > 350000 && quality >= .2; quality -= .1) result=canvas.toDataURL("image/webp",quality);
    if(result.length > 350000) throw new Error("Foto muito grande. Escolha uma imagem menor.");
    return result;
  } finally { bitmap.close(); }
}
export default function RaffleGalleryEditor({value,onChange,onBusyChange,onError,disabled=false}:{value:RaffleImage[];onChange:(images:RaffleImage[])=>void;onBusyChange:(busy:boolean)=>void;onError:(error:string|null)=>void;disabled?:boolean}) {
  const [busy,setBusy]=useState(false);
  async function upload(files:File[]) {
    if (!files.length) return;
    if (value.length+files.length>MAX_GALLERY_IMAGES) {onError("Você pode adicionar até 8 fotos.");return;}
    setBusy(true);onBusyChange(true);onError(null);
    try {const images:RaffleImage[]=[];for(const file of files) images.push({url:await resize(file),caption:"",illustrative:false});onChange([...value,...images]);}
    catch(error){onError(error instanceof Error?error.message:"Não foi possível carregar as fotos.");}
    finally{setBusy(false);onBusyChange(false);}
  }
  const locked=busy||disabled;
  function move(index:number,direction:number){const next=[...value];[next[index],next[index+direction]]=[next[index+direction],next[index]];onChange(next);}
  return <fieldset disabled={locked} className="min-w-0 w-full max-w-full space-y-3 border-t pt-4">
    <legend className="text-sm font-semibold">Fotos do prêmio (até 8)</legend>
    <p className="text-xs text-gray-500">A primeira foto será a capa. Adicione, organize e remova fotos antes de salvar.</p>
    <label className="inline-flex max-w-full cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-800 break-words">Escolher fotos<input className="sr-only" aria-label="Adicionar fotos" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={locked||value.length>=8} onChange={event=>{const files=Array.from(event.target.files??[]);event.target.value="";void upload(files);}} /></label>
    {busy&&<p role="status" className="text-sm">Preparando fotos...</p>}
    {value.map((photo,index)=><div key={index} className="border rounded-lg p-3 space-y-2">
      <img src={photo.url} alt={photo.caption||`Foto ${index+1}`} className="w-full h-36 object-contain" />
      <p className="text-xs font-semibold">{index===0?"Capa":`Foto ${index+1}`}</p>
      <label className="block text-xs">Legenda<input maxLength={180} className="w-full border rounded px-2 py-1" value={photo.caption} onChange={event=>onChange(value.map((item,i)=>i===index?{...item,caption:event.target.value}:item))} /></label>
      <label className="flex gap-2 text-xs"><input type="checkbox" checked={photo.illustrative} onChange={event=>onChange(value.map((item,i)=>i===index?{...item,illustrative:event.target.checked}:item))} />Imagem ilustrativa</label>
      <div className="flex flex-wrap gap-3 text-xs"><button type="button" disabled={locked||index===0} onClick={()=>move(index,-1)}>Mover para cima</button><button type="button" disabled={locked||index===value.length-1} onClick={()=>move(index,1)}>Mover para baixo</button><button type="button" className="text-red-600" onClick={()=>onChange(value.filter((_,i)=>i!==index))}>Remover</button></div>
    </div>)}
  </fieldset>;
}

