import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Handball reiht Sprints, Zweikämpfe, Richtungswechsel und Sprungwürfe aneinander: ein
        Kontaktsport, der die Knie und die Schulter des Wurfarms beansprucht. Im August 2026 hat
        eine Frauen-Handballmannschaft ein Turnierwochenende im Haus verbracht, zu neunzehnt mit
        ihrem Betreuerstab. So nutzen Sie{" "}
        <Link href="/de/blog/salle-de-sport-privee-le-mans">den Fitnessraum des Hauses</Link>{" "}
        zur Vorbereitung auf ein Spiel oder ein Trainingslager.
      </p>

      <h2>Was Handball verlangt</h2>
      <ul>
        <li>
          <strong>Explosivität</strong>: Antritte, Sprünge, Schritte.
        </li>
        <li>
          <strong>Geschützte Knie</strong>: Landungen und Richtungswechsel sind das größte
          Verletzungsrisiko.
        </li>
        <li>
          <strong>Eine stabile Wurfschulter</strong>, vor allem an der Rückseite der Schulter.
        </li>
        <li>
          <strong>Einen starken Rumpf</strong> für die Zweikämpfe.
        </li>
      </ul>

      <h2>Die Kraft- und Explosivitätseinheit (50 Minuten)</h2>
      <ul>
        <li>
          <strong>Box Jumps</strong>: 4 × 4, leise Landung, Knie in Linie mit den Füßen.
        </li>
        <li>
          <strong>Back Squat</strong>: 4 × 5.
        </li>
        <li>
          <strong>Rumänisches Kreuzheben</strong>: 3 × 8, für die hinteren Oberschenkel, die
          das Knie schützen.
        </li>
        <li>
          <strong>Walking Lunges</strong> mit Kurzhanteln: 3 × 8 pro Bein.
        </li>
        <li>
          <strong>Bankdrücken</strong>: 3 × 6.
        </li>
        <li>
          <strong>Klimmzüge</strong>: 3 Sätze mit maximal möglichen Wiederholungen minus eins.
        </li>
        <li>
          <strong>Thruster mit dem Medizinball</strong>: 3 × 10, explosiver Druck.
        </li>
      </ul>

      <h2>Prävention, vor jeder Einheit (15 Minuten)</h2>
      <ul>
        <li>
          <strong>Schulter</strong>: Außenrotationen mit dem Widerstandsband 3 × 15, Face Pull
          mit dem Seil 3 × 15.
        </li>
        <li>
          <strong>Knie</strong>: einbeinige Landungen von der niedrigen Box (20 cm), 3 × 5 pro
          Bein, Landung 2 Sekunden halten, Knie in der Achse.
        </li>
        <li>
          <strong>Adduktoren</strong>: Copenhagen Plank, 2 × 20 s pro Seite.
        </li>
        <li>
          <strong>Rumpf</strong>: Seitstütz, 2 × 30 s pro Seite.
        </li>
      </ul>

      <h2>Der Teamzirkel</h2>
      <p>
        Für ein Team von 14 bis 16 Spielerinnen oder Spielern: zwei Gruppen. Die erste macht
        den Stationszirkel im Fitnessraum (Rudergerät, Box Jumps, Thruster mit dem Medizinball,
        Kabelzug, Klimmzüge, Plank, Springseil, Ausfallschritte), die zweite geht joggen im
        Park Gué de Maulny, 5 Gehminuten entfernt. Nach 20 Minuten wird getauscht.
      </p>

      <h2>Das Turnierwochenende</h2>
      <ul>
        <li>
          <strong>Am Morgen des Spiels</strong>: 15 Minuten Aktivierung (Crosstrainer,
          Prävention für Schulter und Knie), dann Abfahrt zur Halle.
        </li>
        <li>
          <strong>Zwischen zwei Spielen</strong>: Teamessen am großen Tisch mit 16 bis 20
          Plätzen, Trikots in die Waschmaschine.
        </li>
        <li>
          <strong>Abends</strong>:{" "}
          <Link href="/de/blog/recuperation-apres-effort-le-mans">Regenerationsroutine</Link>{" "}
          und eine richtige Nacht, jeder in seinem Zimmer.
        </li>
      </ul>

      <h2>Praktisches für einen Verein</h2>
      <ul>
        <li>
          Die Antarès-Halle, in der auch Handballspiele stattfinden, ist mit der
          Straßenbahnlinie T1 direkt vom Bahnhof aus erreichbar, 15 Gehminuten vom Haus
          entfernt.
        </li>
        <li>
          9 Zimmer mit Duschbad, bis zu 20 Personen; 10- bis 17-Jährige unter der
          Verantwortung ihrer Betreuer, Minderjährige im Fitnessraum mit einem Erwachsenen.
        </li>
        <li>Zahlung per Rechnung auf den Namen des Vereins möglich.</li>
      </ul>
      <p>
        Mehr Infos in{" "}
        <Link href="/de/blog/equipe-sportive-le-mans">unserem Artikel für Sportmannschaften</Link>
        .
      </p>
      <ExerciseGuide locale="de" ids={["box-jump", "back-squat", "romanian-deadlift", "walking-lunge", "bench-press", "pull-up", "medicine-ball-thruster", "band-external-rotation", "face-pull", "copenhagen-plank", "side-plank"]} />
    </>
  );
}
