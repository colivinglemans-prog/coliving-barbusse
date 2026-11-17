import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Au volley-ball, on saute, on frappe, on retombe, et on recommence des centaines de fois
        par tournoi. Une équipe de volley qui loge chez nous peut entretenir sa détente et
        protéger ses épaules et ses genoux dans{" "}
        <Link href="/fr/blog/salle-de-sport-privee-le-mans">la salle de sport de la maison</Link>
        . Voici les séances que nous proposons, avant et pendant un tournoi.
      </p>

      <h2>Ce que le volley demande</h2>
      <ul>
        <li>
          <strong>La détente</strong> : des jambes fortes et rapides pour l'attaque et le
          contre.
        </li>
        <li>
          <strong>Des réceptions maîtrisées</strong> : les genoux et les chevilles encaissent
          chaque saut.
        </li>
        <li>
          <strong>Des épaules solides</strong> : le smash et le service sollicitent la coiffe des
          rotateurs.
        </li>
        <li>
          <strong>Un tronc gainé</strong> qui transmet la force des jambes au bras.
        </li>
      </ul>

      <h2>La séance de détente (45 minutes)</h2>
      <ul>
        <li>
          <strong>Box jumps</strong> : 4 × 5, box de 40 à 50 cm, en redescendant en marchant.
          On cherche la qualité de chaque saut, pas la fatigue.
        </li>
        <li>
          <strong>Back squat</strong> : 4 × 5, lourd et rapide à la montée.
        </li>
        <li>
          <strong>Hip thrust</strong> à la barre : 3 × 8.
        </li>
        <li>
          <strong>Fentes marchées</strong> aux haltères : 3 × 8 par jambe.
        </li>
        <li>
          <strong>Mollets debout</strong> : 3 × 15.
        </li>
      </ul>

      <h2>La séance « épaules » de prévention (20 minutes)</h2>
      <p>À faire avant les entraînements ou les jours de tournoi, à charge légère :</p>
      <ul>
        <li>
          <strong>Rotations externes à l'élastique</strong>, coude au corps : 3 × 15.
        </li>
        <li>
          <strong>Face pull</strong> à la corde, poulie haute : 3 × 15.
        </li>
        <li>
          <strong>Tirage vertical</strong> à la poulie, barre large : 3 × 12.
        </li>
        <li>
          <strong>Pompes</strong> : 3 × 10, omoplates actives.
        </li>
        <li>
          <strong>Thrusters à la médecine-ball</strong> : 3 × 10, pour coordonner jambes et bras.
        </li>
      </ul>

      <h2>En équipe : le circuit volley</h2>
      <p>
        Pour 6 à 12 joueurs, par binômes : 40 secondes par station, 20 secondes pour tourner,
        deux tours. Box jumps, thrusters à la médecine-ball, rameur, face pull, fentes, gainage, corde à sauter,
        rotations à l'élastique. Le coach donne le rythme, la salle tient tout le monde.
      </p>

      <h2>Pendant le tournoi</h2>
      <ul>
        <li>
          <strong>Le matin</strong> : activation de 15 minutes, elliptique, rotations
          d'épaules à l'élastique, quelques sauts sur place.
        </li>
        <li>
          <strong>Le soir</strong> : pas de musculation lourde ;{" "}
          <Link href="/fr/blog/recuperation-apres-effort-le-mans">routine de récupération</Link>
          , repas d'équipe à la grande table, et une vraie nuit.
        </li>
        <li>
          <strong>Les maillots</strong> passent au lave-linge et au sèche-linge pour le
          lendemain.
        </li>
      </ul>

      <h2>Pratique pour un club</h2>
      <ul>
        <li>
          9 chambres avec salle de douche, jusqu'à 20 personnes : toute l'équipe et son
          staff.
        </li>
        <li>
          Les 10-17 ans sont accueillis sous la responsabilité de leurs encadrants majeurs ; en
          salle, les mineurs s'entraînent avec un adulte.
        </li>
        <li>
          Antarès est desservi en tram T1 direct depuis la gare, à 15 minutes à pied de la
          maison.
        </li>
        <li>Paiement possible sur facture au nom du club.</li>
      </ul>
      <p>
        Plus d'infos dans{" "}
        <Link href="/fr/blog/equipe-sportive-le-mans">notre article pour les équipes sportives</Link>
        .
      </p>
      <ExerciseGuide locale="fr" ids={["box-jump", "back-squat", "hip-thrust", "walking-lunge", "calf-raise", "band-external-rotation", "face-pull", "lat-pulldown", "push-up", "medicine-ball-thruster"]} />
    </>
  );
}
