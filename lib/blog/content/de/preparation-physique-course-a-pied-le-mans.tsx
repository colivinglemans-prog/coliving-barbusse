import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Ein Läufer, der Krafttraining macht, läuft länger ohne Verletzungen: Kräftigere Waden,
        Hüften und ein stärkerer Rumpf verkraften die tausenden Bodenkontakte eines Laufs
        besser. Für einen Verein im Trainingslager, einen Straßenlauf oder einen Trail in der
        Region erfahren Sie hier, wie Sie{" "}
        <Link href="/de/blog/salle-de-sport-privee-le-mans">den Fitnessraum des Hauses</Link>{" "}
        mit Läufen im nahen Park kombinieren.
      </p>

      <h2>Laufen, nur ein paar Schritte vom Haus entfernt</h2>
      <p>
        Der <strong>Park Gué de Maulny</strong> (10 ha) liegt 5 Gehminuten entfernt: genug für
        einen Dauerlauf, Intervalle oder Lauf-ABC, ohne das Auto zu nehmen. Der Rest der
        Einheit findet im Fitnessraum statt.
      </p>

      <h2>Was Krafttraining dem Läufer bringt</h2>
      <ul>
        <li>
          <strong>Widerstandsfähigere Waden und Achillessehnen</strong>.
        </li>
        <li>
          <strong>Stabile Hüften</strong>: Das Knie knickt bei jedem Schritt weniger nach innen
          ein.
        </li>
        <li>
          <strong>Eine bessere Laufökonomie</strong>: Kraft macht jeden Schritt weniger
          kostspielig.
        </li>
        <li>
          <strong>Ein Rumpf, der durchhält</strong>, am Ende des Laufs, wenn die Haltung
          nachlässt.
        </li>
      </ul>

      <h2>Die Krafteinheit für Läufer (45 Minuten)</h2>
      <ul>
        <li>
          <strong>Back Squat oder Goblet Squat</strong>: 3 × 6 bis 8.
        </li>
        <li>
          <strong>Rumänisches Kreuzheben</strong>: 3 × 8.
        </li>
        <li>
          <strong>Step-ups auf die Box</strong> (40 cm): 3 × 8 pro Bein.
        </li>
        <li>
          <strong>Walking Lunges</strong>: 2 × 10 pro Bein.
        </li>
        <li>
          <strong>Wadenheben im Stehen</strong>, Langhantel auf dem Rücken: 3 × 15, dann
          einbeinig 2 × 12.
        </li>
        <li>
          <strong>Rumpf</strong>: Seitstütz 2 × 30 s pro Seite, Dead Bug 2 × 10.
        </li>
        <li>
          <strong>Hüften</strong>: seitliches Gehen mit Widerstandsband um die Knie, 2 × 15
          Schritte pro Seite.
        </li>
      </ul>

      <h2>Alternativtraining ohne Stoßbelastung</h2>
      <p>
        Für einen Regenerationstag oder einen Läufer, der aus einer Verletzung zurückkommt: 30
        bis 40 Minuten Crosstrainer oder Concept2-Rudergerät. Das Herz arbeitet wie beim
        Laufen, die Gelenke ruhen sich aus. Variante: 5 × 4 Minuten zügig auf dem
        Crosstrainer, 2 Minuten locker dazwischen.
      </p>

      <h2>Ein typisches Trainingslager-Wochenende</h2>
      <ul>
        <li>
          <strong>Samstagmorgen</strong>: Intervalle im Park (zum Beispiel 8 × 400 m), danach
          Rumpftraining im Fitnessraum.
        </li>
        <li>
          <strong>Samstagabend</strong>: die Krafteinheit oben, Teamessen.
        </li>
        <li>
          <strong>Sonntagmorgen</strong>: langer, lockerer Lauf, danach{" "}
          <Link href="/de/blog/recuperation-apres-effort-le-mans">Regenerationsroutine</Link>
          .
        </li>
      </ul>

      <h2>Vor einem Wettkampf</h2>
      <p>
        In den drei Tagen davor kein schweres Krafttraining. Am Vortag: 20 Minuten sehr
        lockerer Dauerlauf mit ein paar Steigerungen. Am Morgen: 10 Minuten Crosstrainer, etwas
        Lauf-ABC und Mobilität für Sprunggelenke und Hüften.
      </p>

      <h2>Praktisches</h2>
      <ul>
        <li>
          9 Zimmer mit Duschbad, bis zu 20 Personen: der ganze Verein unter einem Dach.
        </li>
        <li>Waschmaschine und Trockner für die Laufkleidung vom Vortag.</li>
        <li>Voll ausgestattete Küche für die Pasta am Vorabend des Wettkampfs.</li>
        <li>
          Ohne Betreuung: Jeder trainiert auf eigene Verantwortung, Minderjährige mit einem
          Erwachsenen.
        </li>
      </ul>
      <p>
        Siehe auch{" "}
        <Link href="/de/blog/entrainements-salle-de-sport-le-mans">
          unsere Trainingseinheiten, allein oder in der Gruppe
        </Link>{" "}
        und{" "}
        <Link href="/de/blog/equipe-sportive-le-mans">unseren Artikel für Sportmannschaften</Link>
        .
      </p>
      <ExerciseGuide locale="de" ids={["back-squat", "goblet-squat", "romanian-deadlift", "step-up", "walking-lunge", "calf-raise", "side-plank", "dead-bug"]} />
    </>
  );
}
