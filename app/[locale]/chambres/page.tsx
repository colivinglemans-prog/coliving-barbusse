import type { Metadata } from "next";
import SleepingArrangement from "@/components/public/SleepingArrangement";
import Amenities from "@/components/public/Amenities";
import ReservationCalendar from "@/components/public/ReservationCalendar";
import type { Locale } from "@/lib/i18n";

const SITE_URL = "https://www.coliving-barbusse.fr";

const T: Record<Locale, { title: string; sub: string; metaTitle: string; metaDesc: string }> = {
  fr: {
    title: "Nos 9 suites privatives",
    sub: "Chaque chambre dispose d'un lit double, d'une salle de bain privative, d'une smart TV, d'un bureau avec Ethernet, d'un dressing et d'une clé individuelle.",
    metaTitle: "Nos 9 suites privatives — Coliving Barbusse Le Mans",
    metaDesc: "9 suites privatives avec lit double, salle de bain privative, smart TV, bureau Ethernet et clé individuelle. Jusqu'à 20 personnes au Mans.",
  },
  en: {
    title: "Our 9 private suites",
    sub: "Each bedroom comes with a double bed, a private bathroom, a smart TV, a desk with Ethernet, a wardrobe and an individual key.",
    metaTitle: "Our 9 private suites — Coliving Barbusse Le Mans",
    metaDesc: "9 private suites with double bed, en-suite bathroom, smart TV, desk with Ethernet and individual key. Up to 20 guests in Le Mans.",
  },
  it: {
    title: "Le nostre 9 suite private",
    sub: "Ogni camera dispone di letto matrimoniale, bagno privato, smart TV, scrivania con Ethernet, guardaroba e chiave individuale.",
    metaTitle: "Le nostre 9 suite private — Coliving Barbusse Le Mans",
    metaDesc: "9 suite private con letto matrimoniale, bagno privato, smart TV, scrivania Ethernet e chiave individuale. Fino a 20 ospiti a Le Mans.",
  },
  de: {
    title: "Unsere 9 privaten Suiten",
    sub: "Jedes Zimmer verfügt über ein Doppelbett, ein eigenes Bad, einen Smart-TV, einen Schreibtisch mit Ethernet, einen Kleiderschrank und einen eigenen Schlüssel.",
    metaTitle: "Unsere 9 privaten Suiten — Coliving Barbusse Le Mans",
    metaDesc: "9 private Suiten mit Doppelbett, eigenem Bad, Smart-TV, Ethernet-Schreibtisch und individuellem Schlüssel. Bis zu 20 Gäste in Le Mans.",
  },
  es: {
    title: "Nuestras 9 suites privadas",
    sub: "Cada habitación dispone de cama doble, baño privado, smart TV, escritorio con Ethernet, vestidor y llave individual.",
    metaTitle: "Nuestras 9 suites privadas — Coliving Barbusse Le Mans",
    metaDesc: "9 suites privadas con cama doble, baño privado, smart TV, escritorio con Ethernet y llave individual. Hasta 20 personas en Le Mans.",
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
    alternates: {
      canonical: `${SITE_URL}/${locale}/chambres`,
      languages: {
        fr: `${SITE_URL}/fr/chambres`,
        en: `${SITE_URL}/en/chambres`,
        it: `${SITE_URL}/it/chambres`,
        de: `${SITE_URL}/de/chambres`,
        "x-default": `${SITE_URL}/fr/chambres`,
      },
    },
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
      <SleepingArrangement />
      <Amenities />
      <ReservationCalendar />
    </>
  );
}
