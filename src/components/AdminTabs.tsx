"use client";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "orders" },
  { href: "/admin/participantes", label: "Participantes", icon: "people" },
  { href: "/admin/sorteio", label: "Sorteio", icon: "trophy" },
  { href: "/admin/configuracoes", label: "Configurações", icon: "settings" },
] as const;

function TabIcon({ name }: { name: typeof tabs[number]["icon"] }) {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    orders: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    people: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v1"/></>,
    trophy: <><path d="M7 3h10v7a5 5 0 0 1-10 0V3ZM7 5H4v3a4 4 0 0 0 4 4M17 5h3v3a4 4 0 0 1-4 4M12 15v4M8 21h8M9 19h6"/></>,
    settings: <><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">{paths[name]}</svg>;
}

export default function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Seções do painel" className="mb-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-sm w-full">
        {tabs.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return <a key={tab.href} href={tab.href} aria-current={active ? "page" : undefined}
            className={`flex w-full min-w-0 items-center justify-center gap-1.5 xl:gap-2 text-center px-2 xl:px-3 py-2.5 min-h-11 rounded-xl border font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${tab.icon === "settings" ? "col-span-2 sm:col-span-1 max-sm:min-h-10" : ""} ${active ? "border-purple-700 bg-purple-700 text-white shadow-sm" : "border-gray-200 bg-white text-gray-700 hover:border-purple-400"}`}>
            <TabIcon name={tab.icon}/><span className="min-w-0 break-words text-[12px] lg:text-[11px] xl:text-sm leading-tight">{tab.label}</span>
          </a>;
        })}
      </div>
    </nav>
  );
}

