import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Olympic bar, bumper plates, shock-absorbing floor, Concept2 rower, medicine ball, plyo
        box and pull-up bar: everything you need for a WOD is in{" "}
        <Link href="/en/blog/salle-de-sport-privee-le-mans">the house gym</Link>
        . If you do cross-training (or CrossFit at your usual box), you won't lose momentum
        during your stay in Le Mans. Here is the equipment, and six WODs designed for this
        gym, solo or as a team.
      </p>

      <h2>A box's equipment, at the house</h2>
      <ul>
        <li>
          <strong>Weightlifting</strong>: 20 kg Olympic bar, 165 kg of bumper plates (185 kg
          including the bar), collars, belt.
        </li>
        <li>
          <strong>A floor of 20 mm rubber tiles</strong>: you can drop the bar from overhead
          or after a deadlift, just like at a box.
        </li>
        <li>
          <strong>Gymnastics</strong>: pull-up bar and dip bars on the rack.
        </li>
        <li>
          <strong>Monostructural</strong>: Concept2 rower, jump rope, elliptical trainer.
        </li>
        <li>
          <strong>Functional</strong>: 6 kg medicine ball, wooden plyo box adjustable from 20
          to 50 cm, dumbbells loaded with cast-iron plates, cable pulley.
        </li>
      </ul>
      <p>
        What there isn't: no rings, no kettlebells, no climbing rope and no assault bike. The
        WODs below do without them.
      </p>

      <h2>Six WODs for this gym</h2>

      <h3>1. “Barbusse” — For time, solo</h3>
      <p>21-15-9 reps of:</p>
      <ul>
        <li>Barbell thrusters (moderate weight)</li>
        <li>Pull-ups</li>
      </ul>
      <p>Then 500 m on the rower. Time cap: 15 minutes.</p>

      <h3>2. 20-minute AMRAP</h3>
      <ul>
        <li>250 m row</li>
        <li>15 medicine ball thrusters</li>
        <li>10 box jumps (50 cm, or step-ups)</li>
        <li>5 pull-ups</li>
      </ul>

      <h3>3. 16-minute EMOM</h3>
      <ul>
        <li>Odd minutes: 3 power cleans, heavy but clean.</li>
        <li>Even minutes: 12 calories on the rower.</li>
      </ul>

      <h3>4. Strength then metcon</h3>
      <ul>
        <li>
          <strong>Strength</strong>: back squat 5-5-3-3-1, building up to a heavy weight for
          the day.
        </li>
        <li>
          <strong>Metcon</strong>: 3 rounds of 400 m row, 15 dips, 50 jump rope skips.
        </li>
      </ul>

      <h3>5. In pairs, “you go, I go”</h3>
      <p>
        10 shared rounds: partner A rows 250 m while B holds the bar at the top of the
        deadlift; then swap. Then 50 medicine ball thrusters, split however you like.
      </p>

      <h3>6. Team WOD, 4 to 8 people</h3>
      <p>
        One bar, one rower, one box: the team shares 2,000 m of rowing, 100 medicine ball
        thrusters, 80 box jumps, 60 deadlifts and 40 pull-ups, in whatever order it likes,
        with only one person per station at a time. The clock stops when everything is done.
        The others cheer them on.
      </p>

      <h2>Good practice</h2>
      <ul>
        <li>
          <strong>Warm-up</strong>: 5 minutes on the rower, mobility with the stick, then the
          empty bar for the weightlifting movements.
        </li>
        <li>
          <strong>Scaled weights</strong>: in cross-training, technique comes before the
          clock. Nobody is coaching you: reduce the weight or the reps if needed.
        </li>
        <li>
          <strong>Bumpers only</strong> for dropping the bar; cast iron and dumbbells are set
          down on the floor.
        </li>
        <li>
          <strong>Minors</strong> train with an adult.
        </li>
        <li>
          <strong>Put away</strong> bars, plates and the box after your session.
        </li>
      </ul>

      <h2>After the WOD</h2>
      <p>
        A shower in your own bedroom, a meal at the big table, and a few minutes of
        stretching in the zen room. See{" "}
        <Link href="/en/blog/recuperation-apres-effort-le-mans">our recovery routine</Link>{" "}
        and, for more traditional sessions,{" "}
        <Link href="/en/blog/entrainements-salle-de-sport-le-mans">
          our workouts, solo or as a group
        </Link>
        .
      </p>

      <h2>Practical information</h2>
      <ul>
        <li>
          The house is rented as a whole: 9 bedrooms with shower rooms, up to 20 people.
          Ideal for a weekend with friends from your box or a club training camp.
        </li>
        <li>The gym is reserved for your group for the whole stay.</li>
        <li>
          TGV station a 15-minute walk away, about 55 minutes from Paris.
        </li>
      </ul>
      <ExerciseGuide locale="en" ids={["thruster", "pull-up", "rowing", "medicine-ball-thruster", "box-jump", "power-clean", "back-squat", "dips", "jump-rope", "deadlift"]} />
    </>
  );
}
