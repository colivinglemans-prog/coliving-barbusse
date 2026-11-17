import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Un cycliste passe des heures sur le vélo, et c'est justement pour cela que la salle
        de musculation lui rend service : des jambes plus fortes, un tronc qui tient la
        position, un dos qui ne se plaint plus après quatre heures de selle. Nous avons accueilli
        un groupe de cyclistes le week-end des 24 Heures Vélo : voici comment profiter de{" "}
        <Link href="/fr/blog/salle-de-sport-privee-le-mans">la salle de sport de la maison</Link>{" "}
        avant, pendant et après une épreuve au Mans.
      </p>

      <h2>Ce que la musculation apporte au cycliste</h2>
      <ul>
        <li>
          <strong>Des jambes plus puissantes</strong> : plus de force, c'est plus de watts
          dans les relances et les bosses.
        </li>
        <li>
          <strong>Un tronc solide</strong> : le bassin reste stable sur la selle, le pédalage
          ne se dissipe pas.
        </li>
        <li>
          <strong>Un dos et une nuque qui tiennent</strong> la position aérodynamique.
        </li>
        <li>
          <strong>Des os et des tendons plus résistants</strong> : le vélo, sport porté, les
          sollicite peu.
        </li>
      </ul>

      <h2>La séance de force du cycliste (50 minutes)</h2>
      <p>À faire une à deux fois par semaine hors période de course :</p>
      <ul>
        <li>
          <strong>Back squat</strong> dans la cage : 4 × 6, difficile mais propre.
        </li>
        <li>
          <strong>Soulevé de terre jambes tendues</strong> : 3 × 8, pour les ischio-jambiers et
          les fessiers, souvent en retard chez le cycliste.
        </li>
        <li>
          <strong>Step-up sur la box</strong> (40 à 50 cm) avec haltères : 3 × 8 par jambe,
          pour corriger l'écart entre la jambe forte et la jambe faible.
        </li>
        <li>
          <strong>Hip thrust</strong> à la barre, dos sur le banc : 3 × 10.
        </li>
        <li>
          <strong>Tirage horizontal</strong> à la poulie basse : 3 × 12, pour le haut du dos.
        </li>
        <li>
          <strong>Gainage</strong> : planche 3 × 40 s, planche latérale 2 × 30 s par côté, dead
          bug 2 × 10.
        </li>
      </ul>

      <h2>À l'approche d'une course</h2>
      <p>
        Dans la semaine de l'épreuve, on garde un peu de force mais sans fatigue : 2 × 5
        squats légers et rapides, du gainage, et c'est tout. La veille, 15 minutes
        d'elliptique et de la mobilité des hanches suffisent.
      </p>

      <h2>Les 24 Heures Vélo : relais et récupération</h2>
      <p>
        Fin août, le circuit Bugatti accueille les{" "}
        <Link href="/fr/blog/24-heures-velo-le-mans-2027">24 Heures Vélo</Link>, en solo ou en
        équipe. Pour une équipe en relais qui loge à la maison, à 4,7 km du circuit :
      </p>
      <ul>
        <li>
          <strong>Entre deux relais</strong> : 10 minutes d'elliptique très légères pour
          faire circuler le sang, une douche dans sa chambre, manger, dormir dans le noir
          complet grâce aux volets roulants.
        </li>
        <li>
          <strong>Après la course</strong> : la routine de{" "}
          <Link href="/fr/blog/recuperation-apres-effort-le-mans">notre article récupération</Link>
          , centrée sur les hanches, les ischio-jambiers et le bas du dos.
        </li>
      </ul>

      <h2>Le rameur, l'allié des jours sans vélo</h2>
      <p>
        Le rameur Concept2 fait travailler le haut du corps que le vélo oublie, sans impact.
        Une séance de 20 minutes en endurance, ou 6 × 3 minutes soutenues, entretient le cœur
        les jours de pluie ou de repos des jambes.
      </p>

      <h2>Pratique pour une équipe cycliste</h2>
      <ul>
        <li>
          <strong>Les vélos se rangent à l'abri dans la salle zen</strong>, à l'intérieur.
        </li>
        <li>
          <strong>Lave-linge et sèche-linge</strong> pour les cuissards et maillots.
        </li>
        <li>
          <strong>Une salle de douche par chambre</strong>, 9 chambres, jusqu'à 20 personnes.
        </li>
        <li>
          La gare TGV est à 15 minutes à pied, à environ 55 minutes de Paris.
        </li>
      </ul>
      <p>
        Pour d'autres séances, voir{" "}
        <Link href="/fr/blog/entrainements-salle-de-sport-le-mans">
          nos entraînements seul ou à plusieurs
        </Link>{" "}
        et{" "}
        <Link href="/fr/blog/equipe-sportive-le-mans">notre article pour les équipes sportives</Link>
        .
      </p>
      <ExerciseGuide locale="fr" ids={["back-squat", "romanian-deadlift", "step-up", "hip-thrust", "seated-cable-row", "plank", "side-plank", "dead-bug", "rowing"]} />
    </>
  );
}
