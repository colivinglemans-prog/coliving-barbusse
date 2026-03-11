import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { I18nProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://coliving-barbusse.vercel.app";
const TITLE =
  "Coliving Barbusse - Maison premium 9 suites privatives Le Mans Proche circuit";
const DESCRIPTION =
  "Maison de 240 m² avec 9 chambres doubles et salles de bain privatives au Mans. Proche Circuit Bugatti et Gare TGV. Idéal groupes, événements et séjours d'entreprise. Jusqu'à 18 personnes.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "coliving Le Mans",
    "location maison Le Mans",
    "hébergement groupe Le Mans",
    "24h du Mans logement",
    "maison 9 chambres Le Mans",
    "location vacances Le Mans",
    "proche circuit Bugatti",
    "gîte groupe Sarthe",
    "séjour entreprise Le Mans",
    "Airbnb Le Mans grande maison",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Coliving Barbusse",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/images/house/3-maison-AI.png`,
        width: 1200,
        height: 630,
        alt: "Coliving Barbusse - Maison premium au Mans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/images/house/3-maison-AI.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value as Locale) || "fr";

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider initialLocale={locale}>
          {children}
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
