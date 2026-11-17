import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Ein Radfahrer verbringt Stunden auf dem Rad, und genau deshalb tut ihm der Kraftraum
        gut: stärkere Beine, ein Rumpf, der die Position hält, ein Rücken, der sich nach vier
        Stunden im Sattel nicht mehr beschwert. Am Wochenende der 24 Heures Vélo haben wir eine
        Gruppe Radfahrer beherbergt: So nutzen Sie{" "}
        <Link href="/de/blog/salle-de-sport-privee-le-mans">den Fitnessraum des Hauses</Link>{" "}
        vor, während und nach einem Rennen in Le Mans.
      </p>

      <h2>Was Krafttraining dem Radfahrer bringt</h2>
      <ul>
        <li>
          <strong>Kräftigere Beine</strong>: Mehr Kraft bedeutet mehr Watt beim Antreten und
          an den Anstiegen.
        </li>
        <li>
          <strong>Ein stabiler Rumpf</strong>: Das Becken bleibt ruhig auf dem Sattel, die
          Tretkraft verpufft nicht.
        </li>
        <li>
          <strong>Rücken und Nacken, die durchhalten</strong>, in der aerodynamischen Position.
        </li>
        <li>
          <strong>Widerstandsfähigere Knochen und Sehnen</strong>: Radfahren, ein Sport ohne
          Stoßbelastung, beansprucht sie kaum.
        </li>
      </ul>

      <h2>Die Krafteinheit für Radfahrer (50 Minuten)</h2>
      <p>Ein- bis zweimal pro Woche außerhalb der Rennphase:</p>
      <ul>
        <li>
          <strong>Back Squat</strong> im Rack: 4 × 6, schwer, aber sauber.
        </li>
        <li>
          <strong>Rumänisches Kreuzheben</strong>: 3 × 8, für hintere Oberschenkel und
          Gesäßmuskeln, die bei Radfahrern oft hinterherhinken.
        </li>
        <li>
          <strong>Step-ups auf die Box</strong> (40 bis 50 cm) mit Kurzhanteln: 3 × 8 pro Bein,
          um den Unterschied zwischen starkem und schwachem Bein auszugleichen.
        </li>
        <li>
          <strong>Hip Thrust</strong> mit der Langhantel, Rücken auf der Bank: 3 × 10.
        </li>
        <li>
          <strong>Rudern</strong> am unteren Kabelzug: 3 × 12, für den oberen Rücken.
        </li>
        <li>
          <strong>Rumpf</strong>: Plank 3 × 40 s, Seitstütz 2 × 30 s pro Seite, Dead Bug
          2 × 10.
        </li>
      </ul>

      <h2>Wenn ein Rennen näher rückt</h2>
      <p>
        In der Rennwoche hält man etwas Kraft, aber ohne Ermüdung: 2 × 5 leichte, schnelle
        Kniebeugen, Rumpfübungen, und das war&apos;s. Am Vortag reichen 15 Minuten
        Crosstrainer und Hüftmobilität.
      </p>

      <h2>Die 24 Heures Vélo: Staffel und Regeneration</h2>
      <p>
        Ende August finden auf dem Circuit Bugatti die{" "}
        <Link href="/de/blog/24-heures-velo-le-mans-2027">24 Heures Vélo</Link> statt, solo oder
        im Team. Für ein Staffelteam, das im Haus wohnt, 4,7 km von der Strecke entfernt:
      </p>
      <ul>
        <li>
          <strong>Zwischen zwei Turns</strong>: 10 Minuten sehr locker auf dem Crosstrainer,
          um die Durchblutung anzuregen, eine Dusche im eigenen Zimmer, essen, dank der
          Rollläden in völliger Dunkelheit schlafen.
        </li>
        <li>
          <strong>Nach dem Rennen</strong>: die Routine aus{" "}
          <Link href="/de/blog/recuperation-apres-effort-le-mans">unserem Artikel zur Regeneration</Link>
          , mit Schwerpunkt auf Hüften, hinteren Oberschenkeln und unterem Rücken.
        </li>
      </ul>

      <h2>Das Rudergerät, der Verbündete an Tagen ohne Rad</h2>
      <p>
        Das Concept2-Rudergerät trainiert den Oberkörper, den das Radfahren vernachlässigt, ohne
        Stoßbelastung. Eine 20-minütige Ausdauereinheit oder 6 × 3 Minuten zügig halten das
        Herz-Kreislauf-System an Regentagen oder Ruhetagen für die Beine in Form.
      </p>

      <h2>Praktisches für ein Radteam</h2>
      <ul>
        <li>
          <strong>Die Räder werden geschützt im Zen-Raum abgestellt</strong>, im Haus.
        </li>
        <li>
          <strong>Waschmaschine und Trockner</strong> für Radhosen und Trikots.
        </li>
        <li>
          <strong>Ein Duschbad pro Zimmer</strong>, 9 Zimmer, bis zu 20 Personen.
        </li>
        <li>
          Der TGV-Bahnhof liegt 15 Gehminuten entfernt, etwa 55 Minuten von Paris.
        </li>
      </ul>
      <p>
        Für weitere Einheiten siehe{" "}
        <Link href="/de/blog/entrainements-salle-de-sport-le-mans">
          unsere Trainingseinheiten allein oder in der Gruppe
        </Link>{" "}
        und{" "}
        <Link href="/de/blog/equipe-sportive-le-mans">unseren Artikel für Sportmannschaften</Link>
        .
      </p>
      <ExerciseGuide locale="de" ids={["back-squat", "romanian-deadlift", "step-up", "hip-thrust", "seated-cable-row", "plank", "side-plank", "dead-bug", "rowing"]} />
    </>
  );
}
