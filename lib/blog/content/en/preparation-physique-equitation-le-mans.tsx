import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        A rider doesn't lift heavy loads, but they hold a posture for hours, absorb every
        stride through the pelvis and give aids with legs that work independently of the upper
        body. We welcome riders here for competitions in the region: here is how to use{" "}
        <Link href="/en/blog/salle-de-sport-privee-le-mans">the house gym</Link>{" "}
        to ride better and look after your back.
      </p>

      <h2>What riding demands</h2>
      <ul>
        <li>
          <strong>A stable core</strong>: core strength lets you follow the horse's movement
          without stiffening or collapsing.
        </li>
        <li>
          <strong>Adductors and glutes</strong> that hold the position, in dressage as well as
          in balance over a fence.
        </li>
        <li>
          <strong>A mobile pelvis</strong> that absorbs the gaits.
        </li>
        <li>
          <strong>A toned upper back</strong> to sit tall, shoulders down.
        </li>
        <li>
          <strong>Symmetry</strong>: every rider has a stronger side.
        </li>
      </ul>

      <h2>The rider's session (40 minutes)</h2>
      <ul>
        <li>
          <strong>Goblet squat</strong> with a 5 or 10 kg bumper plate: 3 × 10, torso upright.
        </li>
        <li>
          <strong>Copenhagen plank</strong> on the bench: 3 × 20 s per side, for the
          adductors.
        </li>
        <li>
          <strong>Barbell hip thrust</strong>: 3 × 10.
        </li>
        <li>
          <strong>Pallof press</strong> on the cable pulley, single handle: 3 × 10 per side,
          without letting your torso rotate.
        </li>
        <li>
          <strong>Seated row</strong> on the low pulley: 3 × 12, shoulder blades squeezed.
        </li>
        <li>
          <strong>Dead bug</strong> on the mat: 3 × 10, to move arms and legs independently.
        </li>
        <li>
          <strong>Walking lunges</strong>: 2 × 8 per leg, keeping an eye on your weaker side.
        </li>
      </ul>

      <h2>Cardio, useful in eventing</h2>
      <p>
        A cross-country course or a long day of competition tires the rider too. 20 to 30
        minutes on the elliptical or the Concept2 rower twice a week is enough to avoid
        finishing the course out of breath.
      </p>

      <h2>On competition day</h2>
      <ul>
        <li>
          <strong>In the morning</strong>: 10 minutes of pelvis and hip mobility on the mat
          (pelvic tilts, hip openers, cat-cow), before heading to the stables.
        </li>
        <li>
          <strong>In the evening</strong>: stretch your adductors, hip flexors and lower back
          in the zen room; see{" "}
          <Link href="/en/blog/recuperation-apres-effort-le-mans">our recovery routine</Link>
          .
        </li>
      </ul>

      <h2>Practical information for riders</h2>
      <ul>
        <li>
          The <strong>Pôle Européen du Cheval</strong> (Yvré-l'Évêque) is about twenty
          minutes away by car, as is the Hunaudières racecourse. See{" "}
          <Link href="/en/blog/concours-equestre-pole-europeen-du-cheval">
            our article on equestrian competitions
          </Link>
          .
        </li>
        <li>
          Horses, horseboxes and lorries stay at the competition venue: the house has no
          stables and no room for a lorry.
        </li>
        <li>
          Washing machine and tumble dryer for your riding clothes, a shower room for every
          bedroom, up to 20 people: riders, coaches and families.
        </li>
        <li>
          Young riders aged 10 to 17 are welcome under the responsibility of their coaches; in
          the gym, minors train with an adult.
        </li>
      </ul>
      <ExerciseGuide locale="en" ids={["goblet-squat", "copenhagen-plank", "hip-thrust", "pallof-press", "seated-cable-row", "dead-bug", "walking-lunge"]} />
    </>
  );
}
