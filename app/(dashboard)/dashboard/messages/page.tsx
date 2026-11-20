import DashboardNav from "@/components/dashboard/DashboardNav";
import GuestMessagesDashboard from "@sejour/socle/components/GuestMessagesDashboard";
import { lastWebhookCall, type WebhookTrace } from "@/lib/webhook-trace";

export const dynamic = "force-dynamic";

/**
 * Témoin du dernier appel **accepté** (les refus n'écrivent plus rien, audit du 15/11). La voie
 * du secret dit si `?key=` peut être retiré de l'URL du webhook dans Beds24 : « par l'en-tête »
 * prouve que Beds24 envoie le « Custom Header ».
 */
const VIA: Record<NonNullable<WebhookTrace["via"]>, string> = {
  header: "secret reçu par l'en-tête",
  query: "secret reçu par l'URL (?key=), pas par l'en-tête",
};

function WebhookStatus({ trace }: { trace: WebhookTrace | null }) {
  const when = trace
    ? new Date(trace.at).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" })
    : null;
  return (
    <p className="mx-auto max-w-5xl px-4 pt-4 text-sm text-gray-600">
      Webhook Beds24 —{" "}
      {trace
        ? `dernier appel accepté le ${when}${trace.via ? ` (${VIA[trace.via]})` : ""}`
        : "aucun appel accepté noté depuis la mise en place du témoin (les refus ne sont pas notés)"}
    </p>
  );
}

/**
 * Messages automatiques aux voyageurs : pour chaque séjour, ce qui est parti (par l'outil, par
 * une auto-action Beds24 encore active ou par les anciens boutons), ce qui partira et quand, ce
 * qui est bloqué et pourquoi. Le composant est celui du socle, **le même que chez Albiez** ; les
 * textes sont dans `lib/messages/templates.ts`.
 *
 * La confirmation de réservation y figure en mode test (copie à l'hôte) : la vraie reste envoyée
 * par Beds24. En tête, le témoin du dernier appel du webhook Beds24 (`lib/webhook-trace.ts`). Accent ardoise, comme les statistiques (le rose est la couleur du canal Airbnb).
 */
export default async function MessagesPage() {
  const trace = await lastWebhookCall();
  return (
    <>
      <DashboardNav />
      <WebhookStatus trace={trace} />
      <GuestMessagesDashboard
        title="Coliving Barbusse — messages voyageurs"
        subtitle="Confirmation (en test), arrivée et code, lendemain de l'arrivée, veille du départ, avis."
        accent="#334155"
        endpoint="/api/dashboard/messages"
        previewEndpoint="/api/dashboard/messages/apercu"
        sendEndpoint="/api/dashboard/messages/envoyer"
      />
    </>
  );
}
