"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Statistiques", adminOnly: true, external: false },
  { href: "/dashboard/calendar", label: "Calendrier", adminOnly: false, external: false },
  { href: "/dashboard/heating", label: "Chauffage", adminOnly: false, external: false },
  { href: "/dashboard/water-heater", label: "Eau chaude", adminOnly: false, external: false },
  { href: "/dashboard/invoices", label: "Factures", adminOnly: true, external: false },
  { href: "/dashboard/taxe-sejour", label: "Taxe de séjour", adminOnly: true, external: false },
  { href: "/dashboard/fiscal", label: "Fiscalité", adminOnly: true, external: false },
  { href: "/fr/guide-arrivee", label: "Guide voyageurs", adminOnly: true, external: true },
];

interface DashboardNavProps {
  role?: "admin" | "viewer";
}

export default function DashboardNav({ role = "admin" }: DashboardNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Ferme le menu mobile sur changement de route
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Bloque le scroll du body quand le drawer mobile est ouvert
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/dashboard/login");
  }

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin");

  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo + Desktop nav */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold text-rose-500">
            Coliving Barbusse
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {visibleItems.map((item) => {
              const isActive =
                !item.external &&
                (item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href || pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? "text-rose-500 underline underline-offset-4"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {item.label}
                  {item.external && " ↗"}
                </Link>
              );
            })}
            {role === "admin" && (
              <Link href="/" className="text-sm text-gray-300 hover:text-gray-500">
                Retour au site
              </Link>
            )}
          </div>
        </div>

        {/* Desktop logout */}
        <button
          onClick={handleLogout}
          className="hidden rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 md:inline-flex"
        >
          Déconnexion
        </button>

        {/* Mobile burger button */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={isOpen}
          aria-controls="dashboard-mobile-menu"
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${isOpen ? "" : "pointer-events-none"}`}
        id="dashboard-mobile-menu"
      >
        {/* Overlay */}
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Panel */}
        <div
          className={`absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl transition-transform ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <span className="text-base font-bold text-rose-500">Menu</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer le menu"
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {visibleItems.map((item) => {
                const isActive =
                  !item.external &&
                  (item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href || pathname.startsWith(item.href + "/"));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      onClick={() => setIsOpen(false)}
                      className={`block rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-rose-50 text-rose-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {item.label}
                      {item.external && " ↗"}
                    </Link>
                  </li>
                );
              })}
              {role === "admin" && (
                <li>
                  <Link
                    href="/"
                    onClick={() => setIsOpen(false)}
                    className="block rounded-md px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50"
                  >
                    Retour au site
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          <div className="border-t border-gray-100 p-4">
            <button
              onClick={handleLogout}
              className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
