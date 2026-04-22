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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const description =
    locale === "en"
      ? "215 m² house with 9 twin bedrooms and en-suite bathrooms in Le Mans. Near Bugatti Circuit and TGV station. Ideal for groups, events and corporate stays. Up to 18 guests."
      : "Maison de 215 m² avec 9 chambres doubles et salles de bain privatives au Mans. Proche Circuit Bugatti et Gare TGV. Idéal groupes, événements et séjours d'entreprise. Jusqu'à 18 personnes.";

  return {
    description,
    openGraph: {
      url: `${SITE_URL}/${locale}`,
      locale: locale === "en" ? "en_US" : "fr_FR",
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        fr: `${SITE_URL}/fr`,
        en: `${SITE_URL}/en`,
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "Coliving Barbusse",
    description:
      locale === "en"
        ? "215 m² house with 9 twin bedrooms and en-suite bathrooms in Le Mans. Near Bugatti Circuit and TGV station."
        : "Maison de 215 m² avec 9 chambres doubles et salles de bain privatives au Mans. Proche Circuit Bugatti et Gare TGV.",
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
      {
        "@type": "LocationFeatureSpecification",
        name: locale === "en" ? "Free street parking" : "Stationnement gratuit dans la rue",
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: locale === "en" ? "Gym" : "Salle de sport",
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: locale === "en" ? "Zen space" : "Espace zen",
        value: true,
      },
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
