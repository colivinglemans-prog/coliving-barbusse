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
import HouseRules from "@/components/public/HouseRules";

export default function Home() {
  return (
    <>
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
      <HouseRules />
    </>
  );
}
