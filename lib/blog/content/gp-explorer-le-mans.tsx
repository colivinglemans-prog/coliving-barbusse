import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Le GP Explorer, créé par Squeezie et son équipe, est devenu en quelques éditions
        l'un des événements les plus suivis de France. Mélangeant course automobile, show
        YouTube et festival, il attire plus de 60 000 spectateurs au Circuit Bugatti. Voici
        le guide pour préparer votre week-end.
      </p>

      <h2>Qu'est-ce que le GP Explorer ?</h2>
      <p>
        Le GP Explorer est une course automobile créée en 2022 par Squeezie (YouTubeur suivi
        par plus de 18 millions d'abonnés) en partenariat avec GP Elite. Des créateurs de
        contenu et personnalités s'affrontent sur le Circuit Bugatti au volant de Formule 4,
        devant un public acquis et retransmis en direct sur Twitch (record d'audience français
        battu à chaque édition).
      </p>

      <h2>Pourquoi le GP Explorer est un événement unique</h2>
      <ul>
        <li>
          <strong>Public jeune et passionné</strong> : en grande majorité 15-30 ans, très
          festif, ambiance concert.
        </li>
        <li>
          <strong>Record d'audience Twitch</strong> : plus d'1,2 million de viewers en simultané
          pour l'édition 2023 — la plus grande audience francophone sur la plateforme.
        </li>
        <li>
          <strong>Prix d'entrée abordables</strong> : billets autour de 40 € + free zones,
          contrairement aux événements MotoGP ou F1.
        </li>
        <li>
          <strong>Animations show à l'américaine</strong> : présentateurs, podium, musique,
          drones lumineux le soir.
        </li>
      </ul>

      <h2>Quand a lieu la prochaine édition ?</h2>
      <p>
        Les éditions passées ont eu lieu en octobre (2022, 2023) puis septembre (2024). La
        date précise des prochaines éditions est généralement annoncée sur la chaîne YouTube
        de Squeezie et sur le site officiel quelques mois avant. Restez à l'affût de la
        billetterie : tout part en quelques minutes.
      </p>

      <h2>Se loger pour le GP Explorer</h2>
      <p>
        L'événement étant devenu massif, les hébergements se remplissent vite — mais souvent
        moins tôt que pour les 24h du Mans. La population étant plutôt jeune, l'hôtellerie
        classique n'est pas toujours le premier choix ; les locations de maisons partagées
        fonctionnent très bien pour les groupes d'amis.
      </p>

      <h3>En groupe, c'est plus malin</h3>
      <p>
        Le GP Explorer se vit à plusieurs : beaucoup y vont avec leur groupe d'amis ou leur
        communauté. Partager une grande maison divise le coût par personne et permet de prolonger
        la fête ensemble.
      </p>

      <h3>Privilégier Le Mans ville</h3>
      <p>
        Le samedi soir, l'ambiance déborde en ville : restaurants, bars, terrasses. Se loger
        en centre permet de profiter de l'ambiance sans avoir à conduire.
      </p>

      <h2>Notre maison : parfaite pour un groupe GP Explorer</h2>
      <p>
        Notre coliving de <strong>9 suites avec salles de bain privatives</strong> accueille
        jusqu'à 18 personnes :
      </p>
      <ul>
        <li>15-20 min du Circuit Bugatti hors événement (45-60 min les jours de course)</li>
        <li>10 min à pied de la gare TGV + tram T1 direct vers le circuit (~30 min porte-à-porte, sans bouchon ni souci de parking)</li>
        <li>Stationnement gratuit dans la rue résidentielle calme</li>
        <li>240 m² d'espaces communs pour se retrouver</li>
        <li>Wi-Fi haut débit pour regarder le live Twitch si certains ratent une session</li>
        <li>Cuisine équipée pour pré-dîner avant de sortir</li>
        <li>Serrure connectée, arrivée autonome à partir de 17h</li>
      </ul>

      <h2>Conseils pour votre week-end GP Explorer</h2>
      <ol>
        <li>
          <strong>Soyez prêts pour l'ouverture de la billetterie</strong> : l'an dernier,
          tous les billets sont partis en moins de 30 minutes.
        </li>
        <li>
          <strong>Privilégiez le tramway T1</strong> depuis la gare du Mans (~20 min jusqu'au
          circuit, trams fréquents). Ça évite les bouchons à l'entrée et au retour.
        </li>
        <li>
          <strong>Anticipez le retour en voiture</strong> : comme pour les grandes courses,
          les axes routiers sont surchargés à la sortie.
        </li>
        <li>
          <strong>Arrivez le vendredi soir</strong> pour profiter du centre-ville avant
          l'affluence du samedi.
        </li>
        <li>
          <strong>Sortir samedi soir</strong> : les bars du centre-ville sont pris d'assaut,
          réservez si possible.
        </li>
      </ol>

      <h2>Réserver pour le prochain GP Explorer</h2>
      <p>
        Vous planifiez votre week-end GP Explorer au Mans ? Consultez dès maintenant{" "}
        <Link href="/#disponibilite">nos disponibilités</Link> et sécurisez votre hébergement
        avant que tout ne parte.
      </p>
    </>
  );
}
