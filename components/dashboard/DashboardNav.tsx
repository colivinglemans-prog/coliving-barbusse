"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Statistiques", adminOnly: true },
  { href: "/dashboard/calendar", label: "Calendrier", adminOnly: false },
  { href: "/dashboard/heating", label: "Chauffage", adminOnly: false },
  { href: "/dashboard/water-heater", label: "Eau chaude", adminOnly: false },
];

interface DashboardNavProps {
  role?: "admin" | "viewer";
}

export default function DashboardNav({ role = "admin" }: DashboardNavProps) {
  const router = useRouter();
  const pathname = usePathname();

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
          {NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin").map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? "text-rose-500 underline underline-offset-4"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {role === "admin" && (
            <Link
              href="/"
              className="text-sm text-gray-300 hover:text-gray-500"
            >
              Retour au site
            </Link>
          )}
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
