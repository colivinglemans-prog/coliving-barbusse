import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Le 24 et le 31 décembre, chacun est souvent pris ailleurs : belle-famille, réveillon
        déjà prévu, enfants partagés entre deux maisons. Alors de plus en plus de groupes se
        retrouvent <strong>autour</strong> des fêtes : le week-end d'avant Noël, entre Noël et
        le Nouvel An, ou en semaine début décembre pour le repas d'équipe. Une maison entière
        au Mans pour 20, avec une table à la hauteur, c'est fait pour ça.
      </p>

      <h2>Trois façons de fêter la fin d'année</h2>
      <ul>
        <li>
          <strong>Noël en avance</strong> : le week-end qui précède le 24, entre amis ou entre
          frères et sœurs, avant que chacun parte dans sa famille. Les cadeaux sous le sapin,
          le grand repas le samedi soir, le brunch le dimanche.
        </li>
        <li>
          <strong>Entre Noël et le Nouvel An</strong> : les jours entre le 26 et le 31, quand
          tout le monde est en congés, pour réunir enfin les cousins et les amis dispersés.
        </li>
        <li>
          <strong>Le repas de fin d'année de l'équipe</strong> : en semaine début décembre, une
          ou deux nuits pour un dîner d'équipe et une matinée de bilan, sans que personne ne
          reprenne la route après la soirée. Arrivée plus tôt ou départ plus tard possibles,
          en supplément et selon les disponibilités (
          <Link href="/fr/blog/seminaire-entreprise-le-mans">séminaires</Link>).
        </li>
      </ul>

      <h2>Une table pour 20, une chambre par couple</h2>
      <ul>
        <li>
          <strong>16 places assises</strong> à la grande table, <strong>20</strong> en y
          rapprochant les mini-tables de la véranda : tout le monde au même repas.
        </li>
        <li>
          <strong>Cuisine entièrement équipée</strong>, vaisselle pour 20, grands plats et
          grandes casseroles : la dinde, le chapon ou le plateau de fruits de mer.
        </li>
        <li>
          <strong>9 chambres avec salle de douche privative</strong> : après la soirée, chacun
          monte se coucher, et personne ne fait la queue le lendemain matin.
        </li>
        <li>
          <strong>Maison chauffée</strong>, véranda comprise, et un salon avec grand écran pour
          le film de Noël.
        </li>
        <li>
          <strong>Draps, serviettes et ménage de fin de séjour inclus</strong>.
        </li>
      </ul>

      <h2>Le Mans en décembre</h2>
      <ul>
        <li>
          <strong>Le marché de Noël</strong>, place de la République, de fin novembre à fin
          décembre, avec ses chalets et sa guinguette d'hiver.
        </li>
        <li>
          <strong>La Cité Plantagenêt</strong>, le vieux Mans, à 15 minutes en tramway, et la
          cathédrale Saint-Julien (
          <Link href="/fr/blog/que-visiter-le-mans-sarthe">que visiter au Mans</Link>).
        </li>
        <li>
          <strong>Le parc du Gué de Maulny</strong>, à 5 minutes à pied, pour la balade digestive
          du lendemain.
        </li>
        <li>
          Pour les courses de dernière minute et les restaurants :{" "}
          <Link href="/fr/blog/restos-bars-magasins-le-mans">nos adresses</Link>.
        </li>
      </ul>

      <h2>Les règles des fêtes</h2>
      <ul>
        <li>
          <strong>Séjour minimum de 3 nuits</strong> pour les arrivées du 20 décembre au
          2 janvier, 2 nuits le reste de l'année.
        </li>
        <li>
          <strong>Une maison pour héberger la famille et ses repas</strong>, pas une salle de
          réception : pas de fête ni de soirée bruyante.
        </li>
        <li>
          <strong>Arrivée autonome</strong> à partir de 17h (ou avant si la maison est prête),
          départ avant 11h ; arrivée plus tôt ou départ plus tard possibles, en supplément et
          selon les disponibilités. Gare TGV à 10 minutes à pied pour ceux qui viennent en
          train.
        </li>
        <li>
          <strong>Enfants</strong> : la maison n'est pas adaptée aux moins de 10 ans
          (escaliers), qui restent acceptés sous la responsabilité de leurs parents.{" "}
          <strong>Animaux</strong> non autorisés.
        </li>
      </ul>

      <h2>Les dates encore libres</h2>
      <p>
        Les nuits du 24 et du 31 décembre partent les premières. La liste ci-dessous donne la
        disponibilité réelle des prochaines dates de fêtes ; pour toute autre date, consultez
        nos <Link href="/fr#disponibilite">disponibilités en temps réel</Link> et réservez en
        direct, sans commission.
      </p>
    </>
  );
}
