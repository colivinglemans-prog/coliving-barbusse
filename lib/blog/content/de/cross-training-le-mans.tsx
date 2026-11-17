import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Olympiastange, Bumper Plates, stoßdämpfender Boden, Concept2-Rudergerät, Medizinball,
        Box und Klimmzugstange: Alles, was man für ein WOD braucht, finden Sie in{" "}
        <Link href="/de/blog/salle-de-sport-privee-le-mans">dem Fitnessraum des Hauses</Link>
        . Wenn Sie Cross-Training betreiben (oder CrossFit in Ihrer gewohnten Box), müssen Sie
        während Ihres Aufenthalts in Le Mans nicht pausieren. Hier sind die Ausstattung und
        sechs WODs, die für diesen Raum entwickelt wurden, allein oder im Team.
      </p>

      <h2>Die Ausstattung einer Box, im Haus</h2>
      <ul>
        <li>
          <strong>Gewichtheben</strong>: 20 kg schwere Olympiastange, 165 kg Bumper Plates
          (185 kg mit Stange), Verschlüsse, Gürtel.
        </li>
        <li>
          <strong>Ein Boden aus 20 mm starken Gummimatten</strong>: Man lässt die Stange über
          Kopf oder nach einem Kreuzheben fallen, wie in der Box.
        </li>
        <li>
          <strong>Gymnastics</strong>: Klimmzugstange und Dipgriffe am Rack.
        </li>
        <li>
          <strong>Monostructural</strong>: Concept2-Rudergerät, Springseil, Crosstrainer.
        </li>
        <li>
          <strong>Funktionell</strong>: 6 kg schwerer Medizinball, Holzbox verstellbar von 20
          bis 50 cm, mit Gusseisenscheiben beladene Kurzhanteln, Kabelzug.
        </li>
      </ul>
      <p>
        Was es nicht gibt: weder Ringe noch Kettlebells, weder Kletterseil noch Assault Bike.
        Die WODs unten kommen ohne sie aus.
      </p>

      <h2>Sechs WODs für diesen Raum</h2>

      <h3>1. „Barbusse“ — For Time, allein</h3>
      <p>21-15-9 Wiederholungen von:</p>
      <ul>
        <li>Thruster mit der Langhantel (moderates Gewicht)</li>
        <li>Klimmzüge</li>
      </ul>
      <p>Danach 500 m Rudern. Time Cap: 15 Minuten.</p>

      <h3>2. AMRAP über 20 Minuten</h3>
      <ul>
        <li>250 m Rudern</li>
        <li>15 Thruster mit dem Medizinball</li>
        <li>10 Box Jumps (50 cm, oder Step-ups)</li>
        <li>5 Klimmzüge</li>
      </ul>

      <h3>3. EMOM über 16 Minuten</h3>
      <ul>
        <li>Ungerade Minute: 3 Power Cleans, schwer, aber sauber.</li>
        <li>Gerade Minute: 12 Kalorien auf dem Rudergerät.</li>
      </ul>

      <h3>4. Kraft, dann Metcon</h3>
      <ul>
        <li>
          <strong>Kraft</strong>: Back Squat 5-5-3-3-1, aufsteigend bis zu einem schweren
          Tagesgewicht.
        </li>
        <li>
          <strong>Metcon</strong>: 3 Runden mit 400 m Rudern, 15 Dips, 50 Seilsprüngen.
        </li>
      </ul>

      <h3>5. Zu zweit, „You go, I go“</h3>
      <p>
        10 geteilte Runden: Partner A rudert 250 m, während B die Langhantel in der oberen
        Position des Kreuzhebens hält; dann wird getauscht. Danach 50 Thruster mit dem
        Medizinball, frei untereinander aufgeteilt.
      </p>

      <h3>6. Team-WOD, 4 bis 8 Personen</h3>
      <p>
        Eine Stange, ein Rudergerät, eine Box: Das Team teilt sich 2.000 m Rudern, 100 Thruster
        mit dem Medizinball, 80 Box Jumps, 60 Kreuzheben und 40 Klimmzüge, in beliebiger
        Reihenfolge, immer nur eine Person pro Station. Die Uhr stoppt, wenn alles erledigt
        ist. Die anderen feuern an.
      </p>

      <h2>Die wichtigsten Regeln</h2>
      <ul>
        <li>
          <strong>Aufwärmen</strong>: 5 Minuten Rudern, Mobilität mit dem Stab, dann die leere
          Stange für die Gewichthebebewegungen.
        </li>
        <li>
          <strong>Angepasste Gewichte</strong>: Beim Cross-Training geht die Technik vor der
          Zeit. Niemand betreut Sie: Reduzieren Sie bei Bedarf Gewicht oder Wiederholungen.
        </li>
        <li>
          <strong>Nur Bumper Plates</strong>, wenn Sie die Stange fallen lassen; Gusseisen und
          Kurzhanteln werden auf dem Boden abgelegt.
        </li>
        <li>
          <strong>Minderjährige</strong> trainieren mit einem Erwachsenen.
        </li>
        <li>
          <strong>Aufräumen</strong>: Stangen, Scheiben und Box nach dem Training.
        </li>
      </ul>

      <h2>Nach dem WOD</h2>
      <p>
        Dusche im eigenen Zimmer, Essen am großen Tisch und ein paar Minuten Dehnen im
        Zen-Raum. Siehe{" "}
        <Link href="/de/blog/recuperation-apres-effort-le-mans">unsere Regenerationsroutine</Link>{" "}
        und, für klassischere Einheiten,{" "}
        <Link href="/de/blog/entrainements-salle-de-sport-le-mans">
          unsere Trainingseinheiten allein oder in der Gruppe
        </Link>
        .
      </p>

      <h2>Praktisches</h2>
      <ul>
        <li>
          Das Haus wird nur komplett vermietet: 9 Zimmer mit Duschbad, bis zu 20 Personen.
          Ideal für ein Box-Wochenende unter Freunden oder ein Trainingslager des Vereins.
        </li>
        <li>Der Fitnessraum steht während des ganzen Aufenthalts nur Ihrer Gruppe zur Verfügung.</li>
        <li>
          TGV-Bahnhof 15 Gehminuten entfernt, etwa 55 Minuten von Paris.
        </li>
      </ul>
      <ExerciseGuide locale="de" ids={["thruster", "pull-up", "rowing", "medicine-ball-thruster", "box-jump", "power-clean", "back-squat", "dips", "jump-rope", "deadlift"]} />
    </>
  );
}
