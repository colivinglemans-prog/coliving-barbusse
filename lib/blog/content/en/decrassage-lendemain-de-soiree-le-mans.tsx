import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        A wedding in the area, a birthday dinner at a restaurant, a night out in town or a
        win celebrated after the race: the next morning, your legs feel heavy and so does
        your head. Rather than staying on the sofa, a gentle recovery session helps you get
        going again. Here is how to do it at the house, with{" "}
        <Link href="/en/blog/salle-de-sport-privee-le-mans">the gym</Link>, the zen room and
        the nearby park.
      </p>

      <h2>What a recovery session does, and what it doesn&apos;t</h2>
      <ul>
        <li>
          <strong>It gets your body moving again</strong>: your circulation picks up, muscles
          stiff from dancing or a short night loosen up, and you often feel better afterwards
          than before.
        </li>
        <li>
          <strong>It doesn&apos;t clear alcohol any faster</strong>: only time does that. You
          can&apos;t “sweat out” a night out.
        </li>
        <li>
          <strong>It doesn&apos;t replace water, sleep or a proper breakfast</strong>.
        </li>
      </ul>

      <h2>Before you start</h2>
      <ul>
        <li>
          <strong>If you were still drinking not long ago, skip the session</strong>: your
          balance and reflexes haven&apos;t come back yet. No heavy weights, no box jumps, no
          bar overhead that day.
        </li>
        <li>
          <strong>Drink first</strong>: a big glass of water, and keep a bottle within reach
          during the session.
        </li>
        <li>
          <strong>Eat a little</strong>: some bread, a banana, something simple. The kitchen
          is fully equipped, and so is the bean-to-cup coffee machine.
        </li>
        <li>
          Dizziness, nausea, a racing heart: stop and rest. A recovery session should stay
          enjoyable.
        </li>
      </ul>

      <h2>The recovery session (30 minutes)</h2>
      <ul>
        <li>
          <strong>10 to 15 minutes of very easy cardio</strong> on the elliptical trainer or
          the Concept2 rower. You should be able to talk effortlessly. If the rower feels too
          hard, the elliptical is enough.
        </li>
        <li>
          <strong>Mobility, 10 minutes</strong>: shoulder pass-throughs with the stick, cat-cow
          on all fours, a deep squat held while hanging on to the rack, low lunge for 30
          seconds per side.
        </li>
        <li>
          <strong>A little light strength work</strong> if you feel up to it: 2 rounds of 10
          goblet squats with a 5 kg bumper plate, 10 low cable rows, a 20-second plank.
        </li>
        <li>
          <strong>Stretching in the zen room</strong>, on the yoga mats, breathing slowly: 5
          minutes.
        </li>
      </ul>

      <h2>Or outside: a walk in the park</h2>
      <p>
        <strong>Gué de Maulny park</strong> (10 ha) is a 5-minute walk away. A 20 to
        30-minute walk in the fresh air, as a group, often does as much good as the gym, and
        nobody needs to get changed. Those feeling fitter can jog a lap.
      </p>

      <h2>As a group: a collective recovery session</h2>
      <p>
        After a wedding or a weekend with friends, you can do the session together: one group
        in the gym (elliptical and rower in turn, mobility on the mats), the other walking in
        the park, then swap. Everyone ends up around the big kitchen table, seating 16, or 20
        with the sunroom&apos;s mini-tables, for brunch.
      </p>

      <h2>The rest of the morning</h2>
      <ul>
        <li>
          <strong>A shower</strong> in your own shower room: 9 bedrooms, 9 showers, no waiting
          even with 20 of you.
        </li>
        <li>
          <strong>A nap</strong> if you need one: the bedrooms&apos; roller shutters black the
          room out completely, even in broad daylight.
        </li>
        <li>
          <strong>Check-out</strong> is before 11 am; late check-out is possible on request,
          at extra cost and subject to availability. Handy the day after a wedding.
        </li>
      </ul>

      <h2>Good to know</h2>
      <ul>
        <li>
          The house welcomes families and groups, but <strong>it isn&apos;t a party
          venue</strong>: no parties or noisy evenings on site. The party happens in town or
          at the reception venue, the night and the morning after at the house.
        </li>
        <li>
          The gym is used unsupervised, at everyone&apos;s own risk; minors with an adult.
        </li>
        <li>
          For a fuller session on the following days, see{" "}
          <Link href="/en/blog/entrainements-salle-de-sport-le-mans">
            our sessions, solo or as a group
          </Link>{" "}
          and{" "}
          <Link href="/en/blog/recuperation-apres-effort-le-mans">
            our recovery routine
          </Link>
          .
        </li>
      </ul>
      <ExerciseGuide locale="en" ids={["rowing", "goblet-squat", "seated-cable-row", "plank"]} />
    </>
  );
}
