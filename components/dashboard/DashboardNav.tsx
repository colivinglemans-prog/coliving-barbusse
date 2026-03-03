"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardNav() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/dashboard/login");
  }

  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-rose-500"
          >
            Coliving Barbusse
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Retour au site
          </Link>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Déconnexion
        </button>
      </nav>
    </header>
  );
}
