import Link from "next/link";

export default function Footer() {
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
            <h3 className="mb-3 text-sm font-semibold text-foreground">Navigation</h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li><Link href="/#chambres" className="hover:text-foreground">Chambres</Link></li>
              <li><Link href="/#equipements" className="hover:text-foreground">Équipements</Link></li>
              <li><Link href="/#localisation" className="hover:text-foreground">Localisation</Link></li>
              <li><Link href="/#disponibilite" className="hover:text-foreground">Réserver</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Contact</h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li>
                <a
                  href="https://wa.me/33620921005"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  WhatsApp
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
          &copy; {new Date().getFullYear()} Coliving Barbusse. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
