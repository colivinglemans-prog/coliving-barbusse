import SleepingArrangement from "@/components/public/SleepingArrangement";
import Amenities from "@/components/public/Amenities";
import ReservationCalendar from "@/components/public/ReservationCalendar";

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
