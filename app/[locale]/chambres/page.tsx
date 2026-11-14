import type { Metadata } from "next";
import SleepingArrangement from "@/components/public/SleepingArrangement";
import Amenities from "@/components/public/Amenities";
import ReservationCalendar from "@/components/public/ReservationCalendar";
import { alternatesFor, pageOpenGraph, pageTwitter, roomsPath } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

const T: Record<Locale, { title: string; sub: string; metaTitle: string; metaDesc: string }> = {
  fr: {
    title: "Nos 9 suites privatives",
    sub: "Chaque chambre dispose d'un lit double fait à l'arrivée (couette et 2 oreillers), d'une table de nuit, d'une salle de douche privative avec sèche-serviettes, d'une smart TV, d'un bureau, d'une penderie ou d'un dressing et d'une clé individuelle.",
    metaTitle: "Nos 9 suites privatives — Coliving Barbusse Le Mans",
    metaDesc: "9 suites privatives avec lit double, salle de douche privative, smart TV, bureau et clé individuelle. Jusqu'à 20 personnes au Mans.",
  },
  en: {
    title: "Our 9 private suites",
    sub: "Each bedroom comes with a double bed made up on arrival (duvet and 2 pillows), a bedside table, a private shower room with a heated towel rail, a smart TV, a desk, a wardrobe and an individual key.",
    metaTitle: "Our 9 private suites — Coliving Barbusse Le Mans",
    metaDesc: "9 private suites with double bed, en-suite shower room, smart TV, desk and individual key. Up to 20 guests in Le Mans, France.",
  },
  it: {
    title: "Le nostre 9 suite private",
    sub: "Ogni camera dispone di letto matrimoniale già pronto all'arrivo (piumone e 2 cuscini), comodino, bagno privato con doccia e scaldasalviette, smart TV, scrivania, guardaroba e chiave individuale.",
    metaTitle: "Le nostre 9 suite private — Coliving Barbusse Le Mans",
    metaDesc: "9 suite private con letto matrimoniale, bagno privato con doccia, smart TV, scrivania e chiave individuale. Fino a 20 ospiti a Le Mans.",
  },
  de: {
    title: "Unsere 9 privaten Suiten",
    sub: "Jedes Zimmer verfügt über ein bei Anreise frisch bezogenes Doppelbett (Bettdecke und 2 Kopfkissen), einen Nachttisch, ein eigenes Duschbad mit Handtuchheizkörper, einen Smart-TV, einen Schreibtisch, einen Kleiderschrank und einen eigenen Schlüssel.",
    metaTitle: "Unsere 9 privaten Suiten — Coliving Barbusse Le Mans",
    metaDesc: "9 private Suiten mit Doppelbett, eigenem Duschbad, Smart-TV, Schreibtisch und individuellem Schlüssel. Bis zu 20 Gäste in Le Mans.",
  },
  es: {
    title: "Nuestras 9 suites privadas",
    sub: "Cada habitación dispone de cama doble hecha a la llegada (edredón y 2 almohadas), mesita de noche, baño privado con ducha y toallero eléctrico, smart TV, escritorio, armario o vestidor y llave individual.",
    metaTitle: "Nuestras 9 suites privadas — Coliving Barbusse Le Mans",
    metaDesc: "9 suites privadas con cama doble, baño privado con ducha, smart TV, escritorio y llave individual. Hasta 20 personas en Le Mans.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale as Locale) in T ? (rawLocale as Locale) : "fr";
  const t = T[locale];

  return {
    title: t.metaTitle,
    description: t.metaDesc,
    // La liste écrite à la main qui était ici déclarait quatre langues sur les cinq
    // servies : `/es/chambres` existait, se rendait, et n'était annoncée nulle part.
    alternates: alternatesFor(locale, roomsPath),
    // Bloc complet (`pageOpenGraph`) : sans lui la page héritait du titre et de l'URL de
    // l'accueil ; avec un bloc partiel, elle perdait image et `siteName` (fusion en surface).
    openGraph: pageOpenGraph(locale, { title: t.metaTitle, description: t.metaDesc, url: `${SITE_URL}${roomsPath(locale)}` }),
    twitter: pageTwitter({ title: t.metaTitle, description: t.metaDesc }),
  };
}

export default async function Chambres({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale as Locale) in T ? (rawLocale as Locale) : "fr";
  const t = T[locale];

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 pt-10 pb-2">
        <h1 className="text-2xl font-semibold text-foreground">{t.title}</h1>
        <p className="mt-2 text-sm text-secondary">{t.sub}</p>
      </div>
      <SleepingArrangement firstPhotoPriority />
      <Amenities />
      <ReservationCalendar />
    </>
  );
}
