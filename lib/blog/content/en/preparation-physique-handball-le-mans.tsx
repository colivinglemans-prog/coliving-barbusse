import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Handball strings together sprints, duels, changes of direction and jump shots: a
        contact sport that puts strain on the knees and on the shoulder of the throwing arm.
        In August 2026, a women's handball team spent a tournament weekend at the house, 19
        people including staff. Here is how to use{" "}
        <Link href="/en/blog/salle-de-sport-privee-le-mans">the house gym</Link>{" "}
        to prepare for a match or a training camp.
      </p>

      <h2>What handball demands</h2>
      <ul>
        <li>
          <strong>Explosiveness</strong>: starts, jumps, footwork.
        </li>
        <li>
          <strong>Protected knees</strong>: landings and changes of direction are the main
          injury risk.
        </li>
        <li>
          <strong>A strong throwing shoulder</strong>, especially at the back of the shoulder.
        </li>
        <li>
          <strong>A strong core</strong> for the duels.
        </li>
      </ul>

      <h2>The strength and power session (50 minutes)</h2>
      <ul>
        <li>
          <strong>Box jumps</strong>: 4 × 4, silent landing, knees tracking over your feet.
        </li>
        <li>
          <strong>Back squat</strong>: 4 × 5.
        </li>
        <li>
          <strong>Romanian deadlift</strong>: 3 × 8, for the hamstrings, which protect the
          knee.
        </li>
        <li>
          <strong>Dumbbell walking lunges</strong>: 3 × 8 per leg.
        </li>
        <li>
          <strong>Bench press</strong>: 3 × 6.
        </li>
        <li>
          <strong>Pull-ups</strong>: 3 sets of max reps minus one.
        </li>
        <li>
          <strong>Medicine ball thrusters</strong>: 3 × 10, explosive push.
        </li>
      </ul>

      <h2>Prehab, to do before every session (15 minutes)</h2>
      <ul>
        <li>
          <strong>Shoulder</strong>: band external rotations 3 × 15, rope face pull 3 × 15.
        </li>
        <li>
          <strong>Knees</strong>: single-leg landings from the low box (20 cm), 3 × 5 per leg,
          holding the landing for 2 seconds, knee tracking over the foot.
        </li>
        <li>
          <strong>Adductors</strong>: Copenhagen plank, 2 × 20 s per side.
        </li>
        <li>
          <strong>Core</strong>: side plank, 2 × 30 s per side.
        </li>
      </ul>

      <h2>The team circuit</h2>
      <p>
        For a squad of 14 to 16 players: two groups. The first does the station circuit in
        the gym (rower, box jumps, medicine ball thrusters, cable pulley, pull-ups, plank, jump
        rope, lunges), the second goes for a jog in Gué de Maulny park, a 5-minute walk away.
        Swap after 20 minutes.
      </p>

      <h2>Tournament weekend</h2>
      <ul>
        <li>
          <strong>On match morning</strong>: a 15-minute activation (elliptical, shoulder and
          knee prehab), then off to the venue.
        </li>
        <li>
          <strong>Between two matches</strong>: a team meal at the big table seating 16 to 20,
          shirts in the washing machine.
        </li>
        <li>
          <strong>In the evening</strong>:{" "}
          <Link href="/en/blog/recuperation-apres-effort-le-mans">recovery routine</Link>{" "}
          and a proper night's sleep, everyone in their own bedroom.
        </li>
      </ul>

      <h2>Practical information for a club</h2>
      <ul>
        <li>
          Antarès, which also hosts handball matches, is served by the direct T1 tram from the
          station, a 15-minute walk from the house.
        </li>
        <li>
          9 bedrooms with shower rooms, up to 20 people; 10 to 17-year-olds under the
          responsibility of their coaches, minors in the gym with an adult.
        </li>
        <li>Payment by invoice in the club's name is possible.</li>
      </ul>
      <p>
        More information in{" "}
        <Link href="/en/blog/equipe-sportive-le-mans">our article for sports teams</Link>
        .
      </p>
      <ExerciseGuide locale="en" ids={["box-jump", "back-squat", "romanian-deadlift", "walking-lunge", "bench-press", "pull-up", "medicine-ball-thruster", "band-external-rotation", "face-pull", "copenhagen-plank", "side-plank"]} />
    </>
  );
}
