import type { Metadata } from "next";
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
      ? "Booking — Coliving Barbusse Le Mans"
      : "Réservation — Coliving Barbusse Le Mans";
  const description =
    locale === "en"
      ? "Book the entire house (9 private suites) for your group in Le Mans. Airbnb, Booking.com or direct booking — best rate guaranteed."
      : "Réservez la maison entière (9 suites privatives) pour votre groupe au Mans. Airbnb, Booking.com ou réservation directe — meilleur tarif garanti.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/reservation`,
      languages: {
        fr: `${SITE_URL}/fr/reservation`,
        en: `${SITE_URL}/en/reservation`,
        "x-default": `${SITE_URL}/fr/reservation`,
      },
    },
  };
}

export default function Reservation() {
  return (
    <>
      <div className="mx-auto max-w-6xl px-6 pt-10 pb-2">
        <h1 className="text-2xl font-semibold text-foreground">Réservation</h1>
        <p className="mt-2 text-sm text-secondary">
          Sélectionnez vos dates et réservez la maison entière (9 suites) en exclusivité pour votre groupe.
        </p>
      </div>
      <ReservationCalendar />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="text-lg font-semibold text-foreground">Réserver sur nos plateformes partenaires</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a
            href="https://www.airbnb.fr/rooms/1568872179155283702"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border p-4 transition-shadow hover:shadow-md"
          >
            <span className="text-2xl">🏠</span>
            <div>
              <p className="font-medium text-foreground">Airbnb</p>
              <p className="text-xs text-secondary">Réserver via Airbnb</p>
            </div>
          </a>
          <a
            href="https://www.booking.com/hotel/fr/coliving-henri-barbusse-le-mans.fr.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border p-4 transition-shadow hover:shadow-md"
          >
            <span className="text-2xl">🅱️</span>
            <div>
              <p className="font-medium text-foreground">Booking.com</p>
              <p className="text-xs text-secondary">Réserver via Booking</p>
            </div>
          </a>
          <a
            href="https://beds24.com/booking2.php?propid=303771"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border p-4 transition-shadow hover:shadow-md"
          >
            <span className="text-2xl">📅</span>
            <div>
              <p className="font-medium text-foreground">Réservation directe</p>
              <p className="text-xs text-secondary">Meilleur tarif garanti</p>
            </div>
          </a>
        </div>
      </div>
    </>
  );
}
