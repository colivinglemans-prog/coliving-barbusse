"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-light-bg">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Coliving Barbusse</h3>
            <p className="text-sm text-secondary">
              42 Rue Henri Barbusse<br />
              72100 Le Mans, France
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t.footer.navigation}</h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li><Link href="/#chambres" className="hover:text-foreground">{t.header.rooms}</Link></li>
              <li><Link href="/#equipements" className="hover:text-foreground">{t.header.amenities}</Link></li>
              <li><Link href="/#localisation" className="hover:text-foreground">{t.header.location}</Link></li>
              <li><Link href="/#disponibilite" className="hover:text-foreground">{t.header.book}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t.footer.contact}</h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li>
                <a
                  href="https://wa.me/33620921005"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  {t.footer.whatsapp}
                </a>
              </li>
              <li>
                <a href="tel:+33620921005" className="hover:text-foreground">
                  +33 6 20 92 10 05
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              {t.footer.paymentTitle}
            </h3>
            <p className="text-sm text-secondary">{t.footer.paymentText}</p>
            <a
              href="https://wa.me/33620921005"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-rose-500 hover:text-rose-600"
            >
              {t.footer.whatsapp} →
            </a>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-center border-t border-border pt-6 text-xs text-secondary">
          <span>&copy; {new Date().getFullYear()} {t.footer.copyright}</span>
          <Link
            href="/dashboard"
            className="ml-3 rounded-md px-2 py-1 text-secondary/40 transition-colors hover:text-secondary"
            aria-label="Dashboard"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
          </Link>
        </div>
      </div>
    </footer>
  );
}
