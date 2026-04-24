import type { Metadata } from "next";
import SleepingArrangement from "@/components/public/SleepingArrangement";
import Amenities from "@/components/public/Amenities";
import ReservationCalendar from "@/components/public/ReservationCalendar";

const SITE_URL = "https://www.coliving-barbusse.fr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title =
    locale === "en"
      ? "Our 9 private suites — Coliving Barbusse Le Mans"
      : "Nos 9 suites privatives — Coliving Barbusse Le Mans";
  const description =
    locale === "en"
      ? "9 private suites with double bed, en-suite bathroom, smart TV, desk with Ethernet and individual key. Up to 18 guests in Le Mans."
      : "9 suites privatives avec lit double, salle de bain privative, smart TV, bureau Ethernet et clé individuelle. Jusqu'à 18 personnes au Mans.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/chambres`,
      languages: {
        fr: `${SITE_URL}/fr/chambres`,
        en: `${SITE_URL}/en/chambres`,
        "x-default": `${SITE_URL}/fr/chambres`,
      },
    },
  };
}

export default function Chambres() {
  return (
    <>
      <div className="mx-auto max-w-6xl px-6 pt-10 pb-2">
        <h1 className="text-2xl font-semibold text-foreground">Nos 9 suites privatives</h1>
        <p className="mt-2 text-sm text-secondary">
          Chaque chambre dispose d&apos;un lit double, d&apos;une salle de bain privative, d&apos;une smart TV,
          d&apos;un bureau avec Ethernet, d&apos;un dressing et d&apos;une clé individuelle.
        </p>
      </div>
      <SleepingArrangement />
      <Amenities />
      <ReservationCalendar />
    </>
  );
}
