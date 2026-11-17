import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Le handball enchaîne sprints, duels, changements de direction et tirs en suspension :
        un sport de contact qui sollicite les genoux et l'épaule du bras de tir. En août 2026,
        une équipe féminine de handball a passé un week-end de tournoi à la maison, à 19 avec
        son staff. Voici comment utiliser{" "}
        <Link href="/fr/blog/salle-de-sport-privee-le-mans">la salle de sport de la maison</Link>{" "}
        pour préparer un match ou un stage.
      </p>

      <h2>Ce que le handball demande</h2>
      <ul>
        <li>
          <strong>De l'explosivité</strong> : démarrages, sauts, appuis.
        </li>
        <li>
          <strong>Des genoux protégés</strong> : les réceptions et les changements de direction
          sont le premier risque de blessure.
        </li>
        <li>
          <strong>Une épaule de tireur solide</strong>, en particulier à l'arrière de
          l'épaule.
        </li>
        <li>
          <strong>Un tronc fort</strong> pour les duels.
        </li>
      </ul>

      <h2>La séance de force et d'explosivité (50 minutes)</h2>
      <ul>
        <li>
          <strong>Box jumps</strong> : 4 × 4, réception silencieuse, genoux dans l'axe des
          pieds.
        </li>
        <li>
          <strong>Back squat</strong> : 4 × 5.
        </li>
        <li>
          <strong>Soulevé de terre jambes tendues</strong> : 3 × 8, pour les ischio-jambiers,
          protecteurs du genou.
        </li>
        <li>
          <strong>Fentes marchées</strong> aux haltères : 3 × 8 par jambe.
        </li>
        <li>
          <strong>Développé couché</strong> : 3 × 6.
        </li>
        <li>
          <strong>Tractions</strong> : 3 séries au maximum moins une.
        </li>
        <li>
          <strong>Thrusters à la médecine-ball</strong> : 3 × 10, poussée explosive.
        </li>
      </ul>

      <h2>La prévention, à faire avant chaque séance (15 minutes)</h2>
      <ul>
        <li>
          <strong>Épaule</strong> : rotations externes à l'élastique 3 × 15, face pull à la
          corde 3 × 15.
        </li>
        <li>
          <strong>Genoux</strong> : réceptions de saut sur une jambe depuis la box basse (20 cm),
          3 × 5 par jambe, en tenant la réception 2 secondes, genou dans l'axe.
        </li>
        <li>
          <strong>Adducteurs</strong> : planche Copenhague, 2 × 20 s par côté.
        </li>
        <li>
          <strong>Gainage</strong> : planche latérale, 2 × 30 s par côté.
        </li>
      </ul>

      <h2>Le circuit d'équipe</h2>
      <p>
        Pour une équipe de 14 à 16 joueuses ou joueurs : deux groupes. Le premier fait le
        circuit en stations dans la salle (rameur, box jumps, thrusters à la médecine-ball, poulie, tractions,
        gainage, corde, fentes), le second part en footing au parc du Gué de Maulny, à 5
        minutes à pied. On inverse au bout de 20 minutes.
      </p>

      <h2>Le week-end de tournoi</h2>
      <ul>
        <li>
          <strong>Le matin du match</strong> : 15 minutes d'activation (elliptique, prévention
          épaule et genoux), puis départ vers la salle.
        </li>
        <li>
          <strong>Entre deux matchs</strong> : repas d'équipe à la grande table de 16 à 20
          places, maillots au lave-linge.
        </li>
        <li>
          <strong>Le soir</strong> :{" "}
          <Link href="/fr/blog/recuperation-apres-effort-le-mans">routine de récupération</Link>{" "}
          et une vraie nuit, chacun dans sa chambre.
        </li>
      </ul>

      <h2>Pratique pour un club</h2>
      <ul>
        <li>
          Antarès, où se jouent aussi des matchs de handball, est desservi en tram T1 direct
          depuis la gare, à 15 minutes à pied de la maison.
        </li>
        <li>
          9 chambres avec salle de douche, jusqu'à 20 personnes ; les 10-17 ans sous la
          responsabilité de leurs encadrants, les mineurs en salle avec un adulte.
        </li>
        <li>Paiement possible sur facture au nom du club.</li>
      </ul>
      <p>
        Plus d'infos dans{" "}
        <Link href="/fr/blog/equipe-sportive-le-mans">notre article pour les équipes sportives</Link>
        .
      </p>
      <ExerciseGuide locale="fr" ids={["box-jump", "back-squat", "romanian-deadlift", "walking-lunge", "bench-press", "pull-up", "medicine-ball-thruster", "band-external-rotation", "face-pull", "copenhagen-plank", "side-plank"]} />
    </>
  );
}
