import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Chaque année en juin, Le Mans accueille plus de 300 000 spectateurs pour les 24 Heures du
        Mans. Trouver un hébergement pour l'édition 2026 demande de s'y prendre tôt — les hôtels
        affichent complet des mois à l'avance et les grandes maisons partent dès l'ouverture des
        ventes. Voici un guide pratique pour choisir où dormir.
      </p>

      <h2>Quand ont lieu les 24 Heures du Mans 2026 ?</h2>
      <p>
        La 94ᵉ édition des 24 Heures du Mans se déroule le week-end du <strong>13 et 14 juin 2026</strong>.
        Les essais libres et qualifications commencent dès le mercredi, et la grande parade des
        pilotes anime la ville le vendredi soir. La plupart des visiteurs arrivent à partir du
        jeudi et repartent le dimanche soir ou lundi matin — il faut donc prévoir un séjour de
        3 à 5 nuits.
      </p>

      <h2>Les différentes zones d'hébergement</h2>
      <h3>Proche du circuit (Arnage, Mulsanne, Ruaudin)</h3>
      <p>
        Ces villages sont directement collés au tracé. L'offre est très limitée, les prix
        s'envolent et la circulation est bloquée en permanence. Intéressant uniquement si vous
        voulez être à pied du circuit — sinon les embouteillages feront perdre beaucoup de
        temps.
      </p>

      <h3>Le Mans ville (15-20 min du circuit hors événement)</h3>
      <p>
        Le meilleur compromis. Vous profitez du centre-ville historique (Cité Plantagenêt,
        cathédrale, restaurants) et rejoignez le circuit en voiture en 15 à 20 minutes hors
        embouteillages. C'est la zone idéale pour les groupes et les familles qui veulent
        alterner course et tourisme.
      </p>

      <h3>Villages alentours (20-40 min)</h3>
      <p>
        Moins chers mais plus contraignants : prévoyez les bouchons du samedi matin et du
        dimanche soir. À réserver si tout est complet en ville ou si vous êtes nombreux et
        cherchez le tarif le plus bas.
      </p>

      <h2>Quel type d'hébergement choisir ?</h2>
      <h3>Hôtel classique</h3>
      <p>
        Pratique pour 1 à 2 personnes mais vite saturé. Les tarifs doublent ou triplent
        pendant l'événement. Réservation indispensable dès janvier.
      </p>

      <h3>Airbnb / location de maison</h3>
      <p>
        Le meilleur choix pour un groupe ou une famille. Vous disposez d'une cuisine (éviter
        les restaurants complets), d'un stationnement facile, et d'un vrai espace pour
        vous détendre entre deux sessions sur le circuit.
      </p>

      <h3>Camping au circuit</h3>
      <p>
        Ambiance incroyable mais nuits courtes. Réservé aux passionnés qui veulent vivre
        l'événement 24h/24.
      </p>

      <h2>Combien coûte un hébergement pendant les 24h ?</h2>
      <ul>
        <li>Chambre d'hôtel basique : 150-300 €/nuit (contre 60-90 € hors événement)</li>
        <li>Airbnb pour 4 personnes : 200-500 €/nuit</li>
        <li>Grande maison pour groupe (10-18 pers.) : 1 500-3 500 €/nuit</li>
      </ul>
      <p>
        Astuce : plus vous êtes nombreux, plus le coût par personne baisse. Une grande maison
        partagée à 15 revient souvent moins cher qu'un hôtel individuel.
      </p>

      <h2>Notre maison — 9 suites privatives à 15-20 minutes du circuit</h2>
      <p>
        Pour les groupes, familles élargies ou entreprises, notre maison de 215 m² offre{" "}
        <strong>9 chambres doubles avec salle de bain privative</strong>. Vous dormez à 18
        dans le calme, chacun dans son espace, sans compromis sur le confort.
      </p>
      <ul>
        <li>15-20 min du Circuit Bugatti hors événement (45-60 min les jours de course à cause des bouchons)</li>
        <li>10 min à pied de la gare TGV Le Mans + tram T1 direct vers le circuit (~30 min porte-à-porte, sans stress parking)</li>
        <li>Stationnement gratuit dans la rue, juste devant la maison</li>
        <li>Cuisine entièrement équipée</li>
        <li>Salle de sport et espace zen sur place</li>
        <li>Serrure connectée : arrivée autonome à partir de 17h</li>
      </ul>

      <h2>Conseils pour bien réserver</h2>
      <ol>
        <li>
          <strong>Réservez avant février</strong> : les meilleures options partent dès janvier.
        </li>
        <li>
          <strong>Prévoyez 3-4 nuits minimum</strong> : la plupart des propriétaires n'acceptent
          pas les séjours d'une seule nuit pendant l'événement.
        </li>
        <li>
          <strong>Vérifiez les conditions de stationnement</strong> : une maison située
          dans une rue résidentielle calme, loin du circuit, reste la meilleure option.
        </li>
        <li>
          <strong>Comparez le coût par personne</strong> : une grande maison bat souvent
          l'hôtel à partir de 6 voyageurs.
        </li>
        <li>
          <strong>Anticipez les embouteillages</strong> : partez 2h avant le début de la course
          le samedi, ou mieux : prenez le <strong>tramway T1</strong> depuis la gare du
          Mans (~20 min jusqu'à l'entrée Est du circuit, trams toutes les 4-5 min le jour
          de course). C'est la solution la plus fiable.
        </li>
      </ol>

      <h2>Prêt à réserver ?</h2>
      <p>
        Consultez les <Link href="/#disponibilite">dates disponibles</Link> pour les 24 Heures
        du Mans 2026 et sécurisez votre séjour. Vous pouvez aussi découvrir{" "}
        <Link href="/chambres">les 9 chambres</Link> ou voir{" "}
        <Link href="/#avis">les avis de nos précédents voyageurs</Link>.
      </p>
    </>
  );
}
