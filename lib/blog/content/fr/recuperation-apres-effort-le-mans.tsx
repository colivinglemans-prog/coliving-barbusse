import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Un match, une course, une journée de stage ou un relais de nuit : ce que vous faites
        dans les heures qui suivent compte autant que l'effort lui-même, surtout quand une
        autre épreuve vous attend le lendemain. Voici une routine de récupération à suivre à
        la maison, avec la salle de sport, la salle zen et le reste de la maison.
      </p>

      <h2>Dans la demi-heure qui suit : redescendre</h2>
      <ul>
        <li>
          <strong>10 minutes de retour au calme</strong> sur le vélo elliptique ou le rameur
          Concept2, à une allure très facile, où l'on peut parler sans effort. On aide le
          corps à redescendre au lieu de s'effondrer sur le canapé.
        </li>
        <li>
          <strong>Boire</strong> et manger un premier en-cas : la cuisine est équipée, il suffit
          d'avoir prévu les courses.
        </li>
        <li>
          <strong>Une douche</strong> : chaque chambre a sa propre salle de douche, il n'y a pas
          de file d'attente même à 20.
        </li>
      </ul>

      <h2>La routine de mobilité (20 minutes)</h2>
      <p>
        À faire dans la salle zen, sur les tapis de yoga, ou dans la salle de sport sur les
        tapis de sol :
      </p>
      <ul>
        <li>
          <strong>Épaules</strong> : passages d'épaules au bâton, de l'avant vers
          l'arrière, 2 × 10 ; puis rotations externes à l'élastique, 2 × 15, sans charge
          lourde.
        </li>
        <li>
          <strong>Dos</strong> : chat-vache à quatre pattes, 10 fois lentement ; puis
          suspension à la barre de traction, 2 × 20 secondes, pieds au sol si besoin, pour
          décomprimer.
        </li>
        <li>
          <strong>Hanches</strong> : squat profond tenu 1 minute en s'accrochant à la cage,
          fente basse 45 secondes par côté, posture du pigeon 1 minute par côté.
        </li>
        <li>
          <strong>Jambes</strong> : ischio-jambiers à l'élastique, allongé sur le dos, 45
          secondes par jambe ; mollets contre le mur, 45 secondes par jambe.
        </li>
        <li>
          <strong>Cou</strong> (après une course ou un long trajet) : inclinaisons et rotations
          lentes, 5 par côté.
        </li>
      </ul>

      <h2>Le repas d'équipe</h2>
      <p>
        Après l'effort, il faut des glucides pour refaire les réserves et des protéines pour
        les muscles. La grande table de la cuisine compte <strong>16 places assises, 20</strong>{" "}
        en rapprochant les mini-tables de la véranda : toute l'équipe mange ensemble, à
        l'heure qui lui convient, ce que l'on cuisine soi-même. La cuisine a deux fours, deux
        plaques, de grandes casseroles et de la vaisselle pour 20.
      </p>

      <h2>Le sommeil, le vrai levier</h2>
      <ul>
        <li>
          <strong>Une chambre par personne ou par binôme</strong>, chacune avec sa porte et sa
          clé : on ne se réveille pas au retour du dernier.
        </li>
        <li>
          <strong>Des volets roulants qui font le noir complet</strong>, même en plein jour :
          indispensable pour les équipes de nuit et les pilotes qui dorment entre deux relais.
          Voir aussi{" "}
          <Link href="/fr/blog/equipe-de-nuit-le-mans">notre article sur les équipes de nuit</Link>
          .
        </li>
        <li>
          <strong>Une maison dans un quartier résidentiel calme</strong>.
        </li>
      </ul>

      <h2>Le lendemain matin</h2>
      <ul>
        <li>
          <strong>Décrassage</strong> : 20 minutes de footing très lent au parc du Gué de
          Maulny, à 5 minutes à pied, ou 20 minutes d'elliptique si les jambes sont
          lourdes.
        </li>
        <li>
          <strong>Mobilité</strong> : la même routine qu'hier soir, en version courte.
        </li>
        <li>
          <strong>Pas de séance lourde</strong> le lendemain d'une compétition : la force se
          reprend deux jours plus tard.
        </li>
      </ul>

      <h2>Les tenues propres pour le lendemain</h2>
      <p>
        Un tournoi de deux jours, c'est deux jeux de tenues. La maison a un{" "}
        <strong>lave-linge et un sèche-linge</strong> : les maillots du samedi sont prêts pour
        le dimanche.
      </p>

      <h2>Pratique</h2>
      <ul>
        <li>
          La salle de sport, la salle zen et le jardin sont compris dans la location de la
          maison entière. Le détail du matériel est dans{" "}
          <Link href="/fr/blog/salle-de-sport-privee-le-mans">
            notre article sur la salle de sport
          </Link>
          .
        </li>
        <li>
          Ces conseils ne remplacent pas ceux de votre kiné ou de votre médecin, en cas de
          douleur ou de blessure.
        </li>
        <li>
          Pour vous entraîner pendant le séjour, voir{" "}
          <Link href="/fr/blog/entrainements-salle-de-sport-le-mans">
            nos séances, seul ou à plusieurs
          </Link>
          .
        </li>
      </ul>
      <ExerciseGuide locale="fr" ids={["rowing", "band-external-rotation"]} />
    </>
  );
}
