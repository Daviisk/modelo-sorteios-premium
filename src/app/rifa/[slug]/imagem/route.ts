import { prisma } from "@/lib/prisma";
import { getRaffleGallery } from "@/lib/raffleGallery";
import { siteUrl } from "@/lib/site";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, props: { params: Promise<{ slug: string }> }) {
 const { slug } = await props.params;
 const raffle = await prisma.raffle.findUnique({ where: { slug }, select: { status: true, gallery: true, imageUrl: true } });
 if (!raffle || !["ATIVA", "SORTEADA"].includes(raffle.status)) return new Response(null, { status: 404 });
 const cover = getRaffleGallery(raffle.gallery, raffle.imageUrl)[0]?.url || "/images/modelo-logo.svg";
 const embedded = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(cover);
 if (embedded) {
  const bytes = Buffer.from(embedded[2], "base64");
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": `image/${embedded[1]}`, "Cache-Control": "public, max-age=60", "X-Content-Type-Options": "nosniff" } });
 }
 return Response.redirect(new URL(cover, siteUrl("/")), 307);
}

