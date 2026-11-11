import DashboardNav from "@/components/dashboard/DashboardNav";
import SuiviDashboard from "@/components/dashboard/SuiviDashboard";

/**
 * Page « Suivi » (admin) : passages des intervenants (ménage, dépannage) reconstitués depuis le
 * garage (Intratone) et la porte (Nuki), fin de visite estimée par la caméra. Voir
 * `app/api/dashboard/suivi/route.ts` et `lib/cleaning/`.
 *
 * Admin seulement : la route porte sa garde `denyNonAdmin`, et le chemin **n'est pas** dans la
 * liste blanche viewer de `proxy.ts`.
 */
export default function SuiviPage() {
  return (
    <>
      <DashboardNav />
      <SuiviDashboard />
    </>
  );
}
