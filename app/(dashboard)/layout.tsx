import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard — Coliving Barbusse",
  // Usage interne. Le `Disallow` de `robots.txt` empêche l'exploration, pas l'indexation
  // d'une URL nue trouvée ailleurs : c'est ce `noindex` qui ferme la porte.
  robots: { index: false, follow: false },
};

/**
 * **Second layout racine** du projet, à côté de `app/[locale]/layout.tsx`.
 *
 * Next n'accepte plusieurs layouts racines qu'à condition qu'`app/layout.tsx` n'existe pas :
 * chaque branche de premier niveau porte alors le sien, avec son `<html>` et son `<body>`.
 * C'est la contrepartie du `<html lang={locale}>` du site — sans ce fichier, le dashboard
 * n'aurait plus de document.
 *
 * Il ne contient **aucune logique de dashboard** : la coquille de page vit toujours dans
 * `app/(dashboard)/dashboard/layout.tsx`, inchangé. Les parenthèses n'apparaissent pas dans
 * les URLs, `/dashboard` reste `/dashboard`.
 */
export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
