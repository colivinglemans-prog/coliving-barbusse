import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        In volleyball, you jump, you hit, you land, and you do it all again hundreds of times
        per tournament. A volleyball team staying with us can keep up its vertical jump and
        protect its shoulders and knees in{" "}
        <Link href="/en/blog/salle-de-sport-privee-le-mans">the house gym</Link>
        . Here are the sessions we suggest, before and during a tournament.
      </p>

      <h2>What volleyball demands</h2>
      <ul>
        <li>
          <strong>Vertical jump</strong>: strong, fast legs for attacking and blocking.
        </li>
        <li>
          <strong>Controlled landings</strong>: your knees and ankles absorb every jump.
        </li>
        <li>
          <strong>Strong shoulders</strong>: spiking and serving put load on the rotator cuff.
        </li>
        <li>
          <strong>A braced core</strong> that transfers the power from your legs to your arm.
        </li>
      </ul>

      <h2>The jump session (45 minutes)</h2>
      <ul>
        <li>
          <strong>Box jumps</strong>: 4 × 5, 40 to 50 cm box, stepping back down. Aim for
          quality on every jump, not fatigue.
        </li>
        <li>
          <strong>Back squat</strong>: 4 × 5, heavy and fast on the way up.
        </li>
        <li>
          <strong>Barbell hip thrust</strong>: 3 × 8.
        </li>
        <li>
          <strong>Dumbbell walking lunges</strong>: 3 × 8 per leg.
        </li>
        <li>
          <strong>Standing calf raises</strong>: 3 × 15.
        </li>
      </ul>

      <h2>The “shoulder” prehab session (20 minutes)</h2>
      <p>To do before training or on tournament days, with light weights:</p>
      <ul>
        <li>
          <strong>Band external rotations</strong>, elbow tucked in: 3 × 15.
        </li>
        <li>
          <strong>Rope face pull</strong>, high pulley: 3 × 15.
        </li>
        <li>
          <strong>Lat pulldown</strong> on the pulley, wide bar: 3 × 12.
        </li>
        <li>
          <strong>Push-ups</strong>: 3 × 10, shoulder blades active.
        </li>
        <li>
          <strong>Medicine ball thrusters</strong>: 3 × 10, to coordinate legs and arms.
        </li>
      </ul>

      <h2>As a team: the volleyball circuit</h2>
      <p>
        For 6 to 12 players, in pairs: 40 seconds per station, 20 seconds to rotate, two
        rounds. Box jumps, medicine ball thrusters, rower, face pulls, lunges, plank, jump rope,
        band rotations. The coach sets the pace, and the gym holds everyone.
      </p>

      <h2>During the tournament</h2>
      <ul>
        <li>
          <strong>In the morning</strong>: a 15-minute activation, elliptical, band shoulder
          rotations, a few jumps on the spot.
        </li>
        <li>
          <strong>In the evening</strong>: no heavy lifting;{" "}
          <Link href="/en/blog/recuperation-apres-effort-le-mans">recovery routine</Link>
          , a team meal at the big table, and a proper night's sleep.
        </li>
        <li>
          <strong>The shirts</strong> go through the washing machine and tumble dryer for the
          next day.
        </li>
      </ul>

      <h2>Practical information for a club</h2>
      <ul>
        <li>
          9 bedrooms with shower rooms, up to 20 people: the whole team and its staff.
        </li>
        <li>
          10 to 17-year-olds are welcome under the responsibility of their adult coaches; in
          the gym, minors train with an adult.
        </li>
        <li>
          Antarès is served by the direct T1 tram from the station, a 15-minute walk from the
          house.
        </li>
        <li>Payment by invoice in the club's name is possible.</li>
      </ul>
      <p>
        More information in{" "}
        <Link href="/en/blog/equipe-sportive-le-mans">our article for sports teams</Link>
        .
      </p>
      <ExerciseGuide locale="en" ids={["box-jump", "back-squat", "hip-thrust", "walking-lunge", "calf-raise", "band-external-rotation", "face-pull", "lat-pulldown", "push-up", "medicine-ball-thruster"]} />
    </>
  );
}
