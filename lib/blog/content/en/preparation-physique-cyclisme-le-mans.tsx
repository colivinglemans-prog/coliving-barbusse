import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        A cyclist spends hours on the bike, and that is exactly why the weights room does
        them a favour: stronger legs, a core that holds the position, a back that no longer
        complains after four hours in the saddle. We welcomed a group of cyclists on the 24
        Heures Vélo weekend: here is how to make the most of{" "}
        <Link href="/en/blog/salle-de-sport-privee-le-mans">the house gym</Link>{" "}
        before, during and after an event in Le Mans.
      </p>

      <h2>What strength training brings a cyclist</h2>
      <ul>
        <li>
          <strong>More powerful legs</strong>: more strength means more watts when you
          accelerate and on the climbs.
        </li>
        <li>
          <strong>A solid core</strong>: your pelvis stays stable on the saddle, and your
          pedal stroke doesn't leak power.
        </li>
        <li>
          <strong>A back and neck that hold</strong> the aero position.
        </li>
        <li>
          <strong>Stronger bones and tendons</strong>: cycling, a non-weight-bearing sport,
          puts little load on them.
        </li>
      </ul>

      <h2>The cyclist's strength session (50 minutes)</h2>
      <p>To do once or twice a week outside the racing season:</p>
      <ul>
        <li>
          <strong>Back squat</strong> in the rack: 4 × 6, hard but clean.
        </li>
        <li>
          <strong>Romanian deadlift</strong>: 3 × 8, for the hamstrings and glutes, often
          lagging behind in cyclists.
        </li>
        <li>
          <strong>Box step-up</strong> (40 to 50 cm) with dumbbells: 3 × 8 per leg, to correct
          the gap between your strong leg and your weak leg.
        </li>
        <li>
          <strong>Barbell hip thrust</strong>, back on the bench: 3 × 10.
        </li>
        <li>
          <strong>Seated row</strong> on the low pulley: 3 × 12, for the upper back.
        </li>
        <li>
          <strong>Core</strong>: plank 3 × 40 s, side plank 2 × 30 s per side, dead bug 2 ×
          10.
        </li>
      </ul>

      <h2>As a race approaches</h2>
      <p>
        In race week, you keep a little strength work but without fatigue: 2 × 5 light, fast
        squats, some core work, and that's it. The day before, 15 minutes on the elliptical
        and some hip mobility are enough.
      </p>

      <h2>The 24 Heures Vélo: relays and recovery</h2>
      <p>
        At the end of August, the Bugatti circuit hosts the{" "}
        <Link href="/en/blog/24-heures-velo-le-mans-2027">24 Heures Vélo</Link>, solo or as a
        team. For a relay team staying at the house, 4.7 km from the circuit:
      </p>
      <ul>
        <li>
          <strong>Between two stints</strong>: 10 very easy minutes on the elliptical to get
          the blood flowing, a shower in your own bedroom, something to eat, and sleep in
          total darkness thanks to the roller shutters.
        </li>
        <li>
          <strong>After the race</strong>: the routine from{" "}
          <Link href="/en/blog/recuperation-apres-effort-le-mans">our recovery article</Link>
          , focusing on the hips, hamstrings and lower back.
        </li>
      </ul>

      <h2>The rower, your ally on days off the bike</h2>
      <p>
        The Concept2 rower works the upper body that cycling neglects, with no impact. A
        20-minute endurance session, or 6 × 3 hard minutes, keeps your engine ticking over on
        rainy days or rest days for your legs.
      </p>

      <h2>Practical information for a cycling team</h2>
      <ul>
        <li>
          <strong>Bikes are stored under cover in the zen room</strong>, indoors.
        </li>
        <li>
          <strong>Washing machine and tumble dryer</strong> for bib shorts and jerseys.
        </li>
        <li>
          <strong>A shower room for every bedroom</strong>, 9 bedrooms, up to 20 people.
        </li>
        <li>
          The TGV station is a 15-minute walk away, about 55 minutes from Paris.
        </li>
      </ul>
      <p>
        For other sessions, see{" "}
        <Link href="/en/blog/entrainements-salle-de-sport-le-mans">
          our workouts, solo or as a group
        </Link>{" "}
        and{" "}
        <Link href="/en/blog/equipe-sportive-le-mans">our article for sports teams</Link>
        .
      </p>
      <ExerciseGuide locale="en" ids={["back-squat", "romanian-deadlift", "step-up", "hip-thrust", "seated-cable-row", "plank", "side-plank", "dead-bug", "rowing"]} />
    </>
  );
}
