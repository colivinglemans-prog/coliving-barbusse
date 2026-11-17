import Image from "next/image";
import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Au fond du jardin, dans une annexe indépendante de la maison, une vraie salle de
        musculation et de cross-training vous attend : cage à squat, barre olympique, 185 kg
        de charge, poulie, rameur Concept2 et vélo elliptique. Elle est réservée à votre
        groupe pendant tout le séjour. Voici ce qu'elle contient, ce qu'on peut y faire, et
        pour qui elle change le séjour.
      </p>

      <h2>Une salle à part, réservée à votre groupe</h2>
      <p>
        La salle n'est pas un coin de garage avec deux haltères : c'est une pièce dédiée,
        séparée de la maison, au <strong>sol couvert de dalles amortissantes en caoutchouc de
        20 mm</strong>, les mêmes que dans les salles de cross-training. On peut y{" "}
        <strong>lâcher une barre chargée de bumpers</strong> après un soulevé de terre ou un
        épaulé-jeté, sans abîmer le sol ni réveiller la maison. Comme la maison se loue
        entière, la salle n'est partagée avec personne d'autre que votre groupe.
      </p>

      <h2>L'équipement, zone par zone</h2>

      <h3>La force : cage, barre et bumpers</h3>
      <ul>
        <li>
          <strong>Une cage à squat</strong> avec barre de traction, barres de dips et
          chandelles réglables : squat, développé couché, développé militaire, tractions,
          dips, en sécurité.
        </li>
        <li>
          <strong>Une barre olympique de 20 kg</strong> (2,20 m), avec un manchon de protection
          pour le squat et deux pinces.
        </li>
        <li>
          <strong>165 kg de bumpers</strong>, de 2,5 à 25 kg : <strong>jusqu'à 185 kg
          sur la barre</strong>. De quoi travailler lourd au squat et au soulevé de terre.
        </li>
        <li>
          <strong>Un banc de musculation réglable</strong> (plat, incliné) et une{" "}
          <strong>ceinture d'haltérophilie</strong>.
        </li>
      </ul>

      <figure className="my-8">
        <Image
          src="/images/blog/salle-de-sport/cage-powergym.jpg"
          alt="La cage à squat de la salle : barre de traction, barres de dips, chandelles et poulie haute et basse"
          width={772}
          height={772}
          sizes="(max-width: 768px) 100vw, 512px"
          className="mx-auto w-full max-w-md rounded-xl bg-white"
        />
        <figcaption className="mt-2 text-center text-sm text-secondary">
          La cage de la salle, avec sa poulie haute et basse (photo : Powergym).
        </figcaption>
      </figure>

      <figure className="my-8">
        <Image
          src="/images/blog/entrainement-salle-de-sport.jpg"
          alt="La salle de sport : la cage, le banc de musculation, les bumpers rangés et la ceinture d'haltérophilie"
          width={1920}
          height={1280}
          sizes="(max-width: 768px) 100vw, 768px"
          className="w-full rounded-xl"
        />
        <figcaption className="mt-2 text-center text-sm text-secondary">
          Le banc, les bumpers rangés et la ceinture, à côté de la cage.
        </figcaption>
      </figure>

      <h3>La poulie et les haltères</h3>
      <ul>
        <li>
          <strong>Une poulie haute et basse</strong> montée sur la cage, avec cinq poignées :
          une poignée de tirage à prises parallèles, une corde à triceps, une barre large pour les dorsaux, une poignée simple
          pour travailler un bras à la fois et une barre droite courte. Tirage vertical, tirage
          horizontal, extensions, curls, rotations d'épaule.
        </li>
        <li>
          <strong>60 kg de disques en fonte</strong> (de 1 à 10 kg) pour charger la poulie ou
          les haltères, au kilo près.
        </li>
      </ul>

      <h3>Le cardio</h3>
      <ul>
        <li>
          <strong>Un rameur Concept2</strong>, la référence des salles et des clubs d'aviron :
          fractionné, endurance, défis chronométrés.
        </li>
        <li>
          <strong>Un vélo elliptique NordicTrack</strong>, sans impact pour les articulations.
        </li>
        <li>
          <strong>Une corde à sauter</strong>.
        </li>
      </ul>

      <h3>Le cross-training, le poids du corps et la mobilité</h3>
      <ul>
        <li>
          <strong>Une médecine-ball de 6 kg</strong> et une <strong>box de saut en bois</strong>{" "}
          réglable de 20 à 50 cm.
        </li>
        <li>
          <strong>Des élastiques</strong>, un <strong>bâton de mobilité</strong> et des{" "}
          <strong>tapis de sol</strong> pour l'échauffement, le gainage et les étirements.
        </li>
      </ul>

      <h2>Ce qu'on peut y faire</h2>
      <figure className="my-8">
        <Image
          src="/images/blog/salle-de-sport/cage-exercices-powergym.jpg"
          alt="Exemples d'exercices sur la cage : squat, tractions, tirage vertical, dips, tirage à la poulie basse"
          width={772}
          height={772}
          sizes="(max-width: 768px) 100vw, 640px"
          className="mx-auto w-full max-w-xl rounded-xl bg-white"
        />
        <figcaption className="mt-2 text-center text-sm text-secondary">
          Squat, tractions, dips, tirages : ce que permet la même cage (photo : Powergym).
        </figcaption>
      </figure>

      <ul>
        <li>
          <strong>Gagner en force</strong> : squat, soulevé de terre, développé couché,
          tractions lestées, avec des charges sérieuses.
        </li>
        <li>
          <strong>Prendre du muscle</strong> : barre, poulie et haltères pour travailler chaque
          groupe musculaire, du dos aux triceps.
        </li>
        <li>
          <strong>Améliorer son cardio</strong> : fractionné au rameur, endurance à
          l'elliptique, corde à sauter.
        </li>
        <li>
          <strong>Brûler des calories</strong> : circuits et AMRAP mêlant médecine-ball, box jump,
          corde et rameur.
        </li>
        <li>
          <strong>Préparer une compétition</strong> : renforcement propre à votre sport,
          prévention des blessures, activation le matin de l'épreuve.
        </li>
        <li>
          <strong>Récupérer</strong> : retour au calme sur l'elliptique, mobilité et
          étirements, puis la salle zen.
        </li>
      </ul>
      <p>
        Nous avons rassemblé des séances prêtes à suivre, seul ou à plusieurs, dans{" "}
        <Link href="/fr/blog/entrainements-salle-de-sport-le-mans">
          notre article sur les entraînements
        </Link>
        , et une routine d'après-effort dans{" "}
        <Link href="/fr/blog/recuperation-apres-effort-le-mans">
          notre article sur la récupération
        </Link>
        .
      </p>

      <h2>Pour qui</h2>
      <ul>
        <li>
          <strong>Les équipes sportives</strong> en tournoi ou en stage : la préparation
          physique se fait à la maison, entre deux matchs. Voir{" "}
          <Link href="/fr/blog/equipe-sportive-le-mans">notre article sur les équipes sportives</Link>
          .
        </li>
        <li>
          <strong>Les pilotes et leurs équipes</strong>, venus pour le circuit : cou, gainage,
          cardio, et un réveil musculaire le matin de la course.
        </li>
        <li>
          <strong>Les séminaires</strong> : une séance collective de 20 minutes avant la
          première réunion réveille mieux qu'un troisième café.
        </li>
        <li>
          <strong>Les équipes en mission</strong> au Mans pour plusieurs semaines, qui ne
          veulent pas arrêter de s'entraîner.
        </li>
        <li>
          <strong>Les familles avec des ados</strong> sportifs, accompagnés d'un adulte.
        </li>
      </ul>

      <h2>La préparation physique, sport par sport</h2>
      <p>Un article par discipline, avec des séances adaptées à cette salle :</p>
      <ul>
        <li>
          <Link href="/fr/blog/preparation-physique-course-automobile-le-mans">
            Course automobile
          </Link>{" "}
          et{" "}
          <Link href="/fr/blog/preparation-physique-karting-le-mans">karting</Link> ;
        </li>
        <li>
          <Link href="/fr/blog/preparation-physique-cyclisme-le-mans">cyclisme</Link>,{" "}
          <Link href="/fr/blog/preparation-physique-roller-le-mans">roller</Link> et{" "}
          <Link href="/fr/blog/preparation-physique-course-a-pied-le-mans">course à pied</Link>{" "}
          ;
        </li>
        <li>
          <Link href="/fr/blog/preparation-physique-volley-ball-le-mans">volley-ball</Link>,{" "}
          <Link href="/fr/blog/preparation-physique-handball-le-mans">handball</Link> et{" "}
          <Link href="/fr/blog/preparation-physique-equitation-le-mans">équitation</Link>.
        </li>
      </ul>

      <h2>Avec le reste de la maison</h2>
      <ul>
        <li>
          <strong>Une salle zen avec tapis de yoga</strong> pour les étirements au calme.
        </li>
        <li>
          <strong>Le parc du Gué de Maulny</strong> (10 ha) à 5 minutes à pied, pour courir.
        </li>
        <li>
          <strong>Une salle de douche par chambre</strong> : 9 chambres, 9 douches, pas de file
          d'attente après la séance.
        </li>
        <li>
          <strong>Un lave-linge et un sèche-linge</strong> pour les tenues de sport.
        </li>
        <li>
          <strong>Une cuisine équipée</strong> et une grande table de 16 à 20 places pour les
          repas d'équipe.
        </li>
      </ul>

      <h2>Bon à savoir</h2>
      <ul>
        <li>
          <strong>Sans encadrement</strong> : la salle s'utilise sous la responsabilité de
          chacun. Échauffez-vous, choisissez des charges que vous maîtrisez, faites-vous parer
          pour les séries lourdes au banc, et rangez le matériel après la séance.
        </li>
        <li>
          <strong>Les mineurs</strong> s'entraînent accompagnés d'un adulte (parent ou
          encadrant du club).
        </li>
        <li>
          <strong>On lâche les bumpers, pas la fonte</strong> : les dalles sont faites pour une
          barre chargée de bumpers ; les disques en fonte et les haltères se reposent.
        </li>
      </ul>

      <h2>Réservez la maison et sa salle</h2>
      <p>
        La salle de sport est comprise dans la location de la maison, comme la salle zen et le
        jardin. Consultez nos <Link href="/fr#disponibilite">disponibilités en temps réel</Link>{" "}
        et réservez en direct, sans commission.
      </p>
      <ExerciseGuide locale="fr" ids={["back-squat", "deadlift", "bench-press", "pull-up", "seated-cable-row", "rowing", "medicine-ball-thruster", "box-jump"]} />
    </>
  );
}
