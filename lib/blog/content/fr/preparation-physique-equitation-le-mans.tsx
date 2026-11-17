import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Un cavalier ne porte pas de charges, mais il tient une posture pendant des heures, absorbe
        chaque foulée avec le bassin et commande avec des jambes indépendantes du haut du corps.
        Nous accueillons des cavaliers venus pour les concours de la région : voici comment
        utiliser{" "}
        <Link href="/fr/blog/salle-de-sport-privee-le-mans">la salle de sport de la maison</Link>{" "}
        pour monter mieux et ménager son dos.
      </p>

      <h2>Ce que l'équitation demande</h2>
      <ul>
        <li>
          <strong>Un tronc stable</strong> : le gainage permet de suivre le mouvement du cheval
          sans se raidir ni s'effondrer.
        </li>
        <li>
          <strong>Des adducteurs et des fessiers</strong> qui tiennent la position, en dressage
          comme en équilibre à l'obstacle.
        </li>
        <li>
          <strong>Un bassin mobile</strong> qui absorbe les allures.
        </li>
        <li>
          <strong>Un haut du dos tonique</strong> pour se tenir droit, épaules basses.
        </li>
        <li>
          <strong>De la symétrie</strong> : chaque cavalier a un côté plus fort.
        </li>
      </ul>

      <h2>La séance du cavalier (40 minutes)</h2>
      <ul>
        <li>
          <strong>Goblet squat</strong> avec un bumper de 5 ou 10 kg : 3 × 10, buste droit.
        </li>
        <li>
          <strong>Planche Copenhague</strong> sur le banc : 3 × 20 s par côté, pour les
          adducteurs.
        </li>
        <li>
          <strong>Hip thrust</strong> à la barre : 3 × 10.
        </li>
        <li>
          <strong>Pallof press</strong> à la poulie, poignée simple : 3 × 10 par côté, le buste ne
          tourne pas.
        </li>
        <li>
          <strong>Tirage horizontal</strong> à la poulie basse : 3 × 12, omoplates serrées.
        </li>
        <li>
          <strong>Dead bug</strong> sur le tapis : 3 × 10, pour dissocier bras et jambes.
        </li>
        <li>
          <strong>Fentes marchées</strong> : 2 × 8 par jambe, en surveillant le côté le plus
          faible.
        </li>
      </ul>

      <h2>Le cardio, utile en concours complet</h2>
      <p>
        Un parcours de cross ou une longue journée de concours fatigue aussi le cavalier. 20 à
        30 minutes d'elliptique ou de rameur Concept2 deux fois par semaine suffisent pour ne
        pas finir le parcours essoufflé.
      </p>

      <h2>Le jour du concours</h2>
      <ul>
        <li>
          <strong>Le matin</strong> : 10 minutes de mobilité du bassin et des hanches sur le
          tapis (bascules du bassin, ouvertures de hanches, chat-vache), avant de partir aux
          écuries.
        </li>
        <li>
          <strong>Le soir</strong> : étirements des adducteurs, des fléchisseurs de hanche et du
          bas du dos dans la salle zen ; voir{" "}
          <Link href="/fr/blog/recuperation-apres-effort-le-mans">notre routine de récupération</Link>
          .
        </li>
      </ul>

      <h2>Pratique pour les cavaliers</h2>
      <ul>
        <li>
          Le <strong>Pôle européen du cheval</strong> (Yvré-l'Évêque) est à une vingtaine de
          minutes en voiture, l'hippodrome des Hunaudières aussi. Voir{" "}
          <Link href="/fr/blog/concours-equestre-pole-europeen-du-cheval">
            notre article sur les concours équestres
          </Link>
          .
        </li>
        <li>
          Les chevaux, les vans et les camions restent sur le site du concours : la maison n'a
          ni écurie ni place pour un camion.
        </li>
        <li>
          Lave-linge et sèche-linge pour les tenues, une salle de douche par chambre, jusqu'à
          20 personnes : cavaliers, coachs et familles.
        </li>
        <li>
          Les jeunes cavaliers de 10 à 17 ans sont accueillis sous la responsabilité de leurs
          encadrants ; en salle, les mineurs s'entraînent avec un adulte.
        </li>
      </ul>
      <ExerciseGuide locale="fr" ids={["goblet-squat", "copenhagen-plank", "hip-thrust", "pallof-press", "seated-cable-row", "dead-bug", "walking-lunge"]} />
    </>
  );
}
