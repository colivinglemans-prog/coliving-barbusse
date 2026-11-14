import DashboardNav from "@/components/dashboard/DashboardNav";
import AlertsDashboard from "@/components/dashboard/AlertsDashboard";

/**
 * Page « Alertes » (admin) : l'historique des notifications ntfy sur 30 jours, pour mesurer le
 * volume et repérer ce qui revient. Voir `lib/notify-log.ts`.
 *
 * Admin seulement : la route porte sa garde `denyNonAdmin`, et le chemin **n'est pas** dans la
 * liste blanche viewer de `proxy.ts`.
 */
export default function AlertesPage() {
  return (
    <>
      <DashboardNav />
      <AlertsDashboard />
    </>
  );
}
