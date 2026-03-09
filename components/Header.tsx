"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { locale, t, setLocale } = useTranslation();

  const toggleLocale = () => setLocale(locale === "fr" ? "en" : "fr");

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-primary">
          Coliving Barbusse - Maison premium 9 suites privatives Proche Circuit Le Mans
        </Link>

        {/* Desktop nav */}
        <ul className="hidden gap-6 text-sm font-medium text-secondary md:flex md:items-center">
          <li>
            <Link href="/#chambres" className="transition-colors hover:text-foreground">
              {t.header.rooms}
            </Link>
          </li>
          <li>
            <Link href="/#equipements" className="transition-colors hover:text-foreground">
              {t.header.amenities}
            </Link>
          </li>
          <li>
            <Link href="/#localisation" className="transition-colors hover:text-foreground">
              {t.header.location}
            </Link>
          </li>
          <li>
            <Link
              href="/#disponibilite"
              className="rounded-full bg-primary px-5 py-2 text-white transition-colors hover:bg-primary-dark"
            >
              {t.header.book}
            </Link>
          </li>
          <li>
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-secondary transition-colors hover:bg-light-bg hover:text-foreground"
              aria-label="Switch language"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {locale === "fr" ? "EN" : "FR"}
            </button>
          </li>
        </ul>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-secondary"
            aria-label="Switch language"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {locale === "fr" ? "EN" : "FR"}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col gap-1.5"
            aria-label="Menu"
          >
            <span className={`h-0.5 w-6 bg-foreground transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-6 bg-foreground transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-6 bg-foreground transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-border/60 bg-white/80 backdrop-blur-md px-6 py-4 md:hidden">
          <ul className="flex flex-col gap-4 text-sm font-medium text-secondary">
            <li>
              <Link href="/#chambres" onClick={() => setMenuOpen(false)} className="block hover:text-foreground">
                {t.header.rooms}
              </Link>
            </li>
            <li>
              <Link href="/#equipements" onClick={() => setMenuOpen(false)} className="block hover:text-foreground">
                {t.header.amenities}
              </Link>
            </li>
            <li>
              <Link href="/#localisation" onClick={() => setMenuOpen(false)} className="block hover:text-foreground">
                {t.header.location}
              </Link>
            </li>
            <li>
              <Link
                href="/#disponibilite"
                onClick={() => setMenuOpen(false)}
                className="inline-block rounded-full bg-primary px-5 py-2 text-white hover:bg-primary-dark"
              >
                {t.header.book}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
