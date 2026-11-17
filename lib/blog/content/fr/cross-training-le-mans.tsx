import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Barre olympique, bumpers, sol amortissant, rameur Concept2, médecine-ball, box et barre de
        traction : tout ce qu'il faut pour un WOD est dans{" "}
        <Link href="/fr/blog/salle-de-sport-privee-le-mans">la salle de sport de la maison</Link>
        . Si vous pratiquez le cross-training (ou le CrossFit dans votre box habituelle), vous
        ne perdrez pas le fil pendant votre séjour au Mans. Voici le matériel, et six WOD
        pensés pour cette salle, seul ou en équipe.
      </p>

      <h2>Le matériel d'une box, à la maison</h2>
      <ul>
        <li>
          <strong>Haltérophilie</strong> : barre olympique de 20 kg, 165 kg de bumpers (185 kg
          barre comprise), pinces, ceinture.
        </li>
        <li>
          <strong>Un sol en dalles caoutchouc de 20 mm</strong> : on lâche la barre au-dessus
          de la tête ou après un soulevé de terre, comme en box.
        </li>
        <li>
          <strong>Gymnastique</strong> : barre de traction et barres de dips sur la cage.
        </li>
        <li>
          <strong>Monostructural</strong> : rameur Concept2, corde à sauter, vélo elliptique.
        </li>
        <li>
          <strong>Fonctionnel</strong> : médecine-ball de 6 kg, box en bois réglable de 20 à 50 cm,
          haltères chargés à la fonte, poulie.
        </li>
      </ul>
      <p>
        Ce qu'il n'y a pas : ni anneaux, ni kettlebells, ni corde à grimper, ni
        assault bike. Les WOD ci-dessous s'en passent.
      </p>

      <h2>Six WOD pour cette salle</h2>

      <h3>1. « Barbusse » — For time, seul</h3>
      <p>21-15-9 répétitions de :</p>
      <ul>
        <li>Thrusters à la barre (charge modérée)</li>
        <li>Tractions</li>
      </ul>
      <p>Puis 500 m de rameur. Plafond de temps : 15 minutes.</p>

      <h3>2. AMRAP de 20 minutes</h3>
      <ul>
        <li>250 m de rameur</li>
        <li>15 thrusters à la médecine-ball</li>
        <li>10 box jumps (50 cm, ou step-ups)</li>
        <li>5 tractions</li>
      </ul>

      <h3>3. EMOM de 16 minutes</h3>
      <ul>
        <li>Minute impaire : 3 power cleans (épaulés en puissance), lourds mais propres.</li>
        <li>Minute paire : 12 calories au rameur.</li>
      </ul>

      <h3>4. Force puis metcon</h3>
      <ul>
        <li>
          <strong>Force</strong> : back squat 5-5-3-3-1, en montant jusqu'à une charge
          lourde du jour.
        </li>
        <li>
          <strong>Metcon</strong> : 3 tours de 400 m de rameur, 15 dips, 50 sauts à la corde.
        </li>
      </ul>

      <h3>5. À deux, « you go, I go »</h3>
      <p>
        10 tours partagés : le partenaire A rame 250 m pendant que B tient la barre en position
        haute du soulevé de terre ; on échange. Puis 50 thrusters à la médecine-ball à se partager comme on veut.
      </p>

      <h3>6. Team WOD, 4 à 8 personnes</h3>
      <p>
        Une seule barre, un seul rameur, une seule box : l'équipe se partage 2 000 m de rameur,
        100 thrusters à la médecine-ball, 80 box jumps, 60 soulevés de terre et 40 tractions, dans l'ordre
        qu'elle veut, une seule personne par atelier à la fois. Le chrono s'arrête quand
        tout est fait. Les autres encouragent.
      </p>

      <h2>Les bonnes pratiques</h2>
      <ul>
        <li>
          <strong>Échauffement</strong> : 5 minutes de rameur, mobilité au bâton, puis la barre
          à vide pour les mouvements d'haltérophilie.
        </li>
        <li>
          <strong>Charges adaptées</strong> : en cross-training, la technique passe avant le
          chrono. Personne ne vous encadre : réduisez la charge ou les répétitions si besoin.
        </li>
        <li>
          <strong>Bumpers seulement</strong> pour lâcher la barre ; la fonte et les haltères se
          reposent au sol.
        </li>
        <li>
          <strong>Les mineurs</strong> s'entraînent avec un adulte.
        </li>
        <li>
          <strong>Ranger</strong> barres, disques et box après la séance.
        </li>
      </ul>

      <h2>Après le WOD</h2>
      <p>
        Douche dans sa chambre, repas à la grande table, et quelques minutes d'étirements
        dans la salle zen. Voir{" "}
        <Link href="/fr/blog/recuperation-apres-effort-le-mans">notre routine de récupération</Link>{" "}
        et, pour des séances plus classiques,{" "}
        <Link href="/fr/blog/entrainements-salle-de-sport-le-mans">
          nos entraînements seul ou à plusieurs
        </Link>
        .
      </p>

      <h2>Pratique</h2>
      <ul>
        <li>
          La maison se loue entière : 9 chambres avec salle de douche, jusqu'à 20
          personnes. Idéal pour un week-end de box entre amis ou un stage de club.
        </li>
        <li>La salle est réservée à votre groupe pendant tout le séjour.</li>
        <li>
          Gare TGV à 15 minutes à pied, à environ 55 minutes de Paris.
        </li>
      </ul>
      <ExerciseGuide locale="fr" ids={["thruster", "pull-up", "rowing", "medicine-ball-thruster", "box-jump", "power-clean", "back-squat", "dips", "jump-rope", "deadlift"]} />
    </>
  );
}
