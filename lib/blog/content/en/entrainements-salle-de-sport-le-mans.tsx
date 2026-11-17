import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        You're at the house for a few days and the gym is at the bottom of the garden. Here
        are ready-made sessions to follow, alone or as a group, from 20 to 60 minutes,
        depending on your goal: strength, muscle gain, cardio, weight loss or simply getting
        back into it. They all use the equipment in{" "}
        <Link href="/en/blog/salle-de-sport-privee-le-mans">our private gym</Link>.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>
          <strong>No set weights</strong>: loads are expressed as perceived effort. “Hard”
          means you have two reps left in the tank at the end of the set; “max”, none at all.
        </li>
        <li>
          <strong>Warm-up common to every session</strong> (8 to 10 minutes): 5 easy minutes
          on the rower or the elliptical, then 2 rounds of 10 shoulder rotations with the
          stick, 10 bodyweight squats, 10 lunges, 10 push-ups and a 20-second plank.
        </li>
        <li>
          <strong>Unsupervised</strong>: you use the gym at your own risk. Increase the
          weights gradually, get a spotter on the bench, and if you have any doubts about your
          health, ask a doctor before you start. Minors train with an adult.
        </li>
        <li>
          <strong>The floor is made for dropping a bar loaded with bumper plates</strong> (20
          mm rubber tiles); cast iron and dumbbells are set down.
        </li>
      </ul>

      <h2>Solo sessions</h2>

      <h3>Strength (60 minutes)</h3>
      <ul>
        <li>
          <strong>Back squat</strong> in the rack: 5 sets of 5, hard, 2 to 3 minutes' rest.
        </li>
        <li>
          <strong>Bench press</strong> on the bench, in the rack with the safety bars: 5 × 5.
        </li>
        <li>
          <strong>Pull-ups</strong> on the rack's bar: 4 sets of max reps minus one (with a
          band to assist if needed).
        </li>
        <li>
          <strong>Seated cable row on the low pulley</strong>, neutral-grip row handle: 3 × 10.
        </li>
        <li>Finish with 3 × 30-second planks.</li>
      </ul>

      <h3>Muscle gain, upper body (50 minutes)</h3>
      <ul>
        <li>Incline bench press: 4 × 8 to 10.</li>
        <li>Lat pulldown on the high pulley, wide bar: 4 × 10 to 12.</li>
        <li>Standing barbell overhead press: 3 × 8.</li>
        <li>Dips: 3 sets of max reps minus two.</li>
        <li>Cable triceps pushdown, rope or short straight bar: 3 × 12 to 15.</li>
        <li>Single-arm cable row on the low pulley, single handle: 3 × 10 per arm.</li>
        <li>Cable biceps curl on the low pulley, short straight bar or rope: 3 × 12.</li>
      </ul>

      <h3>Muscle gain, lower body (50 minutes)</h3>
      <ul>
        <li>Front squat or back squat: 4 × 8.</li>
        <li>Barbell Romanian deadlift: 4 × 10.</li>
        <li>Dumbbell walking lunges: 3 × 10 per leg.</li>
        <li>Box step-ups (30 to 40 cm): 3 × 10 per leg.</li>
        <li>Standing calf raises, bar on your back: 4 × 15.</li>
      </ul>

      <h3>Rowing cardio (35 minutes)</h3>
      <ul>
        <li>
          <strong>8 × 500 m</strong> on the Concept2, at a strong, steady pace, with 1 min 30
          rest between each. Note your average time: it's your benchmark for next time.
        </li>
        <li>
          Endurance option: <strong>30 minutes on the elliptical</strong> at an intensity
          where you can still talk.
        </li>
      </ul>

      <h3>Fat burner (20-minute AMRAP)</h3>
      <p>As many rounds as possible in 20 minutes, at a pace you can sustain:</p>
      <ul>
        <li>10 medicine ball thrusters (6 kg)</li>
        <li>10 box jumps (or step-ups)</li>
        <li>50 jump rope skips</li>
        <li>200 m on the rower</li>
      </ul>

      <h3>Business traveller's reboot (30 minutes)</h3>
      <p>
        For anyone coming out of a day of meetings or on site with neither the energy nor the
        appetite for a big session: 10 minutes on the elliptical, then 3 rounds of 12 goblet
        squats with a 5 or 10 kg bumper plate, 12 low cable rows, 10 push-ups and a 30-second
        plank. Finish with 5 minutes of stretching in the zen room.
      </p>

      <h3>Mobility (20 minutes)</h3>
      <p>
        For rest days or backs stiff from the road: shoulder pass-throughs with the stick, a
        deep squat held while hanging on to the rack, hip openers on the mat, band shoulder
        rotations, then stretching. The details are in{" "}
        <Link href="/en/blog/recuperation-apres-effort-le-mans">
          our article on recovery
        </Link>
        .
      </p>

      <h2>Group sessions</h2>

      <h3>In pairs: “I work, you rest” (40 minutes)</h3>
      <p>
        Only one partner works at a time while the other recovers; switch after every set. 5
        rounds of:
      </p>
      <ul>
        <li>250 m on the rower (your partner holds a plank in the meantime);</li>
        <li>8 barbell deadlifts, at a shared weight;</li>
        <li>10 medicine ball thrusters.</li>
      </ul>

      <h3>Station circuit for 6 to 10 people (45 minutes)</h3>
      <p>
        Everyone starts at a station; 40 seconds of work, 20 seconds to switch. Two or three
        rounds depending on level.
      </p>
      <ol>
        <li>Rower</li>
        <li>Elliptical trainer</li>
        <li>Medicine ball thrusters</li>
        <li>Box jumps or step-ups</li>
        <li>Jump rope</li>
        <li>High-pulley lat pulldown</li>
        <li>Pull-ups or dips (with a band if needed)</li>
        <li>Goblet squats with a bumper plate</li>
        <li>Plank on the mat</li>
        <li>Push-ups</li>
      </ol>
      <p>
        With more than 10, split into two groups: one in the gym, the other jogging in Gué de
        Maulny park, a 5-minute walk away, then swap.
      </p>

      <h3>Team rowing relay</h3>
      <p>
        The challenge that brings everyone together: <strong>5,000 m as a team</strong>, in
        250 m relay legs, as fast as possible. Write the time down on a sheet, and do it again
        on the last day of your stay to see who has improved.
      </p>

      <h3>Seminar wake-up session (20 minutes, all levels)</h3>
      <p>
        Before the first meeting, for a team that doesn't necessarily train: 5 minutes on the
        rower or the elliptical, taking turns, then 2 rounds of 10 squats, 10 push-ups against
        the box, 10 band rows and a 20-second plank, then 5 minutes of stretching. Nobody
        finishes exhausted, everybody arrives wide awake.
      </p>

      <h2>A typical week</h2>
      <ul>
        <li>
          <strong>Two-night weekend</strong>: a strength session or a circuit on the first
          evening, a jog and some mobility the next morning.
        </li>
        <li>
          <strong>One-week stay</strong>: strength on Monday, rowing cardio on Tuesday, upper
          body on Wednesday, mobility on Thursday, lower body on Friday, AMRAP or team relay
          on Saturday, rest on Sunday.
        </li>
        <li>
          <strong>Long stay, on assignment</strong>: three sessions a week (strength, upper
          body, lower body) and one cardio session are enough to make progress.
        </li>
      </ul>

      <h2>And depending on your sport</h2>
      <p>
        For sessions adapted to a specific discipline, read our strength and conditioning
        articles: <Link href="/en/blog/preparation-physique-course-automobile-le-mans">motor
        racing</Link>, <Link href="/en/blog/preparation-physique-karting-le-mans">karting</Link>,{" "}
        <Link href="/en/blog/preparation-physique-cyclisme-le-mans">cycling</Link>,{" "}
        <Link href="/en/blog/preparation-physique-roller-le-mans">inline skating</Link>,{" "}
        <Link href="/en/blog/preparation-physique-course-a-pied-le-mans">running</Link>,{" "}
        <Link href="/en/blog/preparation-physique-volley-ball-le-mans">volleyball</Link>,{" "}
        <Link href="/en/blog/preparation-physique-handball-le-mans">handball</Link> and{" "}
        <Link href="/en/blog/preparation-physique-equitation-le-mans">horse riding</Link>.
      </p>
      <ExerciseGuide locale="en" ids={["back-squat", "front-squat", "goblet-squat", "bench-press", "incline-bench-press", "overhead-press", "romanian-deadlift", "deadlift", "pull-up", "dips", "push-up", "seated-cable-row", "single-arm-cable-row", "lat-pulldown", "triceps-pushdown", "cable-curl", "walking-lunge", "step-up", "calf-raise", "medicine-ball-thruster", "box-jump", "jump-rope", "rowing", "plank"]} />
    </>
  );
}
