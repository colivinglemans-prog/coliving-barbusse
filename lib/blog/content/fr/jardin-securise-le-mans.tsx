import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Avec le retour de la belle saison, notre jardin est prêt à vous recevoir. Un espace
        extérieur privatif de 90 m², entièrement clos et sécurisé, en plein cœur du Mans :
        l'endroit idéal pour profiter des longues soirées d'été en famille, entre amis ou en
        groupe.
      </p>

      <h2>Un jardin clos et entièrement sécurisé</h2>
      <p>
        Le jardin est <strong>clos de toute part</strong> : un vrai cocon à l'abri des regards
        et de la circulation. C'est l'atout rassurant pour les familles avec enfants en bas âge,
        qui peuvent jouer dehors en toute tranquillité, mais aussi pour les groupes qui veulent
        un espace privé rien que pour eux. Exposé <strong>plein sud</strong>, il profite du
        soleil toute la journée.
      </p>

      <h2>Un extérieur pensé pour se retrouver</h2>
      <p>
        Le jardin a été aménagé pour accueillir confortablement un grand groupe — comme l'intérieur
        de la maison, qui loge jusqu'à 20 personnes dans ses 9 suites :
      </p>
      <ul>
        <li>
          <strong>Un salon de jardin 8 places</strong> : canapés et fauteuils pour les apéros au
          soleil et les moments de détente.
        </li>
        <li>
          <strong>De grandes tables pour manger dehors jusqu'à 20 personnes</strong> : parfait
          pour les repas d'équipe, les dîners de famille ou les barbecues entre amis.
        </li>
        <li>
          <strong>90 m² au total</strong> : 25 m² de plantations et un large espace gravillonné
          facile à vivre.
        </li>
      </ul>

      <h2>Idéal pour tous les séjours</h2>
      <ul>
        <li>
          <strong>Familles</strong> : un espace fermé et sécurisé où les enfants jouent
          librement pendant que les parents se détendent.
        </li>
        <li>
          <strong>Groupes d'amis</strong> : apéros au soleil, longues tablées et soirées
          conviviales sans déranger le voisinage.
        </li>
        <li>
          <strong>Clubs et événements du circuit</strong> (24 Heures, Le Mans Classic, MotoGP) :
          de quoi se retrouver entre passionnés après une journée de course.
        </li>
        <li>
          <strong>Séminaires et séjours d'entreprise</strong> : un cadre extérieur agréable
          pour les pauses et les repas d'équipe.
        </li>
      </ul>

      <h2>À deux pas du centre et du circuit</h2>
      <p>
        La maison est idéalement située : à 10 minutes à pied de la gare du Mans (tram T1 direct
        vers le circuit), à 20 minutes du Circuit Bugatti et tout proche de la Cité Plantagenêt.
        Après une journée de visite ou de course, rien de tel que de rentrer profiter du jardin.
      </p>

      <h2>Réservez votre séjour</h2>
      <p>
        Profitez du jardin et de toute la maison pour votre prochain séjour au Mans. Consultez
        nos <Link href="/fr#disponibilite">disponibilités en temps réel</Link> et réservez en
        direct, sans commission.
      </p>
    </>
  );
}
