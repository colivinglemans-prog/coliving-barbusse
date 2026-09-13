import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { I18nProvider, isLocale, LOCALES } from "@/lib/i18n";
import { openGraphLocales } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE =
  "Coliving Barbusse - Maison premium 9 suites privatives Le Mans Proche circuit";
const DESCRIPTION =
  "Maison de 215 m² avec 9 chambres doubles et salles de bain privatives au Mans. Proche Circuit Bugatti et Gare TGV. Idéal groupes, événements et séjours d'entreprise. Jusqu'à 20 personnes.";

/**
 * `generateMetadata` et non un `metadata` constant, pour une seule raison : `og:locale`.
 *
 * Next fusionne les métadonnées **en surface** — une page qui déclare un bloc `openGraph`
 * remplace celui du layout, elle ne s'y ajoute pas. Les trois pages qui en déclarent un
 * portaient donc leur propre `og:locale`, et les trois autres héritaient du `fr_FR` figé
 * d'ici : `/de/chambres` s'annonçait français aux réseaux sociaux comme il le faisait dans
 * son `<html lang>`. Le bloc du layout est maintenant construit par langue, ce qui règle le
 * cas des pages qui n'en déclarent pas.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const og = openGraphLocales(isLocale(locale) ? locale : "fr");
  return {
    title: TITLE,
    description: DESCRIPTION,
    keywords: [
      "coliving Le Mans",
      "location maison Le Mans",
      "hébergement groupe Le Mans",
      "maison 9 chambres Le Mans",
      "location vacances Le Mans",
      "proche circuit Bugatti",
      "gîte groupe Sarthe",
      "séjour entreprise Le Mans",
      "Airbnb Le Mans grande maison",
      "24h du Mans logement",
      "24 Heures du Mans hébergement",
      "location 24h du Mans",
      "hébergement 24 Heures Moto Le Mans",
      "Grand Prix de France Moto Le Mans logement",
      "MotoGP Le Mans location",
      "Le Mans Classic hébergement",
      "24 Heures Camions Le Mans",
      "Marathon du Mans logement",
      "Festival de l'Épau hébergement",
      "Circuit des 24 Heures location",
      "Cité Plantagenêt séjour",
      "hébergement événement Le Mans",
      "location week-end course Le Mans",
    ],
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: SITE_URL,
      siteName: "Coliving Barbusse",
      ...og,
      type: "website",
      images: [
        {
          url: `${SITE_URL}/images/house/3-maison-AI.jpg`,
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
      images: [`${SITE_URL}/images/house/3-maison-AI.jpg`],
    },
    verification: {
      google: [
        "XC998B6YglY2roX9Ckq20C7ZMnf3u326km5hK6jh2Bo",
        "QJbvyp0MsKtO8FuBKZU3NCzjPUpcXbM6YNwg3hk7KSA",
      ],
    },
    /*
     * Pas de bloc `alternates` ici. Il en portait un, réduit à `fr`, `en` et `x-default`,
     * hérité de l'époque bilingue : chacune des pages déclare le sien, sur les cinq langues,
     * via `alternatesFor` (`lib/seo.ts`). Un jeu incomplet au niveau du layout ne servirait
     * qu'à ressortir le jour où une page oublierait le sien — c'est-à-dire au pire moment.
     */
  };
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Layout **racine** du site public : `app/` ne contient plus ni `layout.tsx` ni `page.tsx`,
 * la racine `/` étant négociée par le proxy. C'est ce qui permet d'écrire `lang` sur
 * `<html>` avec la vraie langue de la page, en gardant le rendu statique.
 *
 * Auparavant `app/layout.tsx` figeait `lang="fr"` pour tout le site et l'`I18nProvider` le
 * corrigeait au montage, côté client. Acceptable à deux langues ; à cinq, le HTML servi à
 * Google et aux lecteurs d'écran annonçait du français sur `/de`, `/es` et `/it` — et un
 * moteur ne voit pas le `useEffect` qui suit.
 *
 * Le dashboard a son propre layout racine, `app/(dashboard)/layout.tsx` : il reste hors de
 * `[locale]`, en français seulement, et le placer sous le segment de langue le dupliquerait
 * en cinq exemplaires.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider locale={locale}>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </I18nProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
