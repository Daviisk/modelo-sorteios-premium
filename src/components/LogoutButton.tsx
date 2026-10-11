"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="text-sm border rounded-lg px-3 py-1.5"
      onClick={async () => {
        await fetch("/api/admin/auth", { method: "DELETE" });
        router.push("/admin/login");
      }}
    >
      Sair
    </button>
  );
}

