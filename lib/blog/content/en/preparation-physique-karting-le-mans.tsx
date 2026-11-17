import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        A kart has neither power steering nor suspension: the driver absorbs the vibration
        and the lateral forces through the neck and ribs, and holds on to heavy steering in
        every corner. In May 2026, a karting team from Singapore stayed with us for the SWS
        Karting Finals. Here is how to use{" "}
        <Link href="/en/blog/salle-de-sport-privee-le-mans">the house gym</Link>{" "}
        to prepare for a race at the Le Mans international karting circuit.
      </p>

      <h2>What karting demands</h2>
      <ul>
        <li>
          <strong>The neck</strong>, which carries the helmet through every corner.
        </li>
        <li>
          <strong>The forearms and grip</strong>, on unassisted steering.
        </li>
        <li>
          <strong>The core and ribs</strong>, wedged against the seat.
        </li>
        <li>
          <strong>Cardio</strong>: your heart rate climbs fast during a heat.
        </li>
      </ul>

      <h2>The driver's session (45 minutes)</h2>
      <ul>
        <li>
          <strong>Neck</strong>: isometrics against your hand in all four directions, 4 × 15
          s; then lying on the bench with your head over the edge, slow flexions using only
          the weight of your head, 2 × 12 per direction.
        </li>
        <li>
          <strong>Grip</strong>: dead hang from the pull-up bar, 3 × 30 s; farmer's walk with
          two dumbbells, 3 × 30 m.
        </li>
        <li>
          <strong>Pull-ups</strong>: 3 sets of max reps minus one, with a band to assist if
          needed.
        </li>
        <li>
          <strong>Seated row</strong> on the low pulley, neutral-grip row handle: 3 × 12, then
          single-arm row, single handle, 2 × 10 per arm to balance both sides.
        </li>
        <li>
          <strong>Core</strong>: Pallof press 3 × 10 per side, side plank 3 × 30 s per side.
        </li>
        <li>
          <strong>Cardio</strong>: Concept2 rower, 6 × 2 hard minutes, 1 easy minute.
        </li>
      </ul>

      <h2>Race morning</h2>
      <p>
        10 to 15 minutes: elliptical building up gradually, neck and shoulder rotations,
        wrists, a few seconds' hang from the bar, light core work. The aim is to arrive at the
        circuit awake, not tired.
      </p>

      <h2>Young drivers</h2>
      <p>
        Many karting drivers are minors. In the gym, they train{" "}
        <strong>accompanied by an adult</strong> — a parent, mechanic or coach — with
        bodyweight exercises, resistance bands, the rower and light weights. Neck work is done
        without added weight.
      </p>

      <h2>After the heats</h2>
      <p>
        A shower in your own bedroom, a team meal, and a few minutes of neck, forearm and back
        stretches in the zen room. The details are in{" "}
        <Link href="/en/blog/recuperation-apres-effort-le-mans">our recovery routine</Link>
        .
      </p>

      <h2>Practical information for a karting team</h2>
      <ul>
        <li>
          The international karting circuit hosts the{" "}
          <Link href="/en/blog/sws-karting-finals-le-mans">SWS Karting Finals</Link>, the{" "}
          <Link href="/en/blog/championnat-monde-karting-kz-le-mans">
            KZ World Championship
          </Link>{" "}
          and other international events.
        </li>
        <li>
          The karts, the trailer and the tools stay in the paddock: there is no room for them
          in the street.
        </li>
        <li>
          9 bedrooms with shower rooms, up to 20 people: drivers, parents and mechanics under
          one roof.
        </li>
      </ul>
      <p>
        For racing drivers, see{" "}
        <Link href="/en/blog/preparation-physique-course-automobile-le-mans">
          our article on motor racing
        </Link>
        .
      </p>
      <ExerciseGuide locale="en" ids={["neck-isometrics", "farmer-walk", "pull-up", "seated-cable-row", "single-arm-cable-row", "pallof-press", "side-plank", "rowing"]} />
    </>
  );
}
