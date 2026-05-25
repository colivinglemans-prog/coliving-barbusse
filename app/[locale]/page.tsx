import type { Metadata } from "next";
import PhotoGallery from "@/components/public/PhotoGallery";
import PropertyHeader from "@/components/public/PropertyHeader";
import Highlights from "@/components/public/Highlights";
import Description from "@/components/public/Description";
import SleepingArrangement from "@/components/public/SleepingArrangement";
import CommonSpaces from "@/components/public/CommonSpaces";
import Garden from "@/components/public/Garden";
import Amenities from "@/components/public/Amenities";
import ReservationCalendar from "@/components/public/ReservationCalendar";
import LocationSection from "@/components/public/LocationSection";
import HostSection from "@/components/public/HostSection";
import AirbnbReviews from "@/components/public/AirbnbReviews";
import BlogSection from "@/components/public/BlogSection";
import HouseRules from "@/components/public/HouseRules";

const SITE_URL = "https://www.coliving-barbusse.fr";

const DESCRIPTIONS: Record<string, string> = {
  fr: "Maison de 215 m² avec 9 chambres doubles et salles de bain privatives au Mans. Proche Circuit Bugatti et Gare TGV. Idéal groupes, événements et séjours d'entreprise. Jusqu'à 18 personnes.",
  en: "215 m² house with 9 twin bedrooms and en-suite bathrooms in Le Mans. Near Bugatti Circuit and TGV station. Ideal for groups, events and corporate stays. Up to 18 guests.",
  it: "Casa di 215 m² con 9 camere matrimoniali e bagni privati a Le Mans. Vicino al Circuito Bugatti e alla stazione TGV. Ideale per gruppi, eventi e soggiorni aziendali. Fino a 18 ospiti.",
  de: "215 m² großes Haus mit 9 Doppelzimmern und eigenen Bädern in Le Mans. In der Nähe der Bugatti-Rennstrecke und des TGV-Bahnhofs. Ideal für Gruppen, Events und Firmenaufenthalte. Bis zu 18 Gäste.",
};

const OG_LOCALES: Record<string, string> = {
  fr: "fr_FR",
  en: "en_US",
  it: "it_IT",
  de: "de_DE",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const description = DESCRIPTIONS[locale] ?? DESCRIPTIONS.fr;

  return {
    description,
    openGraph: {
      url: `${SITE_URL}/${locale}`,
      locale: OG_LOCALES[locale] ?? "fr_FR",
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        fr: `${SITE_URL}/fr`,
        en: `${SITE_URL}/en`,
        it: `${SITE_URL}/it`,
        de: `${SITE_URL}/de`,
        "x-default": `${SITE_URL}/fr`,
      },
    },
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const JSONLD_DESC: Record<string, string> = {
    fr: "Maison de 215 m² avec 9 chambres doubles et salles de bain privatives au Mans. Proche Circuit Bugatti et Gare TGV.",
    en: "215 m² house with 9 twin bedrooms and en-suite bathrooms in Le Mans. Near Bugatti Circuit and TGV station.",
    it: "Casa di 215 m² con 9 camere matrimoniali e bagni privati a Le Mans. Vicino al Circuito Bugatti e alla stazione TGV.",
    de: "215 m² großes Haus mit 9 Doppelzimmern und eigenen Bädern in Le Mans. In der Nähe der Bugatti-Rennstrecke und des TGV-Bahnhofs.",
  };
  const AMENITY: Record<string, { parking: string; gym: string; zen: string }> = {
    fr: { parking: "Stationnement gratuit dans la rue", gym: "Salle de sport", zen: "Espace zen" },
    en: { parking: "Free street parking", gym: "Gym", zen: "Zen space" },
    it: { parking: "Parcheggio gratuito in strada", gym: "Palestra", zen: "Spazio zen" },
    de: { parking: "Kostenloses Parken auf der Straße", gym: "Fitnessraum", zen: "Zen-Bereich" },
  };
  const amenity = AMENITY[locale] ?? AMENITY.fr;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "Coliving Barbusse",
    description: JSONLD_DESC[locale] ?? JSONLD_DESC.fr,
    url: `${SITE_URL}/${locale}`,
    image: `${SITE_URL}/images/house/3-maison-AI.jpg`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rue Henri Barbusse",
      addressLocality: "Le Mans",
      postalCode: "72000",
      addressCountry: "FR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 47.9842,
      longitude: 0.1976,
    },
    numberOfRooms: 9,
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Wi-Fi", value: true },
      { "@type": "LocationFeatureSpecification", name: amenity.parking, value: true },
      { "@type": "LocationFeatureSpecification", name: amenity.gym, value: true },
      { "@type": "LocationFeatureSpecification", name: amenity.zen, value: true },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "19",
      bestRating: "5",
    },
    inLanguage: locale,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PhotoGallery />
      <PropertyHeader />
      <Highlights />
      <Description />
      <SleepingArrangement />
      <CommonSpaces />
      <Garden />
      <Amenities />
      <ReservationCalendar />
      <LocationSection />
      <HostSection />
      <AirbnbReviews />
      <BlogSection />
      <HouseRules />
    </>
  );
}
