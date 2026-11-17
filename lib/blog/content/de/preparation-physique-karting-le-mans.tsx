import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Ein Kart hat weder Servolenkung noch Federung: Der Fahrer steckt die Vibrationen und
        die Querkräfte in Nacken und Rippen weg und hält in jeder Kurve ein schweres Lenkrad.
        Im Mai 2026 hat ein Kartteam aus Singapur für die SWS Karting Finals bei uns gewohnt.
        So nutzen Sie{" "}
        <Link href="/de/blog/salle-de-sport-privee-le-mans">den Fitnessraum des Hauses</Link>{" "}
        zur Vorbereitung auf ein Rennen auf der internationalen Kartbahn von Le Mans.
      </p>

      <h2>Was der Kartsport verlangt</h2>
      <ul>
        <li>
          <strong>Den Nacken</strong>, der in jeder Kurve den Helm trägt.
        </li>
        <li>
          <strong>Unterarme und Griffkraft</strong>, an einem Lenkrad ohne Servounterstützung.
        </li>
        <li>
          <strong>Rumpf und Rippen</strong>, eingekeilt im Sitz.
        </li>
        <li>
          <strong>Ausdauer</strong>: Die Herzfrequenz steigt während eines Laufs schnell an.
        </li>
      </ul>

      <h2>Die Einheit für Fahrer (45 Minuten)</h2>
      <ul>
        <li>
          <strong>Nacken</strong>: isometrisch gegen die Hand in alle vier Richtungen, 4 × 15 s;
          dann auf der Bank liegend, Kopf über den Rand hinaus, langsame Beugungen nur mit dem
          Gewicht des Kopfes, 2 × 12 pro Richtung.
        </li>
        <li>
          <strong>Griffkraft</strong>: an der Klimmzugstange hängen, 3 × 30 s; Farmer&apos;s
          Walk mit zwei Kurzhanteln, 3 × 30 m.
        </li>
        <li>
          <strong>Klimmzüge</strong>: 3 Sätze mit maximal möglichen Wiederholungen minus eins,
          bei Bedarf mit Widerstandsband als Hilfe.
        </li>
        <li>
          <strong>Rudern</strong> am unteren Kabelzug, Rudergriff mit parallelen Griffen: 3 × 12, dann einarmiges Rudern, Einhandgriff, 2 × 10 pro Arm, um beide Seiten auszugleichen.
        </li>
        <li>
          <strong>Rumpf</strong>: Pallof Press 3 × 10 pro Seite, Seitstütz 3 × 30 s pro Seite.
        </li>
        <li>
          <strong>Cardio</strong>: Concept2-Rudergerät, 6 × 2 Minuten zügig, 1 Minute locker.
        </li>
      </ul>

      <h2>Am Morgen des Rennens</h2>
      <p>
        10 bis 15 Minuten: Crosstrainer steigernd, Nacken- und Schulterrotationen,
        Handgelenke, ein paar Sekunden an der Stange hängen, leichte Rumpfübungen. Ziel ist es,
        wach an der Strecke anzukommen, nicht müde.
      </p>

      <h2>Junge Fahrer</h2>
      <p>
        Viele Kartfahrer sind minderjährig. Im Fitnessraum trainieren sie{" "}
        <strong>in Begleitung eines Erwachsenen</strong> — Eltern, Mechaniker oder Coach —,
        mit Übungen mit Körpergewicht, Widerstandsband, auf dem Rudergerät und mit leichten
        Gewichten. Das Nackentraining erfolgt ohne Zusatzgewicht.
      </p>

      <h2>Nach den Läufen</h2>
      <p>
        Dusche im eigenen Zimmer, Teamessen und ein paar Minuten Dehnen für Nacken, Unterarme
        und Rücken im Zen-Raum. Die Einzelheiten stehen in{" "}
        <Link href="/de/blog/recuperation-apres-effort-le-mans">unserer Regenerationsroutine</Link>
        .
      </p>

      <h2>Praktisches für ein Kartteam</h2>
      <ul>
        <li>
          Auf der internationalen Kartbahn finden die{" "}
          <Link href="/de/blog/sws-karting-finals-le-mans">SWS Karting Finals</Link>, die{" "}
          <Link href="/de/blog/championnat-monde-karting-kz-le-mans">
            Weltmeisterschaft KZ
          </Link>{" "}
          und weitere internationale Rennen statt.
        </li>
        <li>
          Karts, Anhänger und Werkzeug bleiben im Fahrerlager: In der Straße ist dafür kein
          Platz.
        </li>
        <li>
          9 Zimmer mit Duschbad, bis zu 20 Personen: Fahrer, Eltern und Mechaniker unter einem
          Dach.
        </li>
      </ul>
      <p>
        Für Automobilrennfahrer siehe{" "}
        <Link href="/de/blog/preparation-physique-course-automobile-le-mans">
          unseren Artikel zum Motorsport
        </Link>
        .
      </p>
      <ExerciseGuide locale="de" ids={["neck-isometrics", "farmer-walk", "pull-up", "seated-cable-row", "single-arm-cable-row", "pallof-press", "side-plank", "rowing"]} />
    </>
  );
}
