import DashboardNav from "@/components/dashboard/DashboardNav";
import StatsDashboard from "@sejour/socle/components/StatsDashboard";

/**
 * La page de statistiques est **la même que chez Albiez**, au titre, au sous-titre et à la
 * couleur d'accent près : c'est le composant du socle qui la dessine, les huit cartes et leurs
 * définitions imprimées comprises. Elle est destinée à être montrée à un banquier — rien
 * d'extrapolé n'y figure, et les deux biens se lisent avec les mêmes définitions.
 *
 * L'accent est le rose du site ; il ne vit que sur les courbes des graphes. Les cartes restent
 * blanches : le rose signifie Airbnb sur les graphes par canal, et Airbnb n'est qu'un canal
 * sur quatre.
 */
export default function Dashboard() {
  return (
    <>
      <DashboardNav />
      <StatsDashboard
        title="Coliving Barbusse — statistiques"
        subtitle="Rue Henri Barbusse, Le Mans · quatre canaux réunis"
        accent="#FF385C"
      />
    </>
  );
}
