import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Sorteios Premium | Demonstração", description: "Modelo demonstrativo de plataforma de sorteios, sem checkout ou pagamentos.", robots: {index:false,follow:false}, icons:{icon:"/images/modelo-logo.svg"} };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="pt-BR"><body>{children}<footer className="mx-auto max-w-5xl px-4 pb-10 pt-8 text-center text-xs text-gray-500"><p>Modelo ilustrativo • Nenhum sorteio ou pagamento real</p><p className="mt-2">Desenvolvido por <a className="font-semibold underline" href="https://drv-digital.vercel.app/" target="_blank" rel="noopener noreferrer">DRV Digital</a></p></footer></body></html>}
