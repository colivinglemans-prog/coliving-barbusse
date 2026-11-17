import Image from "next/image";
import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        At the bottom of the garden, in an annexe separate from the house, a proper strength
        and cross-training gym awaits you: squat rack, Olympic bar, 185 kg of weights, cable
        pulley, Concept2 rower and elliptical trainer. It is reserved for your group for the
        whole stay. Here is what it has, what you can do in it, and who it makes a difference
        for.
      </p>

      <h2>A separate gym, reserved for your group</h2>
      <p>
        The gym is not a corner of a garage with a couple of dumbbells: it is a dedicated room,
        separate from the house, with a <strong>floor covered in 20 mm shock-absorbing rubber
        tiles</strong>, the same as in cross-training boxes. You can{" "}
        <strong>drop a bar loaded with bumper plates</strong> after a deadlift or a clean and
        jerk without damaging the floor or waking the house. As the house is rented as a
        whole, the gym is shared with nobody but your group.
      </p>

      <h2>The equipment, zone by zone</h2>

      <h3>Strength: rack, bar and bumpers</h3>
      <ul>
        <li>
          <strong>A squat rack</strong> with a pull-up bar, dip bars and adjustable J-hooks:
          squats, bench press, overhead press, pull-ups and dips, safely.
        </li>
        <li>
          <strong>A 20 kg Olympic bar</strong> (2.20 m), with a squat pad and two collars.
        </li>
        <li>
          <strong>165 kg of bumper plates</strong>, from 2.5 to 25 kg: <strong>up to 185 kg
          on the bar</strong>. Enough to go heavy on squats and deadlifts.
        </li>
        <li>
          <strong>An adjustable weight bench</strong> (flat, incline) and a{" "}
          <strong>weightlifting belt</strong>.
        </li>
      </ul>

      <figure className="my-8">
        <Image
          src="/images/blog/salle-de-sport/cage-powergym.jpg"
          alt="The gym's squat rack: pull-up bar, dip bars, J-hooks and high and low cable pulley"
          width={772}
          height={772}
          sizes="(max-width: 768px) 100vw, 512px"
          className="mx-auto w-full max-w-md rounded-xl bg-white"
        />
        <figcaption className="mt-2 text-center text-sm text-secondary">
          The gym's rack, with its high and low cable pulley (photo: Powergym).
        </figcaption>
      </figure>

      <figure className="my-8">
        <Image
          src="/images/blog/entrainement-salle-de-sport.jpg"
          alt="The gym: the rack, the weight bench, the stacked bumper plates and the weightlifting belt"
          width={1920}
          height={1280}
          sizes="(max-width: 768px) 100vw, 768px"
          className="w-full rounded-xl"
        />
        <figcaption className="mt-2 text-center text-sm text-secondary">
          The bench, the stacked bumpers and the belt, next to the rack.
        </figcaption>
      </figure>

      <h3>The cable pulley and the dumbbells</h3>
      <ul>
        <li>
          <strong>A high and low cable pulley</strong> mounted on the rack, with five
          attachments: a neutral-grip row handle, a triceps rope, a wide lat bar, a single
          handle for working one arm at a time and a short straight bar. Lat pulldowns, rows,
          extensions, curls and shoulder rotations.
        </li>
        <li>
          <strong>60 kg of cast-iron plates</strong> (from 1 to 10 kg) to load the pulley or
          the dumbbells, to the nearest kilo.
        </li>
      </ul>

      <h3>Cardio</h3>
      <ul>
        <li>
          <strong>A Concept2 rower</strong>, the benchmark in gyms and rowing clubs: intervals,
          endurance, timed challenges.
        </li>
        <li>
          <strong>A NordicTrack elliptical trainer</strong>, with no impact on the joints.
        </li>
        <li>
          <strong>A jump rope</strong>.
        </li>
      </ul>

      <h3>Cross-training, bodyweight and mobility</h3>
      <ul>
        <li>
          <strong>A 6 kg medicine ball</strong> and a <strong>wooden plyo box</strong>{" "}
          adjustable from 20 to 50 cm.
        </li>
        <li>
          <strong>Resistance bands</strong>, a <strong>mobility stick</strong> and{" "}
          <strong>floor mats</strong> for warming up, core work and stretching.
        </li>
      </ul>

      <h2>What you can do here</h2>
      <figure className="my-8">
        <Image
          src="/images/blog/salle-de-sport/cage-exercices-powergym.jpg"
          alt="Examples of exercises on the rack: squat, pull-ups, lat pulldown, dips, low cable row"
          width={772}
          height={772}
          sizes="(max-width: 768px) 100vw, 640px"
          className="mx-auto w-full max-w-xl rounded-xl bg-white"
        />
        <figcaption className="mt-2 text-center text-sm text-secondary">
          Squats, pull-ups, dips, rows: what the same rack lets you do (photo: Powergym).
        </figcaption>
      </figure>

      <ul>
        <li>
          <strong>Build strength</strong>: squats, deadlifts, bench press and weighted
          pull-ups, with serious weights.
        </li>
        <li>
          <strong>Build muscle</strong>: bar, cable pulley and dumbbells to work every muscle
          group, from your back to your triceps.
        </li>
        <li>
          <strong>Improve your cardio</strong>: intervals on the rower, endurance on the
          elliptical, jump rope.
        </li>
        <li>
          <strong>Burn calories</strong>: circuits and AMRAPs mixing medicine ball, box jumps,
          jump rope and rower.
        </li>
        <li>
          <strong>Prepare for a competition</strong>: sport-specific strength work, injury
          prevention, activation on the morning of the event.
        </li>
        <li>
          <strong>Recover</strong>: cool-down on the elliptical, mobility and stretching, then
          the zen room.
        </li>
      </ul>
      <p>
        We have put together ready-made sessions, to do alone or as a group, in{" "}
        <Link href="/en/blog/entrainements-salle-de-sport-le-mans">
          our article on workouts
        </Link>
        , and a post-exercise routine in{" "}
        <Link href="/en/blog/recuperation-apres-effort-le-mans">
          our article on recovery
        </Link>
        .
      </p>

      <h2>Who it's for</h2>
      <ul>
        <li>
          <strong>Sports teams</strong> at a tournament or a training camp: strength and
          conditioning happens at the house, between two matches. See{" "}
          <Link href="/en/blog/equipe-sportive-le-mans">our article on sports teams</Link>
          .
        </li>
        <li>
          <strong>Drivers and their teams</strong>, here for the circuit: neck, core, cardio,
          and muscle activation on race morning.
        </li>
        <li>
          <strong>Seminars</strong>: a 20-minute group session before the first meeting wakes
          everyone up better than a third coffee.
        </li>
        <li>
          <strong>Teams on assignment</strong> in Le Mans for several weeks, who don't want to
          stop training.
        </li>
        <li>
          <strong>Families with sporty teenagers</strong>, accompanied by an adult.
        </li>
      </ul>

      <h2>Strength and conditioning, sport by sport</h2>
      <p>One article per discipline, with sessions adapted to this gym:</p>
      <ul>
        <li>
          <Link href="/en/blog/preparation-physique-course-automobile-le-mans">
            Motor racing
          </Link>{" "}
          and{" "}
          <Link href="/en/blog/preparation-physique-karting-le-mans">karting</Link>;
        </li>
        <li>
          <Link href="/en/blog/preparation-physique-cyclisme-le-mans">cycling</Link>,{" "}
          <Link href="/en/blog/preparation-physique-roller-le-mans">inline skating</Link> and{" "}
          <Link href="/en/blog/preparation-physique-course-a-pied-le-mans">running</Link>;
        </li>
        <li>
          <Link href="/en/blog/preparation-physique-volley-ball-le-mans">volleyball</Link>,{" "}
          <Link href="/en/blog/preparation-physique-handball-le-mans">handball</Link> and{" "}
          <Link href="/en/blog/preparation-physique-equitation-le-mans">horse riding</Link>.
        </li>
      </ul>

      <h2>With the rest of the house</h2>
      <ul>
        <li>
          <strong>A zen room with yoga mats</strong> for stretching in peace.
        </li>
        <li>
          <strong>Gué de Maulny park</strong> (10 ha), a 5-minute walk away, for running.
        </li>
        <li>
          <strong>A shower room for every bedroom</strong>: 9 bedrooms, 9 showers, no queue
          after the session.
        </li>
        <li>
          <strong>A washing machine and a tumble dryer</strong> for your sportswear.
        </li>
        <li>
          <strong>A fully equipped kitchen</strong> and a big table seating 16 to 20 for team
          meals.
        </li>
      </ul>

      <h2>Good to know</h2>
      <ul>
        <li>
          <strong>Unsupervised</strong>: everyone uses the gym at their own risk. Warm up,
          choose weights you can control, get a spotter for heavy sets on the bench, and put
          the equipment away after your session.
        </li>
        <li>
          <strong>Minors</strong> train accompanied by an adult (a parent or a club coach).
        </li>
        <li>
          <strong>Drop the bumpers, not the cast iron</strong>: the tiles are made for a bar
          loaded with bumper plates; cast-iron plates and dumbbells are set down.
        </li>
      </ul>

      <h2>Book the house and its gym</h2>
      <p>
        The gym is included when you rent the house, just like the zen room and the garden.
        Check our <Link href="/en#disponibilite">real-time availability</Link>{" "}
        and book direct, commission-free.
      </p>
      <ExerciseGuide locale="en" ids={["back-squat", "deadlift", "bench-press", "pull-up", "seated-cable-row", "rowing", "medicine-ball-thruster", "box-jump"]} />
    </>
  );
}
