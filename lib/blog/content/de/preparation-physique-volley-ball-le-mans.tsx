import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Beim Volleyball springt man, schlägt, landet und fängt wieder von vorne an, hunderte
        Male pro Turnier. Ein Volleyballteam, das bei uns wohnt, kann seine Sprungkraft
        erhalten und Schultern und Knie schützen, im{" "}
        <Link href="/de/blog/salle-de-sport-privee-le-mans">Fitnessraum des Hauses</Link>
        . Hier sind die Einheiten, die wir vorschlagen, vor und während eines Turniers.
      </p>

      <h2>Was Volleyball verlangt</h2>
      <ul>
        <li>
          <strong>Sprungkraft</strong>: starke, schnelle Beine für Angriff und Block.
        </li>
        <li>
          <strong>Kontrollierte Landungen</strong>: Knie und Sprunggelenke fangen jeden Sprung
          ab.
        </li>
        <li>
          <strong>Stabile Schultern</strong>: Schmetterschlag und Aufschlag beanspruchen die
          Rotatorenmanschette.
        </li>
        <li>
          <strong>Einen stabilen Rumpf</strong>, der die Kraft der Beine auf den Arm überträgt.
        </li>
      </ul>

      <h2>Die Sprungkrafteinheit (45 Minuten)</h2>
      <ul>
        <li>
          <strong>Box Jumps</strong>: 4 × 5, Box von 40 bis 50 cm, heruntersteigen statt
          springen. Es zählt die Qualität jedes Sprungs, nicht die Ermüdung.
        </li>
        <li>
          <strong>Back Squat</strong>: 4 × 5, schwer und schnell in der Aufwärtsbewegung.
        </li>
        <li>
          <strong>Hip Thrust</strong> mit der Langhantel: 3 × 8.
        </li>
        <li>
          <strong>Walking Lunges</strong> mit Kurzhanteln: 3 × 8 pro Bein.
        </li>
        <li>
          <strong>Wadenheben im Stehen</strong>: 3 × 15.
        </li>
      </ul>

      <h2>Die Präventionseinheit „Schultern“ (20 Minuten)</h2>
      <p>Vor dem Training oder an Turniertagen, mit leichtem Widerstand:</p>
      <ul>
        <li>
          <strong>Außenrotationen mit dem Widerstandsband</strong>, Ellbogen am Körper: 3 × 15.
        </li>
        <li>
          <strong>Face Pull</strong> mit dem Seil, oberer Kabelzug: 3 × 15.
        </li>
        <li>
          <strong>Latziehen</strong> am Kabelzug, breite Stange: 3 × 12.
        </li>
        <li>
          <strong>Liegestütze</strong>: 3 × 10, Schulterblätter aktiv.
        </li>
        <li>
          <strong>Thruster mit dem Medizinball</strong>: 3 × 10, um Beine und Arme zu
          koordinieren.
        </li>
      </ul>

      <h2>Im Team: der Volleyball-Zirkel</h2>
      <p>
        Für 6 bis 12 Spieler, in Zweierteams: 40 Sekunden pro Station, 20 Sekunden zum
        Wechseln, zwei Runden. Box Jumps, Thruster mit dem Medizinball, Rudergerät, Face Pull,
        Ausfallschritte, Plank, Springseil, Rotationen mit dem Widerstandsband. Der Coach gibt
        das Tempo vor, der Raum bietet Platz für alle.
      </p>

      <h2>Während des Turniers</h2>
      <ul>
        <li>
          <strong>Morgens</strong>: 15 Minuten Aktivierung, Crosstrainer, Schulterrotationen
          mit dem Widerstandsband, ein paar Sprünge auf der Stelle.
        </li>
        <li>
          <strong>Abends</strong>: kein schweres Krafttraining;{" "}
          <Link href="/de/blog/recuperation-apres-effort-le-mans">Regenerationsroutine</Link>
          , Teamessen am großen Tisch und eine richtige Nacht.
        </li>
        <li>
          <strong>Die Trikots</strong> kommen für den nächsten Tag in Waschmaschine und
          Trockner.
        </li>
      </ul>

      <h2>Praktisches für einen Verein</h2>
      <ul>
        <li>
          9 Zimmer mit Duschbad, bis zu 20 Personen: das ganze Team mit Betreuerstab.
        </li>
        <li>
          10- bis 17-Jährige sind unter der Verantwortung ihrer volljährigen Betreuer
          willkommen; im Fitnessraum trainieren Minderjährige mit einem Erwachsenen.
        </li>
        <li>
          Die Antarès-Halle ist mit der Straßenbahnlinie T1 direkt vom Bahnhof aus erreichbar,
          15 Gehminuten vom Haus entfernt.
        </li>
        <li>Zahlung per Rechnung auf den Namen des Vereins möglich.</li>
      </ul>
      <p>
        Mehr Infos in{" "}
        <Link href="/de/blog/equipe-sportive-le-mans">unserem Artikel für Sportmannschaften</Link>
        .
      </p>
      <ExerciseGuide locale="de" ids={["box-jump", "back-squat", "hip-thrust", "walking-lunge", "calf-raise", "band-external-rotation", "face-pull", "lat-pulldown", "push-up", "medicine-ball-thruster"]} />
    </>
  );
}
