import DashboardNav from "@/components/dashboard/DashboardNav";
import StatsDashboard from "@sejour/socle/components/StatsDashboard";

/**
 * La page de statistiques est **la même que chez Albiez**, au titre, au sous-titre et à la
 * couleur d'accent près : c'est le composant du socle qui la dessine, les huit cartes et leurs
 * définitions imprimées comprises. Elle est destinée à être montrée à un banquier — rien
 * d'extrapolé n'y figure, et les deux biens se lisent avec les mêmes définitions.
 *
 * L'accent n'est **pas** le rose du site : `#FF385C` est la couleur du canal Airbnb sur les
 * graphes par canal, et une page de chiffres n'a pas le droit de faire dire deux choses à une
 * couleur (le chef de stand, 2026-09-13). Un ardoise neutre, qui ne vaut aucun canal, aucun seuil,
 * aucun avertissement. Les cartes restent blanches des deux côtés.
 */
export default function Dashboard() {
  return (
    <>
      <DashboardNav />
      <StatsDashboard
        title="Coliving Barbusse — statistiques"
        subtitle="Rue Henri Barbusse, Le Mans · quatre canaux réunis"
        accent="#334155"
      />
    </>
  );
}
