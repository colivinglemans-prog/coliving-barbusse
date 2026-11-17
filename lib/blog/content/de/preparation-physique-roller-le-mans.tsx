import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Beim Speedskating geht alles von den Hüften aus: ein seitlicher Abstoß, eine gebeugte
        Haltung, die stundenlang gehalten wird, und ein Rücken, der einiges aushalten muss. Wir
        haben schon Inlineskating-Teams beherbergt, die wegen der Rennstrecke kamen; so nutzen
        Sie{" "}
        <Link href="/de/blog/salle-de-sport-privee-le-mans">den Fitnessraum des Hauses</Link>{" "}
        zur Vorbereitung, insbesondere auf die 24 Heures Rollers.
      </p>

      <h2>Was Inlineskaten verlangt</h2>
      <ul>
        <li>
          <strong>Kräftige Gesäßmuskeln und Adduktoren</strong> für den seitlichen Abstoß.
        </li>
        <li>
          <strong>Ausdauernde Oberschenkel</strong>, in gebeugter Haltung während eines ganzen
          Turns.
        </li>
        <li>
          <strong>Einen starken unteren Rücken</strong>, nach vorne geneigt.
        </li>
        <li>
          <strong>Stabile Sprunggelenke</strong> und ein gutes Gleichgewicht auf einem Bein.
        </li>
      </ul>

      <h2>Die Einheit für Skater (50 Minuten)</h2>
      <ul>
        <li>
          <strong>Back Squat</strong>: 4 × 6, oder Front Squat, um den Oberkörper aufrecht zu
          halten.
        </li>
        <li>
          <strong>Seitliche Ausfallschritte</strong> mit Kurzhanteln: 3 × 8 pro Seite, die
          Bewegung, die dem Abstoß am nächsten kommt.
        </li>
        <li>
          <strong>Step-ups auf die Box</strong>: 3 × 8 pro Bein.
        </li>
        <li>
          <strong>Rumänisches Kreuzheben</strong>: 3 × 8.
        </li>
        <li>
          <strong>Copenhagen Plank</strong> auf der Bank, für die Adduktoren: 3 × 20 s pro
          Seite.
        </li>
        <li>
          <strong>Seitliche Box Jumps</strong> auf eine niedrige Box (20 cm): 3 × 6 pro Seite,
          weiche Landung.
        </li>
        <li>
          <strong>Gleichgewicht</strong>: auf einem Bein stehen, Knie gebeugt in
          Skate-Position, 3 × 30 s pro Bein, für Geübte mit geschlossenen Augen.
        </li>
      </ul>

      <h2>Ausdauer ohne zu skaten</h2>
      <p>
        Der Crosstrainer bildet einen Abstoß Bein für Bein ohne Stoßbelastung nach: 30 Minuten
        Ausdauer oder Intervalle von 2 Minuten zügig und 1 Minute locker. Das
        Concept2-Rudergerät hält die Ausdauer in Form und fordert dabei Rücken und Arme.
      </p>

      <h2>Die 24 Heures Rollers, im Team</h2>
      <p>
        Im Juli finden auf dem Circuit Bugatti die{" "}
        <Link href="/de/blog/24-heures-rollers-le-mans">24 Heures Rollers</Link> statt. Ein
        Staffelteam, das im Haus wohnt, 4,7 km von der Strecke entfernt, kann:
      </p>
      <ul>
        <li>
          sich morgens mit 10 Minuten Crosstrainer und ein paar seitlichen Ausfallschritten
          aktivieren;
        </li>
        <li>
          zwischen zwei Turns zum Schlafen zurückkommen, in einem komplett verdunkelten
          Zimmer mit eigener Dusche;
        </li>
        <li>
          sich nach dem Rennen mit{" "}
          <Link href="/de/blog/recuperation-apres-effort-le-mans">unserer Routine für nach der Belastung</Link>{" "}
          erholen: Hüften, Adduktoren, unterer Rücken.
        </li>
      </ul>

      <h2>Praktisches</h2>
      <ul>
        <li>9 Zimmer mit Duschbad, bis zu 20 Personen.</li>
        <li>Waschmaschine und Trockner für die Sportkleidung.</li>
        <li>Voll ausgestattete Küche und großer Tisch für das Teamessen.</li>
        <li>
          Ohne Betreuung: Jeder trainiert auf eigene Verantwortung, Minderjährige mit einem
          Erwachsenen.
        </li>
      </ul>
      <p>
        Siehe auch{" "}
        <Link href="/de/blog/entrainements-salle-de-sport-le-mans">
          unsere Trainingseinheiten, allein oder in der Gruppe
        </Link>
        .
      </p>
      <ExerciseGuide locale="de" ids={["back-squat", "front-squat", "lateral-lunge", "step-up", "romanian-deadlift", "copenhagen-plank", "box-jump"]} />
    </>
  );
}
