import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        In speed skating, everything starts from the hips: a lateral push, a crouched position
        held for hours, and a lower back that has to take the strain. We have already welcomed
        inline skating teams here for the circuit; here is how to use{" "}
        <Link href="/en/blog/salle-de-sport-privee-le-mans">the house gym</Link>{" "}
        to prepare, especially for the 24 Heures Rollers.
      </p>

      <h2>What inline skating demands</h2>
      <ul>
        <li>
          <strong>Powerful glutes and adductors</strong> for the lateral push.
        </li>
        <li>
          <strong>Quads with endurance</strong>, in a crouched position for an entire stint.
        </li>
        <li>
          <strong>A solid lower back</strong>, leaning forwards.
        </li>
        <li>
          <strong>Stable ankles</strong> and good single-leg balance.
        </li>
      </ul>

      <h2>The skater's session (50 minutes)</h2>
      <ul>
        <li>
          <strong>Back squat</strong>: 4 × 6, or front squat to keep your torso upright.
        </li>
        <li>
          <strong>Dumbbell lateral lunges</strong>: 3 × 8 per side, the movement closest to
          the skating push.
        </li>
        <li>
          <strong>Box step-up</strong>: 3 × 8 per leg.
        </li>
        <li>
          <strong>Romanian deadlift</strong>: 3 × 8.
        </li>
        <li>
          <strong>Copenhagen plank</strong> on the bench, for the adductors: 3 × 20 s per
          side.
        </li>
        <li>
          <strong>Lateral box jumps</strong> onto a low box (20 cm): 3 × 6 per side, soft
          landing.
        </li>
        <li>
          <strong>Balance</strong>: stand on one leg, knee bent in skating position, 3 × 30 s
          per leg, eyes closed for the more confident.
        </li>
      </ul>

      <h2>Endurance without skating</h2>
      <p>
        The elliptical reproduces a leg-by-leg push with no impact: 30 minutes of endurance,
        or intervals of 2 hard minutes and 1 easy minute. The Concept2 rower keeps your cardio
        up while working your back and arms.
      </p>

      <h2>The 24 Heures Rollers, as a team</h2>
      <p>
        In July, the Bugatti circuit hosts the{" "}
        <Link href="/en/blog/24-heures-rollers-le-mans">24 Heures Rollers</Link>. A relay team
        staying at the house, 4.7 km from the circuit, can:
      </p>
      <ul>
        <li>
          warm up in the morning with 10 minutes on the elliptical and a few lateral lunges;
        </li>
        <li>
          come back to sleep between two stints in a completely dark bedroom, with its own
          shower;
        </li>
        <li>
          recover after the race with{" "}
          <Link href="/en/blog/recuperation-apres-effort-le-mans">our post-exercise routine</Link>
          : hips, adductors, lower back.
        </li>
      </ul>

      <h2>Practical information</h2>
      <ul>
        <li>9 bedrooms with shower rooms, up to 20 people.</li>
        <li>Washing machine and tumble dryer for your kit.</li>
        <li>Fully equipped kitchen and a big table for team meals.</li>
        <li>
          Unsupervised: everyone trains at their own risk, minors with an adult.
        </li>
      </ul>
      <p>
        See also{" "}
        <Link href="/en/blog/entrainements-salle-de-sport-le-mans">
          our sessions, solo or as a group
        </Link>
        .
      </p>
      <ExerciseGuide locale="en" ids={["back-squat", "front-squat", "lateral-lunge", "step-up", "romanian-deadlift", "copenhagen-plank", "box-jump"]} />
    </>
  );
}
