import "./globals.css";
import type { Metadata } from "next";
export const metadata:Metadata={title:"Modelo Sorteios Premium | Demonstração",description:"Demonstração de plataforma personalizável para campanhas e sorteios"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body style={{margin:0}}>{children}</body></html>}
