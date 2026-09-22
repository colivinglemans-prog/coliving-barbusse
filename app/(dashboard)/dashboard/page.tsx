import { redirect } from "next/navigation";

/**
 * L'accueil du dashboard est le **calendrier**, pas les statistiques.
 *
 * C'est l'écran qu'on ouvre dix fois par jour — qui arrive, qui part, quelle chambre est
 * libre — là où les statistiques se consultent une fois par mois ou devant un banquier. La
 * page de chiffres a donc pris son propre chemin, `/dashboard/stats`, et `/dashboard` n'est
 * plus qu'une porte.
 *
 * Une redirection plutôt que le calendrier rendu ici : le rôle restreint n'a droit qu'à des
 * chemins listés, et cette liste se lit par préfixe (`couvre()` dans `lib/proxy.ts` du socle).
 * Ouvrir `/dashboard` au rôle restreint lui ouvrirait du même coup tout ce qui le prolonge —
 * factures, fiscal, taxe de séjour. Le calendrier garde son chemin à lui, et le proxy garde
 * sa liste courte.
 *
 * Le rôle restreint n'arrive jamais jusqu'ici : le proxy le renvoie déjà sur `restrictedHome`,
 * qui est cette même destination.
 */
export default function Dashboard() {
  redirect("/dashboard/calendar");
}
