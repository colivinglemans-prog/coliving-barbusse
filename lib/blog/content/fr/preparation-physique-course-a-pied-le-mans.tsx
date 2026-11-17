import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Un coureur qui fait de la musculation court plus longtemps sans se blesser : des
        mollets, des hanches et un tronc plus forts encaissent mieux les milliers d'appuis
        d'une course. Pour un club venu en stage, une course sur route ou un trail dans la
        région, voici comment combiner{" "}
        <Link href="/fr/blog/salle-de-sport-privee-le-mans">la salle de sport de la maison</Link>{" "}
        et les sorties au parc voisin.
      </p>

      <h2>Courir à deux pas de la maison</h2>
      <p>
        Le <strong>parc du Gué de Maulny</strong> (10 ha) est à 5 minutes à pied : de quoi faire
        un footing, des fractions ou des gammes sans prendre la voiture. Le reste de la séance
        se fait dans la salle.
      </p>

      <h2>Ce que la musculation apporte au coureur</h2>
      <ul>
        <li>
          <strong>Des mollets et des tendons d'Achille plus résistants</strong>.
        </li>
        <li>
          <strong>Des hanches stables</strong> : moins de genou qui rentre à chaque appui.
        </li>
        <li>
          <strong>Une meilleure économie de course</strong> : la force rend chaque foulée moins
          coûteuse.
        </li>
        <li>
          <strong>Un tronc qui tient</strong> en fin de course, quand la posture se dégrade.
        </li>
      </ul>

      <h2>La séance de renforcement du coureur (45 minutes)</h2>
      <ul>
        <li>
          <strong>Back squat ou goblet squat</strong> : 3 × 6 à 8.
        </li>
        <li>
          <strong>Soulevé de terre jambes tendues</strong> : 3 × 8.
        </li>
        <li>
          <strong>Step-up sur la box</strong> (40 cm) : 3 × 8 par jambe.
        </li>
        <li>
          <strong>Fentes marchées</strong> : 2 × 10 par jambe.
        </li>
        <li>
          <strong>Mollets debout</strong>, barre sur le dos : 3 × 15, puis sur une jambe 2 × 12.
        </li>
        <li>
          <strong>Gainage</strong> : planche latérale 2 × 30 s par côté, dead bug 2 × 10.
        </li>
        <li>
          <strong>Hanches</strong> : marche latérale avec élastique autour des genoux, 2 × 15
          pas par côté.
        </li>
      </ul>

      <h2>La séance croisée, sans impact</h2>
      <p>
        Pour un jour de récupération ou un coureur qui revient de blessure : 30 à 40 minutes
        d'elliptique ou de rameur Concept2. Le cœur travaille comme en course, les
        articulations se reposent. Variante : 5 × 4 minutes soutenues sur l'elliptique, 2
        minutes faciles entre chaque.
      </p>

      <h2>Un week-end de stage type</h2>
      <ul>
        <li>
          <strong>Samedi matin</strong> : fractionné au parc (par exemple 8 × 400 m), puis
          gainage dans la salle.
        </li>
        <li>
          <strong>Samedi soir</strong> : séance de renforcement ci-dessus, repas d'équipe.
        </li>
        <li>
          <strong>Dimanche matin</strong> : sortie longue en aisance, puis{" "}
          <Link href="/fr/blog/recuperation-apres-effort-le-mans">routine de récupération</Link>
          .
        </li>
      </ul>

      <h2>Avant une course</h2>
      <p>
        Dans les trois jours qui précèdent, pas de musculation lourde. La veille : 20 minutes de
        footing très léger avec quelques accélérations. Le matin : 10 minutes d'elliptique,
        quelques gammes et mobilité des chevilles et des hanches.
      </p>

      <h2>Pratique</h2>
      <ul>
        <li>
          9 chambres avec salle de douche, jusqu'à 20 personnes : tout le club sous le même
          toit.
        </li>
        <li>Lave-linge et sèche-linge pour les tenues de la veille.</li>
        <li>Cuisine équipée pour le plat de pâtes de la veille de course.</li>
        <li>
          Sans encadrement : chacun s'entraîne sous sa responsabilité, les mineurs avec un
          adulte.
        </li>
      </ul>
      <p>
        Voir aussi{" "}
        <Link href="/fr/blog/entrainements-salle-de-sport-le-mans">
          nos séances, seul ou à plusieurs
        </Link>{" "}
        et{" "}
        <Link href="/fr/blog/equipe-sportive-le-mans">notre article pour les équipes sportives</Link>
        .
      </p>
      <ExerciseGuide locale="fr" ids={["back-squat", "goblet-squat", "romanian-deadlift", "step-up", "walking-lunge", "calf-raise", "side-plank", "dead-bug"]} />
    </>
  );
}
