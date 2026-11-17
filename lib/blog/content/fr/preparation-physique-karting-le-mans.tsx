import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Un kart n'a ni direction assistée ni suspension : le pilote encaisse les vibrations,
        les forces latérales dans le cou et les côtes, et tient un volant dur à chaque virage.
        En mai 2026, une équipe de karting venue de Singapour a logé chez nous pour les SWS
        Karting Finals. Voici comment utiliser{" "}
        <Link href="/fr/blog/salle-de-sport-privee-le-mans">la salle de sport de la maison</Link>{" "}
        pour se préparer à une course au circuit international de karting du Mans.
      </p>

      <h2>Ce que le karting demande</h2>
      <ul>
        <li>
          <strong>Le cou</strong>, qui porte le casque dans chaque virage.
        </li>
        <li>
          <strong>Les avant-bras et la poigne</strong>, sur un volant sans assistance.
        </li>
        <li>
          <strong>Le tronc et les côtes</strong>, calés contre le baquet.
        </li>
        <li>
          <strong>Le cardio</strong> : le rythme cardiaque monte vite pendant une manche.
        </li>
      </ul>

      <h2>La séance du pilote (45 minutes)</h2>
      <ul>
        <li>
          <strong>Cou</strong> : isométrie contre la main dans les quatre directions, 4 × 15 s ;
          puis allongé sur le banc, tête dépassant du bord, flexions lentes au seul poids de la
          tête, 2 × 12 par direction.
        </li>
        <li>
          <strong>Poigne</strong> : suspension à la barre de traction, 3 × 30 s ; marche du
          fermier avec deux haltères, 3 × 30 m.
        </li>
        <li>
          <strong>Tractions</strong> : 3 séries au maximum moins une, avec élastique pour aider
          si besoin.
        </li>
        <li>
          <strong>Tirage horizontal</strong> à la poulie basse, poignée de tirage à prises parallèles : 3 × 12, puis rowing à un bras, poignée simple, 2 × 10 par bras pour équilibrer les deux côtés.
        </li>
        <li>
          <strong>Gainage</strong> : Pallof press 3 × 10 par côté, planche latérale 3 × 30 s par
          côté.
        </li>
        <li>
          <strong>Cardio</strong> : rameur Concept2, 6 × 2 minutes soutenues, 1 minute facile.
        </li>
      </ul>

      <h2>Le matin de la course</h2>
      <p>
        10 à 15 minutes : elliptique progressif, rotations du cou et des épaules, poignets,
        quelques secondes de suspension à la barre, gainage léger. Le but est d'arriver au
        circuit réveillé, pas fatigué.
      </p>

      <h2>Les jeunes pilotes</h2>
      <p>
        Beaucoup de pilotes de karting sont mineurs. En salle, ils s'entraînent{" "}
        <strong>accompagnés d'un adulte</strong> — parent, mécanicien ou coach —, avec des
        exercices au poids du corps, à l'élastique, au rameur et des charges légères.
        Le travail du cou se fait sans charge.
      </p>

      <h2>Après les manches</h2>
      <p>
        Douche dans sa chambre, repas d'équipe, et quelques minutes d'étirements du cou,
        des avant-bras et du dos dans la salle zen. Le détail est dans{" "}
        <Link href="/fr/blog/recuperation-apres-effort-le-mans">notre routine de récupération</Link>
        .
      </p>

      <h2>Pratique pour une équipe de karting</h2>
      <ul>
        <li>
          Le circuit international de karting accueille les{" "}
          <Link href="/fr/blog/sws-karting-finals-le-mans">SWS Karting Finals</Link>, le{" "}
          <Link href="/fr/blog/championnat-monde-karting-kz-le-mans">
            championnat du monde KZ
          </Link>{" "}
          et d'autres épreuves internationales.
        </li>
        <li>
          Les karts, la remorque et l'outillage restent au paddock : la rue n'a pas de
          place pour eux.
        </li>
        <li>
          9 chambres avec salle de douche, jusqu'à 20 personnes : pilotes, parents et
          mécaniciens sous le même toit.
        </li>
      </ul>
      <p>
        Pour les pilotes automobiles, voir{" "}
        <Link href="/fr/blog/preparation-physique-course-automobile-le-mans">
          notre article sur la course automobile
        </Link>
        .
      </p>
      <ExerciseGuide locale="fr" ids={["neck-isometrics", "farmer-walk", "pull-up", "seated-cable-row", "single-arm-cable-row", "pallof-press", "side-plank", "rowing"]} />
    </>
  );
}
