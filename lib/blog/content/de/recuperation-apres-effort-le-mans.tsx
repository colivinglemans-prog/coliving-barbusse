import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Ein Spiel, ein Rennen, ein Tag im Trainingslager oder ein Nachtturn: Was Sie in den
        Stunden danach tun, zählt genauso viel wie die Belastung selbst, vor allem wenn am
        nächsten Tag ein weiterer Wettkampf ansteht. Hier ist eine Regenerationsroutine für
        das Haus, mit dem Fitnessraum, dem Zen-Raum und dem Rest des Hauses.
      </p>

      <h2>In der ersten halben Stunde: herunterfahren</h2>
      <ul>
        <li>
          <strong>10 Minuten Cool-down</strong> auf dem Crosstrainer oder dem
          Concept2-Rudergerät, in sehr lockerem Tempo, bei dem man sich mühelos unterhalten
          kann. So hilft man dem Körper herunterzufahren, statt aufs Sofa zu fallen.
        </li>
        <li>
          <strong>Trinken</strong> und einen ersten Snack essen: Die Küche ist voll
          ausgestattet, man muss nur vorher eingekauft haben.
        </li>
        <li>
          <strong>Eine Dusche</strong>: Jedes Zimmer hat sein eigenes Duschbad, es gibt keine
          Warteschlange, selbst zu zwanzigst.
        </li>
      </ul>

      <h2>Die Mobilitätsroutine (20 Minuten)</h2>
      <p>
        Im Zen-Raum auf den Yogamatten oder im Fitnessraum auf den Bodenmatten:
      </p>
      <ul>
        <li>
          <strong>Schultern</strong>: Schulterdurchzüge mit dem Stab, von vorne nach hinten,
          2 × 10; dann Außenrotationen mit dem Widerstandsband, 2 × 15, ohne schweren
          Widerstand.
        </li>
        <li>
          <strong>Rücken</strong>: Katze-Kuh im Vierfüßlerstand, 10 Mal langsam; dann an der
          Klimmzugstange hängen, 2 × 20 Sekunden, bei Bedarf mit den Füßen am Boden, um die
          Wirbelsäule zu entlasten.
        </li>
        <li>
          <strong>Hüften</strong>: tiefe Kniebeuge 1 Minute halten und sich dabei am Rack
          festhalten, tiefer Ausfallschritt 45 Sekunden pro Seite, Taubenhaltung 1 Minute pro
          Seite.
        </li>
        <li>
          <strong>Beine</strong>: hintere Oberschenkel mit dem Widerstandsband, in Rückenlage,
          45 Sekunden pro Bein; Waden an der Wand, 45 Sekunden pro Bein.
        </li>
        <li>
          <strong>Nacken</strong> (nach einem Rennen oder einer langen Fahrt): langsames
          Neigen und Drehen, 5 pro Seite.
        </li>
      </ul>

      <h2>Das Mannschaftsessen</h2>
      <p>
        Nach der Belastung braucht es Kohlenhydrate, um die Speicher aufzufüllen, und Eiweiß
        für die Muskeln. Der große Tisch in der Küche bietet <strong>16 Sitzplätze, 20</strong>{" "}
        mit den kleinen Tischen aus dem Wintergarten: Das ganze Team isst gemeinsam, zu der
        Uhrzeit, die ihm passt, was es selbst kocht. Die Küche hat zwei Backöfen, zwei
        Kochfelder, große Töpfe und Geschirr für 20.
      </p>

      <h2>Schlaf, der eigentliche Hebel</h2>
      <ul>
        <li>
          <strong>Ein Zimmer pro Person oder pro Zweierteam</strong>, jedes mit eigener Tür
          und eigenem Schlüssel: Man wird nicht wach, wenn der Letzte zurückkommt.
        </li>
        <li>
          <strong>Rollläden, die komplett verdunkeln</strong>, selbst am helllichten Tag:
          unverzichtbar für Nachtschichtteams und für Fahrer, die zwischen zwei Stints
          schlafen. Siehe auch{" "}
          <Link href="/de/blog/equipe-de-nuit-le-mans">unseren Artikel über Nachtschichtteams</Link>
          .
        </li>
        <li>
          <strong>Ein Haus in einem ruhigen Wohnviertel</strong>.
        </li>
      </ul>

      <h2>Am nächsten Morgen</h2>
      <ul>
        <li>
          <strong>Auslaufen</strong>: 20 Minuten sehr langsames Joggen im Park Gué de Maulny,
          5 Gehminuten entfernt, oder 20 Minuten Crosstrainer, wenn die Beine schwer sind.
        </li>
        <li>
          <strong>Mobilität</strong>: dieselbe Routine wie am Vorabend, in kurzer Version.
        </li>
        <li>
          <strong>Keine schwere Einheit</strong> am Tag nach einem Wettkampf: Krafttraining
          erst zwei Tage später wieder.
        </li>
      </ul>

      <h2>Saubere Sportkleidung für den nächsten Tag</h2>
      <p>
        Ein zweitägiges Turnier bedeutet zwei Sätze Sportkleidung. Im Haus gibt es eine{" "}
        <strong>Waschmaschine und einen Trockner</strong>: Die Trikots vom Samstag sind am
        Sonntag wieder bereit.
      </p>

      <h2>Praktisches</h2>
      <ul>
        <li>
          Fitnessraum, Zen-Raum und Garten sind in der Miete des ganzen Hauses inbegriffen.
          Die Ausstattung im Detail finden Sie in{" "}
          <Link href="/de/blog/salle-de-sport-privee-le-mans">
            unserem Artikel über den Fitnessraum
          </Link>
          .
        </li>
        <li>
          Diese Tipps ersetzen bei Schmerzen oder Verletzungen nicht den Rat Ihres
          Physiotherapeuten oder Arztes.
        </li>
        <li>
          Zum Trainieren während des Aufenthalts siehe{" "}
          <Link href="/de/blog/entrainements-salle-de-sport-le-mans">
            unsere Trainingseinheiten, allein oder in der Gruppe
          </Link>
          .
        </li>
      </ul>
      <ExerciseGuide locale="de" ids={["rowing", "band-external-rotation"]} />
    </>
  );
}
