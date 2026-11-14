import DashboardNav from "@/components/dashboard/DashboardNav";
import SearchConsoleDashboard from "@sejour/socle/components/SearchConsoleDashboard";

/**
 * Ce que Google Search Console sait des recherches qui mènent au site : requêtes, clics,
 * impressions, position. Le composant est celui du socle, **le même que chez Albiez** ; ne
 * restent ici que les données propres au bien.
 *
 * Accent ardoise `#334155`, comme les statistiques : sur ce dashboard le rose `#FF385C` désigne
 * le canal Airbnb, et une courbe de clics Google ne doit pas le porter (le chef de stand).
 *
 * Les visites elles-mêmes (toutes sources confondues) restent dans Vercel Analytics, qui n'a pas
 * d'API de lecture : un lien, pas une recopie.
 */
export default function SeoPage() {
  return (
    <>
      <DashboardNav />
      <SearchConsoleDashboard
        title="Coliving Barbusse — référencement"
        subtitle="Recherches Google qui mènent au site"
        accent="#334155"
        links={[
          { href: "https://search.google.com/search-console", label: "Search Console" },
          {
            href: "https://www.bing.com/webmasters/home?siteUrl=https://www.coliving-barbusse.fr/",
            label: "Bing Webmaster (pages indexées, ChatGPT)",
          },
          {
            href: "https://vercel.com/colivinglemans-progs-projects/coliving-barbusse/analytics",
            label: "Visites (Vercel Analytics)",
          },
        ]}
      />
    </>
  );
}
