import { z } from "zod";
export const MAX_GALLERY_IMAGES = 8;
export const galleryImageSchema = z.object({
  url: z.string().max(4000000).refine(value => /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) || /^\/images\/[a-zA-Z0-9_./-]+$/.test(value) || /^https:\/\//.test(value), "Imagem inválida."),
  caption: z.string().trim().max(180).default(""),
  illustrative: z.boolean().default(false),
});
export const raffleGallerySchema = z.array(galleryImageSchema).max(MAX_GALLERY_IMAGES).refine(images => JSON.stringify(images).length <= 3500000, "As fotos ultrapassam o tamanho permitido. Remova ou reduza uma imagem.");
export type RaffleImage = z.infer<typeof galleryImageSchema>;
export function getRaffleGallery(value: unknown, imageUrl?: string | null): RaffleImage[] {
  const parsed = raffleGallerySchema.safeParse(value);
  if (parsed.success && parsed.data.length) return parsed.data;
  const fallback = galleryImageSchema.safeParse({url:imageUrl,caption:"",illustrative:false});
  return fallback.success ? [fallback.data] : [];
}

