import DashboardNav from "@/components/dashboard/DashboardNav";
import PricingDashboard from "@/components/dashboard/pricing/PricingDashboard";

/**
 * Évaluation de Beyond Pricing contre le moteur de prix maison, jusqu'à la décision du
 * 15/01/2027. **Page interne**, administrateur seulement — fermée au `viewer` par la liste
 * blanche du proxy (ne jamais l'ajouter à `allowedPaths`) et par `denyNonAdmin` sur ses routes.
 *
 * La page ne lit rien elle-même : tout passe par `/api/dashboard/pricing`.
 */
export default function PricingPage() {
  return (
    <>
      <DashboardNav />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Pricing</h1>
        <p className="mb-6 text-sm text-slate-500">Beyond Pricing contre le moteur maison, en simulation</p>
        <PricingDashboard />
      </div>
    </>
  );
}
