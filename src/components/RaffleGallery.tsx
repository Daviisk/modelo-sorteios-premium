"use client";

import { useState } from "react";

import { getRaffleGallery, type RaffleImage } from "@/lib/raffleGallery";
export default function RaffleGallery({ imageUrl, gallery, prize }: { imageUrl?: string | null; gallery?: RaffleImage[]; prize: string }) {
  const images = getRaffleGallery(gallery, imageUrl).map(image => ({src:image.url,alt:image.caption || `Prêmio: ${prize}`,caption:[image.caption,image.illustrative ? "Imagem ilustrativa" : ""].filter(Boolean).join(" · ")}));
  const [selected, setSelected] = useState(0);
  if (!images.length) return null;
  const current = images[Math.min(selected, images.length - 1)];
  return <div className="mt-5 min-w-0">
    <figure>
      <img src={current.src} alt={current.alt} width={1000} height={1000} className="w-full max-h-[480px] aspect-square sm:aspect-[4/3] object-contain rounded-xl bg-stone-50" />
      {current.caption && <figcaption aria-live="polite" className="mt-2 text-center text-xs text-gray-500">{current.caption}</figcaption>}
    </figure>
    {images.length > 1 && <div className="mt-3 flex flex-wrap justify-center gap-3" aria-label="Fotos do prêmio">
      {images.map((item, index) => <button key={index} type="button" aria-label={`Ver foto ${index + 1}: ${item.alt}`} aria-pressed={selected === index} onClick={() => setSelected(index)} className={`h-20 w-20 overflow-hidden rounded-lg border-2 bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-600 ${selected === index ? "border-purple-600" : "border-transparent"}`}>
        <img src={item.src} alt="" loading="lazy" width={80} height={80} className="h-full w-full object-cover" />
      </button>)}
    </div>}
  </div>;
}
