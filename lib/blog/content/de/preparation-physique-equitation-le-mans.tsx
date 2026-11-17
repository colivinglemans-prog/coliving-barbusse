import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Ein Reiter hebt keine Lasten, aber er hält stundenlang eine Haltung, fängt jeden
        Galoppsprung mit dem Becken ab und gibt die Hilfen mit Beinen, die unabhängig vom
        Oberkörper arbeiten. Wir beherbergen Reiter, die zu den Turnieren in der Region kommen:
        So nutzen Sie{" "}
        <Link href="/de/blog/salle-de-sport-privee-le-mans">den Fitnessraum des Hauses</Link>
        , um besser zu reiten und Ihren Rücken zu schonen.
      </p>

      <h2>Was Reiten verlangt</h2>
      <ul>
        <li>
          <strong>Einen stabilen Rumpf</strong>: Die Rumpfspannung ermöglicht es, der Bewegung
          des Pferdes zu folgen, ohne sich zu verkrampfen oder in sich zusammenzusacken.
        </li>
        <li>
          <strong>Adduktoren und Gesäßmuskeln</strong>, die die Position halten, in der Dressur
          wie im leichten Sitz beim Springen.
        </li>
        <li>
          <strong>Ein bewegliches Becken</strong>, das die Gangarten abfängt.
        </li>
        <li>
          <strong>Einen kräftigen oberen Rücken</strong>, um aufrecht zu sitzen, die Schultern
          tief.
        </li>
        <li>
          <strong>Symmetrie</strong>: Jeder Reiter hat eine stärkere Seite.
        </li>
      </ul>

      <h2>Die Einheit für Reiter (40 Minuten)</h2>
      <ul>
        <li>
          <strong>Goblet Squat</strong> mit einer Bumper Plate von 5 oder 10 kg: 3 × 10,
          Oberkörper aufrecht.
        </li>
        <li>
          <strong>Copenhagen Plank</strong> auf der Bank: 3 × 20 s pro Seite, für die
          Adduktoren.
        </li>
        <li>
          <strong>Hip Thrust</strong> mit der Langhantel: 3 × 10.
        </li>
        <li>
          <strong>Pallof Press</strong> am Kabelzug, Einhandgriff: 3 × 10 pro Seite, der
          Oberkörper dreht sich nicht mit.
        </li>
        <li>
          <strong>Rudern</strong> am unteren Kabelzug: 3 × 12, Schulterblätter
          zusammengezogen.
        </li>
        <li>
          <strong>Dead Bug</strong> auf der Matte: 3 × 10, um Arme und Beine voneinander zu
          entkoppeln.
        </li>
        <li>
          <strong>Walking Lunges</strong>: 2 × 8 pro Bein, mit Blick auf die schwächere Seite.
        </li>
      </ul>

      <h2>Cardio, nützlich in der Vielseitigkeit</h2>
      <p>
        Eine Geländestrecke oder ein langer Turniertag ermüdet auch den Reiter. 20 bis 30
        Minuten Crosstrainer oder Concept2-Rudergerät zweimal pro Woche reichen, um am Ende des
        Parcours nicht außer Atem zu sein.
      </p>

      <h2>Am Turniertag</h2>
      <ul>
        <li>
          <strong>Morgens</strong>: 10 Minuten Mobilität für Becken und Hüften auf der Matte
          (Beckenkippen, Hüftöffner, Katze-Kuh), bevor es zu den Stallungen geht.
        </li>
        <li>
          <strong>Abends</strong>: Dehnen von Adduktoren, Hüftbeugern und unterem Rücken im
          Zen-Raum; siehe{" "}
          <Link href="/de/blog/recuperation-apres-effort-le-mans">unsere Regenerationsroutine</Link>
          .
        </li>
      </ul>

      <h2>Praktisches für Reiter</h2>
      <ul>
        <li>
          Der <strong>Pôle Européen du Cheval</strong> (Yvré-l&apos;Évêque) liegt etwa zwanzig
          Autominuten entfernt, die Pferderennbahn Les Hunaudières ebenfalls. Siehe{" "}
          <Link href="/de/blog/concours-equestre-pole-europeen-du-cheval">
            unseren Artikel zu den Reitturnieren
          </Link>
          .
        </li>
        <li>
          Pferde, Pferdeanhänger und Lkw bleiben auf dem Turniergelände: Das Haus hat weder
          Stall noch Platz für einen Lkw.
        </li>
        <li>
          Waschmaschine und Trockner für die Reitkleidung, ein Duschbad pro Zimmer, bis zu 20
          Personen: Reiter, Trainer und Familien.
        </li>
        <li>
          Junge Reiter von 10 bis 17 Jahren sind unter der Verantwortung ihrer Betreuer
          willkommen; im Fitnessraum trainieren Minderjährige mit einem Erwachsenen.
        </li>
      </ul>
      <ExerciseGuide locale="de" ids={["goblet-squat", "copenhagen-plank", "hip-thrust", "pallof-press", "seated-cable-row", "dead-bug", "walking-lunge"]} />
    </>
  );
}
