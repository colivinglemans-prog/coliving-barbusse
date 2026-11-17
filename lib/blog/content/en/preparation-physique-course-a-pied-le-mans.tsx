import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        A runner who does strength training runs for longer without getting injured: stronger
        calves, hips and core cope better with the thousands of foot strikes in a race. For a
        club on a training camp, a road race or a trail race in the region, here is how to
        combine{" "}
        <Link href="/en/blog/salle-de-sport-privee-le-mans">the house gym</Link>{" "}
        with runs in the nearby park.
      </p>

      <h2>Running right by the house</h2>
      <p>
        <strong>Gué de Maulny park</strong> (10 ha) is a 5-minute walk away: enough for an
        easy run, intervals or running drills without taking the car. The rest of the session
        happens in the gym.
      </p>

      <h2>What strength training brings a runner</h2>
      <ul>
        <li>
          <strong>Stronger calves and Achilles tendons</strong>.
        </li>
        <li>
          <strong>Stable hips</strong>: less knee caving in on every stride.
        </li>
        <li>
          <strong>Better running economy</strong>: strength makes every stride less costly.
        </li>
        <li>
          <strong>A core that holds up</strong> at the end of a race, when your form starts to
          break down.
        </li>
      </ul>

      <h2>The runner's strength session (45 minutes)</h2>
      <ul>
        <li>
          <strong>Back squat or goblet squat</strong>: 3 × 6 to 8.
        </li>
        <li>
          <strong>Romanian deadlift</strong>: 3 × 8.
        </li>
        <li>
          <strong>Box step-up</strong> (40 cm): 3 × 8 per leg.
        </li>
        <li>
          <strong>Walking lunges</strong>: 2 × 10 per leg.
        </li>
        <li>
          <strong>Standing calf raises</strong>, bar on your back: 3 × 15, then single-leg 2 ×
          12.
        </li>
        <li>
          <strong>Core</strong>: side plank 2 × 30 s per side, dead bug 2 × 10.
        </li>
        <li>
          <strong>Hips</strong>: lateral band walk with a band around your knees, 2 × 15 steps
          per side.
        </li>
      </ul>

      <h2>The low-impact cross-training session</h2>
      <p>
        For a recovery day or a runner coming back from injury: 30 to 40 minutes on the
        elliptical or the Concept2 rower. Your heart works as it does when running, while your
        joints get a rest. Variation: 5 × 4 hard minutes on the elliptical, with 2 easy
        minutes between each.
      </p>

      <h2>A typical training-camp weekend</h2>
      <ul>
        <li>
          <strong>Saturday morning</strong>: intervals in the park (for example 8 × 400 m),
          then core work in the gym.
        </li>
        <li>
          <strong>Saturday evening</strong>: the strength session above, team meal.
        </li>
        <li>
          <strong>Sunday morning</strong>: easy long run, then the{" "}
          <Link href="/en/blog/recuperation-apres-effort-le-mans">recovery routine</Link>
          .
        </li>
      </ul>

      <h2>Before a race</h2>
      <p>
        In the three days beforehand, no heavy lifting. The day before: 20 minutes of very
        easy jogging with a few strides. On the morning: 10 minutes on the elliptical, a few
        drills and some ankle and hip mobility.
      </p>

      <h2>Practical information</h2>
      <ul>
        <li>
          9 bedrooms with shower rooms, up to 20 people: the whole club under one roof.
        </li>
        <li>Washing machine and tumble dryer for the previous day's kit.</li>
        <li>A fully equipped kitchen for the pre-race pasta dinner.</li>
        <li>
          Unsupervised: everyone trains at their own risk, minors with an adult.
        </li>
      </ul>
      <p>
        See also{" "}
        <Link href="/en/blog/entrainements-salle-de-sport-le-mans">
          our sessions, solo or as a group
        </Link>{" "}
        and{" "}
        <Link href="/en/blog/equipe-sportive-le-mans">our article for sports teams</Link>
        .
      </p>
      <ExerciseGuide locale="en" ids={["back-squat", "goblet-squat", "romanian-deadlift", "step-up", "walking-lunge", "calf-raise", "side-plank", "dead-bug"]} />
    </>
  );
}
