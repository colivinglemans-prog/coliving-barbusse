import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        En roller de vitesse, tout part des hanches : une poussée latérale, une position
        fléchie tenue pendant des heures, et un dos qui doit encaisser. Nous avons déjà
        accueilli des équipes de roller venues pour le circuit ; voici comment utiliser{" "}
        <Link href="/fr/blog/salle-de-sport-privee-le-mans">la salle de sport de la maison</Link>{" "}
        pour se préparer, notamment aux 24 Heures Rollers.
      </p>

      <h2>Ce que le roller demande</h2>
      <ul>
        <li>
          <strong>Des fessiers et des adducteurs puissants</strong> pour la poussée latérale.
        </li>
        <li>
          <strong>Des cuisses endurantes</strong>, en position fléchie pendant tout un relais.
        </li>
        <li>
          <strong>Un bas du dos solide</strong>, penché en avant.
        </li>
        <li>
          <strong>Des chevilles stables</strong> et un bon équilibre sur une jambe.
        </li>
      </ul>

      <h2>La séance du rolleur (50 minutes)</h2>
      <ul>
        <li>
          <strong>Back squat</strong> : 4 × 6, ou squat avant pour garder le buste droit.
        </li>
        <li>
          <strong>Fentes latérales</strong> aux haltères : 3 × 8 par côté, le geste le plus
          proche de la poussée.
        </li>
        <li>
          <strong>Step-up sur la box</strong> : 3 × 8 par jambe.
        </li>
        <li>
          <strong>Soulevé de terre jambes tendues</strong> : 3 × 8.
        </li>
        <li>
          <strong>Planche Copenhague</strong> sur le banc, pour les adducteurs : 3 × 20 s par
          côté.
        </li>
        <li>
          <strong>Box jumps latéraux</strong> sur une box basse (20 cm) : 3 × 6 par côté,
          réception douce.
        </li>
        <li>
          <strong>Équilibre</strong> : tenir sur une jambe, genou fléchi en position de patin,
          3 × 30 s par jambe, yeux fermés pour les plus à l'aise.
        </li>
      </ul>

      <h2>L'endurance sans rouler</h2>
      <p>
        L'elliptique reproduit une poussée jambe par jambe sans impact : 30 minutes en
        endurance, ou des intervalles de 2 minutes soutenues pour 1 minute facile. Le rameur
        Concept2 entretient le cardio en sollicitant le dos et les bras.
      </p>

      <h2>Les 24 Heures Rollers, en équipe</h2>
      <p>
        En juillet, le circuit Bugatti accueille les{" "}
        <Link href="/fr/blog/24-heures-rollers-le-mans">24 Heures Rollers</Link>. Une équipe en
        relais qui loge à la maison, à 4,7 km du circuit, peut :
      </p>
      <ul>
        <li>
          s'activer le matin avec 10 minutes d'elliptique et quelques fentes latérales ;
        </li>
        <li>
          revenir dormir entre deux relais dans une chambre au noir complet, avec sa propre
          douche ;
        </li>
        <li>
          récupérer après la course avec{" "}
          <Link href="/fr/blog/recuperation-apres-effort-le-mans">notre routine d'après-effort</Link>{" "}
          : hanches, adducteurs, bas du dos.
        </li>
      </ul>

      <h2>Pratique</h2>
      <ul>
        <li>9 chambres avec salle de douche, jusqu'à 20 personnes.</li>
        <li>Lave-linge et sèche-linge pour les tenues.</li>
        <li>Cuisine équipée et grande table pour les repas d'équipe.</li>
        <li>
          Sans encadrement : chacun s'entraîne sous sa responsabilité, les mineurs avec un
          adulte.
        </li>
      </ul>
      <p>
        Voir aussi{" "}
        <Link href="/fr/blog/entrainements-salle-de-sport-le-mans">
          nos séances, seul ou à plusieurs
        </Link>
        .
      </p>
      <ExerciseGuide locale="fr" ids={["back-squat", "front-squat", "lateral-lunge", "step-up", "romanian-deadlift", "copenhagen-plank", "box-jump"]} />
    </>
  );
}
