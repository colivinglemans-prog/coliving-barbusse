import type { Metadata } from "next";
import {
  alternatesFor,
  HOME_DESCRIPTIONS,
  HOME_TITLES,
  homePath,
  pageOpenGraph,
  pageTwitter,
} from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { PROPERTY_INFO } from "@/lib/property-info";
import { aggregateRatingJsonLd } from "@/lib/reviews";
import { isLocale } from "@/lib/i18n";
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


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Un segment qui n'est pas une langue servie n'a pas de métadonnées : le layout rend un
  // 404 juste après. Sans ce garde-fou, `openGraphLocales` lit `LOCALE_META["zz"]` et
  // `/zz` répond 500 au lieu de 404 — `generateMetadata` s'exécute avant le `notFound`.
  if (!isLocale(locale)) return {};
  const title = HOME_TITLES[locale];
  const description = HOME_DESCRIPTIONS[locale];

  return {
    title,
    description,
    openGraph: pageOpenGraph(locale, { title, description, url: `${SITE_URL}${homePath(locale)}` }),
    twitter: pageTwitter({ title, description }),
    alternates: alternatesFor(locale, homePath),
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
    es: "Casa de 215 m² con 9 habitaciones dobles y baños privados en Le Mans. Cerca del Circuito Bugatti y la estación TGV.",
  };
  const AMENITY: Record<string, { parking: string; gym: string; zen: string }> = {
    fr: { parking: "Stationnement gratuit dans la rue", gym: "Salle de sport", zen: "Espace zen" },
    en: { parking: "Free street parking", gym: "Gym", zen: "Zen space" },
    it: { parking: "Parcheggio gratuito in strada", gym: "Palestra", zen: "Spazio zen" },
    de: { parking: "Kostenloses Parken auf der Straße", gym: "Fitnessraum", zen: "Zen-Bereich" },
    es: { parking: "Aparcamiento gratuito en la calle", gym: "Gimnasio", zen: "Espacio zen" },
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
      streetAddress: PROPERTY_INFO.address.street,
      addressLocality: PROPERTY_INFO.address.city,
      postalCode: PROPERTY_INFO.address.postalCode,
      addressCountry: "FR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: PROPERTY_INFO.geo.latitude,
      longitude: PROPERTY_INFO.geo.longitude,
    },
    numberOfRooms: PROPERTY_INFO.bedrooms,
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Wi-Fi", value: true },
      { "@type": "LocationFeatureSpecification", name: amenity.parking, value: true },
      { "@type": "LocationFeatureSpecification", name: amenity.gym, value: true },
      { "@type": "LocationFeatureSpecification", name: amenity.zen, value: true },
    ],
    aggregateRating: aggregateRatingJsonLd(),
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
