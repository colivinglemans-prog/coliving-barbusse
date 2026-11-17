import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        A match, a race, a day at a training camp or a night-time relay: what you do in the
        hours that follow matters as much as the effort itself, especially when another event
        awaits you the next day. Here is a recovery routine to follow at the house, using the
        gym, the zen room and the rest of the house.
      </p>

      <h2>In the first half-hour: come down gently</h2>
      <ul>
        <li>
          <strong>A 10-minute cool-down</strong> on the elliptical trainer or the Concept2
          rower, at a very easy pace where you can talk effortlessly. You help your body wind
          down instead of collapsing on the sofa.
        </li>
        <li>
          <strong>Drink</strong> and have a first snack: the kitchen is fully equipped, you
          just need to have done the shopping.
        </li>
        <li>
          <strong>A shower</strong>: every bedroom has its own shower room, so there is no
          queue, even with 20 of you.
        </li>
      </ul>

      <h2>The mobility routine (20 minutes)</h2>
      <p>
        To do in the zen room, on the yoga mats, or in the gym on the floor mats:
      </p>
      <ul>
        <li>
          <strong>Shoulders</strong>: shoulder pass-throughs with the stick, from front to
          back, 2 × 10; then band external rotations, 2 × 15, with no heavy resistance.
        </li>
        <li>
          <strong>Back</strong>: cat-cow on all fours, 10 times slowly; then hang from the
          pull-up bar, 2 × 20 seconds, feet on the floor if needed, to decompress.
        </li>
        <li>
          <strong>Hips</strong>: deep squat held for 1 minute while hanging on to the rack,
          low lunge for 45 seconds per side, pigeon pose for 1 minute per side.
        </li>
        <li>
          <strong>Legs</strong>: hamstring stretch with a band, lying on your back, 45 seconds
          per leg; calf stretch against the wall, 45 seconds per leg.
        </li>
        <li>
          <strong>Neck</strong> (after a race or a long journey): slow tilts and rotations, 5
          per side.
        </li>
      </ul>

      <h2>The team meal</h2>
      <p>
        After exercise, you need carbohydrates to refill your stores and protein for your
        muscles. The big kitchen table <strong>seats 16, or 20</strong>{" "}
        if you pull up the sunroom's mini-tables: the whole team eats together, at a time
        that suits them, food you cook yourselves. The kitchen has two ovens, two hobs, big
        pans and crockery for 20.
      </p>

      <h2>Sleep, the real game-changer</h2>
      <ul>
        <li>
          <strong>A bedroom per person or per pair</strong>, each with its own door and key:
          nobody gets woken up when the last one comes in.
        </li>
        <li>
          <strong>Roller shutters that black out the room completely</strong>, even in broad
          daylight: essential for night shifts and for drivers sleeping between two stints.
          See also{" "}
          <Link href="/en/blog/equipe-de-nuit-le-mans">our article on night shifts</Link>
          .
        </li>
        <li>
          <strong>A house in a quiet residential neighbourhood</strong>.
        </li>
      </ul>

      <h2>The next morning</h2>
      <ul>
        <li>
          <strong>Recovery run</strong>: 20 minutes of very slow jogging in Gué de Maulny
          park, a 5-minute walk away, or 20 minutes on the elliptical if your legs feel heavy.
        </li>
        <li>
          <strong>Mobility</strong>: the same routine as the night before, in a shorter
          version.
        </li>
        <li>
          <strong>No heavy session</strong> the day after a competition: strength work resumes
          two days later.
        </li>
      </ul>

      <h2>Clean kit for the next day</h2>
      <p>
        A two-day tournament means two sets of kit. The house has a{" "}
        <strong>washing machine and a tumble dryer</strong>: Saturday's shirts are ready for
        Sunday.
      </p>

      <h2>Practical information</h2>
      <ul>
        <li>
          The gym, the zen room and the garden are included when you rent the whole house.
          The full list of equipment is in{" "}
          <Link href="/en/blog/salle-de-sport-privee-le-mans">
            our article on the gym
          </Link>
          .
        </li>
        <li>
          This advice does not replace that of your physio or your doctor if you are in pain
          or injured.
        </li>
        <li>
          To train during your stay, see{" "}
          <Link href="/en/blog/entrainements-salle-de-sport-le-mans">
            our sessions, solo or as a group
          </Link>
          .
        </li>
      </ul>
      <ExerciseGuide locale="en" ids={["rowing", "band-external-rotation"]} />
    </>
  );
}
