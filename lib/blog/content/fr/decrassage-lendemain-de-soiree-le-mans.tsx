import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Un mariage dans la région, un anniversaire au restaurant, une soirée en ville ou la
        victoire fêtée après la course : le lendemain matin, les jambes sont lourdes et la tête
        aussi. Plutôt que de rester sur le canapé, une séance de décrassage douce aide à se
        remettre en route. Voici comment la faire à la maison, avec{" "}
        <Link href="/fr/blog/salle-de-sport-privee-le-mans">la salle de sport</Link>, la salle
        zen et le parc voisin.
      </p>

      <h2>Ce que le décrassage fait, et ce qu&apos;il ne fait pas</h2>
      <ul>
        <li>
          <strong>Il remet le corps en mouvement</strong> : la circulation repart, les muscles
          raidis par la danse ou une nuit courte se détendent, et on se sent souvent mieux après
          qu&apos;avant.
        </li>
        <li>
          <strong>Il n&apos;élimine pas l&apos;alcool plus vite</strong> : seul le temps le fait. On ne
          « transpire » pas une soirée.
        </li>
        <li>
          <strong>Il ne remplace ni l&apos;eau, ni le sommeil, ni un vrai petit-déjeuner</strong>.
        </li>
      </ul>

      <h2>Avant de commencer</h2>
      <ul>
        <li>
          <strong>Si vous avez encore bu il y a peu, pas de séance</strong> : l&apos;équilibre et
          les réflexes ne sont pas revenus. Pas de charges lourdes, pas de box jumps, pas de
          barre au-dessus de la tête ce jour-là.
        </li>
        <li>
          <strong>Buvez d&apos;abord</strong> un grand verre d&apos;eau, et gardez une bouteille à
          portée de main pendant la séance.
        </li>
        <li>
          <strong>Mangez un peu</strong> : du pain, une banane, quelque chose de simple. La
          cuisine est équipée, la cafetière à grain aussi.
        </li>
        <li>
          Vertiges, nausées, cœur qui s&apos;emballe : on arrête et on se repose. Le décrassage doit
          rester agréable.
        </li>
      </ul>

      <h2>La séance de décrassage (30 minutes)</h2>
      <ul>
        <li>
          <strong>10 à 15 minutes de cardio très facile</strong> sur le vélo elliptique ou le
          rameur Concept2. Vous devez pouvoir parler sans effort. Si le rameur paraît trop
          dur, l&apos;elliptique suffit.
        </li>
        <li>
          <strong>Mobilité, 10 minutes</strong> : passages d&apos;épaules au bâton, chat-vache à
          quatre pattes, squat profond tenu en s&apos;accrochant à la cage, fente basse 30 secondes
          par côté.
        </li>
        <li>
          <strong>Un peu de renforcement léger</strong> si l&apos;envie revient : 2 tours de 10
          goblet squats avec un bumper de 5 kg, 10 tirages à la poulie basse, 20 secondes de
          gainage.
        </li>
        <li>
          <strong>Étirements dans la salle zen</strong>, sur les tapis de yoga, en respirant
          lentement : 5 minutes.
        </li>
      </ul>

      <h2>Ou dehors : la marche au parc</h2>
      <p>
        Le <strong>parc du Gué de Maulny</strong> (10 ha) est à 5 minutes à pied. Une marche de
        20 à 30 minutes au grand air, en groupe, fait souvent autant de bien que la salle, et
        personne n&apos;a besoin de se changer. Les plus en forme peuvent trottiner un tour.
      </p>

      <h2>En groupe : le décrassage collectif</h2>
      <p>
        Après un mariage ou un week-end entre amis, on peut faire la séance ensemble : un
        groupe dans la salle de sport (elliptique et rameur à tour de rôle, mobilité sur les
        tapis), l&apos;autre en marche au parc, puis on inverse. On finit tous autour de la grande
        table de la cuisine, 16 places assises, 20 avec les mini-tables de la véranda, pour un
        brunch.
      </p>

      <h2>Le reste de la matinée</h2>
      <ul>
        <li>
          <strong>Une douche</strong> dans sa propre salle de douche : 9 chambres, 9 douches, pas
          d&apos;attente même à 20.
        </li>
        <li>
          <strong>Une sieste</strong> si besoin : les volets roulants des chambres font le noir
          complet, même en plein jour.
        </li>
        <li>
          <strong>Le départ</strong> se fait avant 11 h ; un départ tardif est possible sur
          demande, en supplément et selon les disponibilités. Pratique le lendemain d&apos;un
          mariage.
        </li>
      </ul>

      <h2>Bon à savoir</h2>
      <ul>
        <li>
          La maison accueille des familles et des groupes, mais <strong>ce n&apos;est pas une salle
          de fête</strong> : pas de soirée ni de fête bruyante sur place. La soirée se passe en
          ville ou à la salle de réception, la nuit et le lendemain à la maison.
        </li>
        <li>
          La salle de sport s&apos;utilise sans encadrement, sous la responsabilité de chacun ; les
          mineurs avec un adulte.
        </li>
        <li>
          Pour une séance plus complète les jours suivants, voir{" "}
          <Link href="/fr/blog/entrainements-salle-de-sport-le-mans">
            nos séances seul ou à plusieurs
          </Link>{" "}
          et{" "}
          <Link href="/fr/blog/recuperation-apres-effort-le-mans">
            notre routine de récupération
          </Link>
          .
        </li>
      </ul>
      <ExerciseGuide locale="fr" ids={["rowing", "goblet-squat", "seated-cable-row", "plank"]} />
    </>
  );
}
