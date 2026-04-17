import PhotoGallery from "@/components/public/PhotoGallery";
import PropertyHeader from "@/components/public/PropertyHeader";
import Highlights from "@/components/public/Highlights";
import Description from "@/components/public/Description";
import SleepingArrangement from "@/components/public/SleepingArrangement";
import CommonSpaces from "@/components/public/CommonSpaces";
import Amenities from "@/components/public/Amenities";
import ReservationCalendar from "@/components/public/ReservationCalendar";
import LocationSection from "@/components/public/LocationSection";
import HostSection from "@/components/public/HostSection";
import AirbnbReviews from "@/components/public/AirbnbReviews";
import BlogSection from "@/components/public/BlogSection";
import HouseRules from "@/components/public/HouseRules";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  name: "Coliving Barbusse",
  description:
    "Maison de 240 m² avec 9 chambres doubles et salles de bain privatives au Mans. Proche Circuit Bugatti et Gare TGV.",
  url: "https://coliving-barbusse.vercel.app",
  image: "https://coliving-barbusse.vercel.app/images/house/3-maison-AI.png",
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
    { "@type": "LocationFeatureSpecification", name: "Stationnement gratuit dans la rue", value: true },
    { "@type": "LocationFeatureSpecification", name: "Salle de sport", value: true },
    { "@type": "LocationFeatureSpecification", name: "Espace zen", value: true },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "16",
    bestRating: "5",
  },
};

export default function Home() {
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
