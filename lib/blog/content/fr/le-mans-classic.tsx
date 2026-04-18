import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Le Mans Classic est le plus grand rassemblement mondial de voitures anciennes de
        course. Tous les deux ans, plus de 235 000 passionnés se rassemblent au Circuit des
        24 Heures pour voir rouler 700 autos mythiques, du Bentley Blower à la Porsche 962.
        Voici comment préparer votre week-end.
      </p>

      <h2>Qu'est-ce que Le Mans Classic ?</h2>
      <p>
        Créé en 2002, Le Mans Classic est une recréation fidèle des 24 Heures du Mans avec des
        voitures ayant couru l'épreuve entre 1923 et 1993. Six plateaux de 70 à 80 voitures
        s'élancent sur le circuit pendant 24 heures, dans une ambiance rétro exceptionnelle.
        L'événement est aussi une gigantesque fête autour de l'automobile de collection : clubs,
        enchères Artcurial, concours d'élégance, village marchand, concert…
      </p>

      <h2>Quand a lieu la prochaine édition ?</h2>
      <p>
        Le Mans Classic se tient traditionnellement au début de l'été (juillet), tous les deux
        ans. Consultez le site officiel <a href="https://www.lemansclassic.com/" target="_blank" rel="noopener noreferrer">lemansclassic.com</a> pour
        les dates exactes et l'ouverture de la billetterie.
      </p>

      <h2>Pourquoi Le Mans Classic attire autant</h2>
      <ul>
        <li>
          <strong>Une immersion dans l'histoire</strong> : voir rouler en piste des voitures
          que l'on ne croise habituellement qu'en musée.
        </li>
        <li>
          <strong>Ambiance conviviale</strong> : l'événement attire les passionnés du monde
          entier dans une atmosphère plus détendue et familiale que les 24h modernes.
        </li>
        <li>
          <strong>Paddock accessible</strong> : les voitures sont préparées à la vue de tous,
          les propriétaires discutent volontiers.
        </li>
        <li>
          <strong>Reconstitution d'époque</strong> : costumes, stands vintage, animations
          années 20 à 90.
        </li>
      </ul>

      <h2>Où se loger pour Le Mans Classic ?</h2>
      <p>
        Contrairement aux 24h du Mans en juin, les hébergements sont un peu plus faciles à
        trouver pour Le Mans Classic, mais il faut quand même s'y prendre tôt (dès 6 mois à
        l'avance pour avoir le choix).
      </p>

      <h3>En ville, pour l'accès facile</h3>
      <p>
        Le Mans centre reste l'option la plus pratique : 15-20 minutes du circuit hors événement (30-45 min les jours de course), mais loin des
        bouchons et des campements. Idéal pour les familles et les amateurs qui veulent aussi
        profiter du patrimoine de la Cité Plantagenêt.
      </p>

      <h3>Camping officiel</h3>
      <p>
        Ambiance inégalée avec tous les clubs qui se retrouvent, mais prévoir matériel et
        bonne humeur. Plutôt réservé aux passionnés convaincus.
      </p>

      <h3>Location de maison pour les clubs</h3>
      <p>
        Beaucoup de clubs de collectionneurs viennent en groupe. Une grande maison permet de
        rassembler tout le monde dans un lieu confortable, avec stationnement facile pour les
        voitures de collection.
      </p>

      <h2>Notre maison : parfaite pour les clubs de collectionneurs</h2>
      <p>
        Nos <strong>9 suites privatives avec salles de bain</strong> accueillent jusqu'à 18
        personnes dans un cadre calme, à 15-20 minutes du Circuit Bugatti hors événement (30-45 min les jours de course) :
      </p>
      <ul>
        <li>Stationnement gratuit dans une rue résidentielle calme</li>
        <li>10 min à pied de la gare du Mans + tram T1 direct vers le circuit (~30 min porte-à-porte, idéal pour laisser la voiture de collection à l'abri les jours d'affluence)</li>
        <li>Cuisine équipée pour dîner ensemble en mode "repas d'équipe"</li>
        <li>215 m² au total (espaces communs, chambres et annexe sport/zen) pour se retrouver</li>
        <li>Wi-Fi haut débit, salle de sport, espace zen</li>
        <li>Arrivée autonome dès 17h avec serrure connectée</li>
      </ul>

      <h2>Conseils pour votre week-end</h2>
      <ol>
        <li>
          <strong>Réservez billets et hébergement dès l'ouverture</strong> : les places en
          tribune et les meilleurs logements partent très vite.
        </li>
        <li>
          <strong>Prévoyez une tenue d'époque</strong> si vous voulez jouer le jeu : beaucoup
          de visiteurs viennent costumés.
        </li>
        <li>
          <strong>Appareil photo chargé</strong> : c'est un des plus beaux terrains de jeu
          photographique au monde pour les amateurs de carrosseries mythiques.
        </li>
        <li>
          <strong>Prévoyez bouchons d'oreilles</strong> pour profiter des moteurs atmosphériques
          des années 60-70 sans trop fatiguer les tympans.
        </li>
      </ol>

      <h2>Réserver votre séjour Le Mans Classic</h2>
      <p>
        Il nous reste des disponibilités pour la prochaine édition du Mans Classic. Consultez
        le <Link href="/#disponibilite">calendrier en temps réel</Link> et réservez avant que
        les dernières places ne partent.
      </p>
    </>
  );
}
