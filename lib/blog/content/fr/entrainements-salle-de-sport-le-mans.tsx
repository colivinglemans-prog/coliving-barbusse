import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Vous êtes à la maison pour quelques jours et la salle de sport est au fond du jardin.
        Voici des séances prêtes à suivre, seul ou à plusieurs, de 20 à 60 minutes, selon
        votre objectif : force, prise de muscle, cardio, perte de poids ou simple remise en
        route. Toutes utilisent le matériel de{" "}
        <Link href="/fr/blog/salle-de-sport-privee-le-mans">notre salle de sport privée</Link>.
      </p>

      <h2>Avant de commencer</h2>
      <ul>
        <li>
          <strong>Les charges ne sont pas imposées</strong> : elles s'expriment en effort
          ressenti. « Difficile » veut dire qu'il vous reste deux répétitions en réserve à la
          fin de la série ; « maximal », plus aucune.
        </li>
        <li>
          <strong>Échauffement commun à toutes les séances</strong> (8 à 10 minutes) : 5 minutes
          de rameur ou d'elliptique en aisance, puis 2 tours de 10 rotations d'épaules au
          bâton, 10 squats au poids du corps, 10 fentes, 10 pompes, 20 secondes de gainage.
        </li>
        <li>
          <strong>Sans encadrement</strong> : la salle s'utilise sous votre responsabilité.
          Montez les charges progressivement, faites-vous parer au banc, et en cas de doute sur
          votre santé, demandez l'avis d'un médecin avant de vous lancer. Les mineurs
          s'entraînent avec un adulte.
        </li>
        <li>
          <strong>Le sol est fait pour lâcher une barre chargée de bumpers</strong> (dalles
          caoutchouc de 20 mm) ; la fonte et les haltères se reposent.
        </li>
      </ul>

      <h2>Séances en solo</h2>

      <h3>Force (60 minutes)</h3>
      <ul>
        <li>
          <strong>Back squat</strong> dans la cage : 5 séries de 5, difficile, 2 à 3 minutes de
          repos.
        </li>
        <li>
          <strong>Développé couché</strong> sur le banc, dans la cage avec les sécurités : 5 × 5.
        </li>
        <li>
          <strong>Tractions</strong> à la barre de la cage : 4 séries au maximum moins une
          répétition (avec élastique pour aider si besoin).
        </li>
        <li>
          <strong>Tirage horizontal à la poulie basse</strong>, poignée de tirage à prises parallèles : 3 × 10.
        </li>
        <li>Finir par 3 × 30 secondes de gainage.</li>
      </ul>

      <h3>Prise de muscle, haut du corps (50 minutes)</h3>
      <ul>
        <li>Développé couché incliné : 4 × 8 à 10.</li>
        <li>Tirage vertical à la poulie haute, barre large : 4 × 10 à 12.</li>
        <li>Développé militaire à la barre, debout : 3 × 8.</li>
        <li>Dips : 3 séries au maximum moins deux.</li>
        <li>Extensions triceps à la poulie, corde ou barre droite courte : 3 × 12 à 15.</li>
        <li>Rowing à un bras à la poulie basse, poignée simple : 3 × 10 par bras.</li>
        <li>Curl biceps à la poulie basse, barre droite courte ou corde : 3 × 12.</li>
      </ul>

      <h3>Prise de muscle, bas du corps (50 minutes)</h3>
      <ul>
        <li>Squat avant ou back squat : 4 × 8.</li>
        <li>Soulevé de terre jambes tendues à la barre : 4 × 10.</li>
        <li>Fentes marchées aux haltères : 3 × 10 par jambe.</li>
        <li>Step-up sur la box (30 à 40 cm) : 3 × 10 par jambe.</li>
        <li>Mollets debout, barre sur le dos : 4 × 15.</li>
      </ul>

      <h3>Cardio au rameur (35 minutes)</h3>
      <ul>
        <li>
          <strong>8 × 500 m</strong> sur le Concept2, à une allure soutenue et régulière, 1 min
          30 de repos entre chaque. Notez votre temps moyen : c'est votre repère pour la
          prochaine fois.
        </li>
        <li>
          Variante endurance : <strong>30 minutes à l'elliptique</strong> à une intensité qui
          permet encore de parler.
        </li>
      </ul>

      <h3>Brûle-graisses (AMRAP de 20 minutes)</h3>
      <p>Autant de tours que possible en 20 minutes, à un rythme que vous pouvez tenir :</p>
      <ul>
        <li>10 thrusters à la médecine-ball (6 kg)</li>
        <li>10 box jumps (ou step-ups) sur la box</li>
        <li>50 sauts à la corde</li>
        <li>200 m de rameur</li>
      </ul>

      <h3>Remise en route du voyageur d'affaires (30 minutes)</h3>
      <p>
        Pour qui sort d'une journée de réunion ou de chantier et n'a ni l'énergie ni
        l'envie d'une grosse séance : 10 minutes d'elliptique, puis 3 tours de 12
        goblet squats avec un bumper de 5 ou 10 kg, 12 tirages à la poulie basse, 10 pompes et 30 secondes
        de gainage. Finir par 5 minutes d'étirements dans la salle zen.
      </p>

      <h3>Mobilité (20 minutes)</h3>
      <p>
        Pour les jours de repos ou les dos raidis par la route : passages d'épaules au bâton,
        squat profond tenu en s'accrochant à la cage, ouvertures de hanches sur le tapis,
        rotations d'épaules à l'élastique, puis étirements. Le détail est dans{" "}
        <Link href="/fr/blog/recuperation-apres-effort-le-mans">
          notre article sur la récupération
        </Link>
        .
      </p>

      <h2>Séances à plusieurs</h2>

      <h3>À deux : « je travaille, tu récupères » (40 minutes)</h3>
      <p>
        Un seul partenaire travaille à la fois, l'autre récupère ; on change à chaque
        série. 5 tours de :
      </p>
      <ul>
        <li>250 m de rameur (le partenaire fait du gainage pendant ce temps) ;</li>
        <li>8 soulevés de terre à la barre, à une charge commune ;</li>
        <li>10 thrusters à la médecine-ball.</li>
      </ul>

      <h3>Circuit en stations pour 6 à 10 personnes (45 minutes)</h3>
      <p>
        Chaque personne démarre à une station ; 40 secondes d'effort, 20 secondes pour
        changer. Deux ou trois tours selon le niveau.
      </p>
      <ol>
        <li>Rameur</li>
        <li>Vélo elliptique</li>
        <li>Thrusters à la médecine-ball</li>
        <li>Box jumps ou step-ups</li>
        <li>Corde à sauter</li>
        <li>Tirage à la poulie haute</li>
        <li>Tractions ou dips (avec élastique si besoin)</li>
        <li>Goblet squats avec un bumper</li>
        <li>Gainage sur le tapis</li>
        <li>Pompes</li>
      </ol>
      <p>
        À plus de 10, faites deux groupes : l'un dans la salle, l'autre en footing au
        parc du Gué de Maulny, à 5 minutes à pied, et on inverse.
      </p>

      <h3>Relais d'équipe au rameur</h3>
      <p>
        Le défi qui réunit tout le monde : <strong>5 000 m à l'équipe</strong>, en relais de
        250 m, le plus vite possible. On note le temps sur une feuille, et on recommence le
        dernier jour du séjour pour voir qui a progressé.
      </p>

      <h3>Réveil musculaire de séminaire (20 minutes, tous niveaux)</h3>
      <p>
        Avant la première réunion, pour une équipe qui ne s'entraîne pas forcément : 5 minutes
        de rameur ou d'elliptique chacun son tour, puis 2 tours de 10 squats, 10 pompes contre
        la box, 10 tirages à l'élastique et 20 secondes de gainage, puis 5 minutes
        d'étirements. Personne ne finit épuisé, tout le monde arrive réveillé.
      </p>

      <h2>Une semaine type</h2>
      <ul>
        <li>
          <strong>Week-end de 2 nuits</strong> : une séance de force ou un circuit le premier
          soir, un footing et de la mobilité le lendemain matin.
        </li>
        <li>
          <strong>Séjour d'une semaine</strong> : force lundi, cardio au rameur mardi,
          haut du corps mercredi, mobilité jeudi, bas du corps vendredi, AMRAP ou relais
          d'équipe samedi, repos dimanche.
        </li>
        <li>
          <strong>Séjour long, en mission</strong> : trois séances par semaine (force, haut du
          corps, bas du corps) et une séance de cardio suffisent pour progresser.
        </li>
      </ul>

      <h2>Et selon votre sport</h2>
      <p>
        Pour des séances adaptées à une discipline, lisez nos articles de préparation physique
        : <Link href="/fr/blog/preparation-physique-course-automobile-le-mans">course
        automobile</Link>, <Link href="/fr/blog/preparation-physique-karting-le-mans">karting</Link>,{" "}
        <Link href="/fr/blog/preparation-physique-cyclisme-le-mans">cyclisme</Link>,{" "}
        <Link href="/fr/blog/preparation-physique-roller-le-mans">roller</Link>,{" "}
        <Link href="/fr/blog/preparation-physique-course-a-pied-le-mans">course à pied</Link>,{" "}
        <Link href="/fr/blog/preparation-physique-volley-ball-le-mans">volley-ball</Link>,{" "}
        <Link href="/fr/blog/preparation-physique-handball-le-mans">handball</Link> et{" "}
        <Link href="/fr/blog/preparation-physique-equitation-le-mans">équitation</Link>.
      </p>
      <ExerciseGuide locale="fr" ids={["back-squat", "front-squat", "goblet-squat", "bench-press", "incline-bench-press", "overhead-press", "romanian-deadlift", "deadlift", "pull-up", "dips", "push-up", "seated-cable-row", "single-arm-cable-row", "lat-pulldown", "triceps-pushdown", "cable-curl", "walking-lunge", "step-up", "calf-raise", "medicine-ball-thruster", "box-jump", "jump-rope", "rowing", "plank"]} />
    </>
  );
}
