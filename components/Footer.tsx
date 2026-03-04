"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-light-bg">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
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
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-secondary">
          &copy; {new Date().getFullYear()} {t.footer.copyright}
        </div>
      </div>
    </footer>
  );
}
