import DashboardNav from "@/components/dashboard/DashboardNav";
import GuestMessagesDashboard from "@sejour/socle/components/GuestMessagesDashboard";

/**
 * Messages automatiques aux voyageurs : pour chaque séjour, ce qui est parti (par l'outil, par
 * une auto-action Beds24 encore active ou par les anciens boutons), ce qui partira et quand, ce
 * qui est bloqué et pourquoi. Le composant est celui du socle, **le même que chez Albiez** ; les
 * textes sont dans `lib/messages/templates.ts`.
 *
 * La confirmation de réservation n'y figure pas : elle reste envoyée par Beds24, décision du
 * 2026-11-08. Accent ardoise, comme les statistiques (le rose est la couleur du canal Airbnb).
 */
export default function MessagesPage() {
  return (
    <>
      <DashboardNav />
      <GuestMessagesDashboard
        title="Coliving Barbusse — messages voyageurs"
        subtitle="Arrivée et code, lendemain de l'arrivée, veille du départ, avis. La confirmation reste envoyée par Beds24."
        accent="#334155"
        endpoint="/api/dashboard/messages"
        previewEndpoint="/api/dashboard/messages/apercu"
        sendEndpoint="/api/dashboard/messages/envoyer"
      />
    </>
  );
}
