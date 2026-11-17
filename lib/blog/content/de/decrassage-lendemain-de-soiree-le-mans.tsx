import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Eine Hochzeit in der Region, ein Geburtstag im Restaurant, ein Abend in der Stadt oder
        der gefeierte Sieg nach dem Rennen: Am nächsten Morgen sind die Beine schwer und der
        Kopf auch. Statt auf dem Sofa liegen zu bleiben, hilft eine sanfte Auflockerungseinheit,
        wieder in Gang zu kommen. So machen Sie sie im Haus, mit{" "}
        <Link href="/de/blog/salle-de-sport-privee-le-mans">dem Fitnessraum</Link>, dem Zen-Raum
        und dem nahen Park.
      </p>

      <h2>Was die Auflockerung bewirkt und was nicht</h2>
      <ul>
        <li>
          <strong>Sie bringt den Körper wieder in Bewegung</strong>: Der Kreislauf kommt in
          Schwung, vom Tanzen oder einer kurzen Nacht verspannte Muskeln lockern sich, und
          danach fühlt man sich oft besser als vorher.
        </li>
        <li>
          <strong>Sie baut den Alkohol nicht schneller ab</strong>: Das schafft nur die Zeit.
          Einen Abend kann man nicht „ausschwitzen“.
        </li>
        <li>
          <strong>Sie ersetzt weder Wasser noch Schlaf noch ein richtiges Frühstück</strong>.
        </li>
      </ul>

      <h2>Bevor Sie anfangen</h2>
      <ul>
        <li>
          <strong>Wenn Sie vor kurzem noch getrunken haben, kein Training</strong>:
          Gleichgewicht und Reflexe sind noch nicht zurück. An diesem Tag keine schweren
          Gewichte, keine Box Jumps, keine Langhantel über Kopf.
        </li>
        <li>
          <strong>Trinken Sie zuerst</strong> ein großes Glas Wasser und halten Sie während
          des Trainings eine Flasche griffbereit.
        </li>
        <li>
          <strong>Essen Sie eine Kleinigkeit</strong>: Brot, eine Banane, etwas Einfaches. Die
          Küche ist voll ausgestattet, der Kaffeevollautomat auch.
        </li>
        <li>
          Schwindel, Übelkeit, Herzrasen: aufhören und ausruhen. Die Auflockerung soll
          angenehm bleiben.
        </li>
      </ul>

      <h2>Die Auflockerungseinheit (30 Minuten)</h2>
      <ul>
        <li>
          <strong>10 bis 15 Minuten sehr lockeres Cardio</strong> auf dem Crosstrainer oder
          dem Concept2-Rudergerät. Sie sollten sich mühelos unterhalten können. Wenn sich das
          Rudergerät zu anstrengend anfühlt, reicht der Crosstrainer.
        </li>
        <li>
          <strong>Mobilität, 10 Minuten</strong>: Schulterdurchzüge mit dem Stab, Katze-Kuh im
          Vierfüßlerstand, tiefe Kniebeuge halten und sich dabei am Rack festhalten, tiefer
          Ausfallschritt 30 Sekunden pro Seite.
        </li>
        <li>
          <strong>Etwas leichtes Krafttraining</strong>, wenn die Lust zurückkommt: 2 Runden
          mit 10 Goblet Squats mit einer 5 kg Bumper Plate, 10 Ruderzügen am unteren Kabelzug
          und 20 Sekunden Plank.
        </li>
        <li>
          <strong>Dehnen im Zen-Raum</strong>, auf den Yogamatten, mit langsamer Atmung: 5
          Minuten.
        </li>
      </ul>

      <h2>Oder draußen: ein Spaziergang im Park</h2>
      <p>
        Der <strong>Park Gué de Maulny</strong> (10 ha) liegt 5 Gehminuten entfernt. Ein
        Spaziergang von 20 bis 30 Minuten an der frischen Luft, in der Gruppe, tut oft genauso
        gut wie der Fitnessraum, und niemand muss sich umziehen. Wer fitter ist, kann eine
        Runde locker joggen.
      </p>

      <h2>In der Gruppe: gemeinsam auflockern</h2>
      <p>
        Nach einer Hochzeit oder einem Wochenende unter Freunden kann man die Einheit gemeinsam
        machen: eine Gruppe im Fitnessraum (Crosstrainer und Rudergerät abwechselnd, Mobilität
        auf den Matten), die andere beim Spaziergang im Park, dann wird getauscht. Zum Schluss
        treffen sich alle am großen Küchentisch, 16 Sitzplätze, 20 mit den kleinen Tischen aus
        dem Wintergarten, zum Brunch.
      </p>

      <h2>Der Rest des Vormittags</h2>
      <ul>
        <li>
          <strong>Eine Dusche</strong> im eigenen Duschbad: 9 Zimmer, 9 Duschen, kein Warten,
          selbst zu zwanzigst.
        </li>
        <li>
          <strong>Ein Mittagsschlaf</strong>, falls nötig: Die Rollläden der Zimmer verdunkeln
          komplett, selbst am helllichten Tag.
        </li>
        <li>
          <strong>Die Abreise</strong> erfolgt vor 11 Uhr; eine spätere Abreise ist auf
          Anfrage möglich, gegen Aufpreis und je nach Verfügbarkeit. Praktisch am Tag nach einer
          Hochzeit.
        </li>
      </ul>

      <h2>Gut zu wissen</h2>
      <ul>
        <li>
          Das Haus empfängt Familien und Gruppen, aber <strong>es ist kein Festsaal</strong>:
          keine Partys oder lauten Feiern vor Ort. Gefeiert wird in der Stadt oder im
          Festsaal, die Nacht und der nächste Tag finden im Haus statt.
        </li>
        <li>
          Der Fitnessraum wird ohne Betreuung genutzt, auf eigene Verantwortung;
          Minderjährige mit einem Erwachsenen.
        </li>
        <li>
          Für eine umfassendere Einheit an den folgenden Tagen siehe{" "}
          <Link href="/de/blog/entrainements-salle-de-sport-le-mans">
            unsere Trainingseinheiten allein oder in der Gruppe
          </Link>{" "}
          und{" "}
          <Link href="/de/blog/recuperation-apres-effort-le-mans">
            unsere Regenerationsroutine
          </Link>
          .
        </li>
      </ul>
      <ExerciseGuide locale="de" ids={["rowing", "goblet-squat", "seated-cable-row", "plank"]} />
    </>
  );
}
