import type { Metadata } from "next";
import DemoShowcase from "@/components/DemoShowcase";
export const metadata: Metadata = { title: "Sorteios Premium | Demonstração", description: "Modelo visual de plataforma de sorteios. Demonstração interativa sem cadastro, checkout ou pagamentos.", robots: { index: false, follow: false } };
export default function Home() { return <DemoShowcase />; }
