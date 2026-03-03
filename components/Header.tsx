"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-primary">
          Coliving Barbusse - Maison premium 9 suites privatives Proche circuit
        </Link>

        {/* Desktop nav */}
        <ul className="hidden gap-6 text-sm font-medium text-secondary md:flex md:items-center">
          <li>
            <Link href="/#chambres" className="transition-colors hover:text-foreground">
              Chambres
            </Link>
          </li>
          <li>
            <Link href="/#equipements" className="transition-colors hover:text-foreground">
              Équipements
            </Link>
          </li>
          <li>
            <Link href="/#localisation" className="transition-colors hover:text-foreground">
              Localisation
            </Link>
          </li>
          <li>
            <Link
              href="/#disponibilite"
              className="rounded-full bg-primary px-5 py-2 text-white transition-colors hover:bg-primary-dark"
            >
              Réserver
            </Link>
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Menu"
        >
          <span className={`h-0.5 w-6 bg-foreground transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-6 bg-foreground transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-6 bg-foreground transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-border bg-white px-6 py-4 md:hidden">
          <ul className="flex flex-col gap-4 text-sm font-medium text-secondary">
            <li>
              <Link href="/#chambres" onClick={() => setMenuOpen(false)} className="block hover:text-foreground">
                Chambres
              </Link>
            </li>
            <li>
              <Link href="/#equipements" onClick={() => setMenuOpen(false)} className="block hover:text-foreground">
                Équipements
              </Link>
            </li>
            <li>
              <Link href="/#localisation" onClick={() => setMenuOpen(false)} className="block hover:text-foreground">
                Localisation
              </Link>
            </li>
            <li>
              <Link
                href="/#disponibilite"
                onClick={() => setMenuOpen(false)}
                className="inline-block rounded-full bg-primary px-5 py-2 text-white hover:bg-primary-dark"
              >
                Réserver
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
