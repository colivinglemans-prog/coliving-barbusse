import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Driving a race car means absorbing lateral forces through your neck, keeping your
        heart rate high for entire stints, and staying sharp until the last lap. For the
        drivers and teams who stay with us during the 24 Hours of Le Mans, Le Mans Classic or
        a club race, here is how to use{" "}
        <Link href="/en/blog/salle-de-sport-privee-le-mans">the house gym</Link>{" "}
        before and during race weekend.
      </p>

      <h2>What racing demands of the body</h2>
      <ul>
        <li>
          <strong>The neck</strong>: through fast corners and under braking, your head and
          helmet weigh several times their own weight. It's the first muscle to give out at
          the end of a stint.
        </li>
        <li>
          <strong>The core</strong>: solid core strength holds the driver in the seat and
          takes the strain off the back.
        </li>
        <li>
          <strong>The forearms and shoulders</strong>: heavy steering, vibration, long hours.
        </li>
        <li>
          <strong>The heart</strong>: your heart rate stays high throughout a stint, in a hot
          cockpit. Good endurance helps you keep your concentration.
        </li>
      </ul>

      <h2>In the weeks before: the typical session</h2>
      <p>
        If you arrive several days before the race (practice, test day, scrutineering), here
        is a 50-minute session to do two or three times, staying well away from maximum
        fatigue:
      </p>
      <ul>
        <li>
          <strong>Neck</strong>: first isometrics, with no equipment, pushing your head
          against your hand in all four directions, 4 × 15 seconds per direction. Then lying on
          the bench with your head over the edge, slow flexions using only the weight of your
          head, on your back, your front and each side, 2 × 12. Progress gently, never with
          brute force.
        </li>
        <li>
          <strong>Anti-rotation core work</strong> on the cable pulley, single handle held in
          both hands in front of your chest, arms straight, without letting your torso rotate
          (Pallof press): 3 × 10 per side.
        </li>
        <li>
          <strong>Seated row</strong> on the low pulley: 3 × 12, for the upper back and your
          posture in the seat.
        </li>
        <li>
          <strong>Forearms</strong>: dead hang from the pull-up bar, 3 × 30 seconds, and
          farmer's walk with two loaded dumbbells, 3 × 30 m.
        </li>
        <li>
          <strong>Legs</strong>: goblet squat, 3 × 10, for your braking leg and getting in and
          out of the car.
        </li>
        <li>
          <strong>Cardio</strong>: 20 minutes on the Concept2 rower or the elliptical, in
          intervals of 3 hard minutes and 1 easy minute.
        </li>
      </ul>

      <h2>The day before the race</h2>
      <p>
        You are no longer trying to improve: you are maintaining. 20 easy minutes on the
        elliptical, mobility with the stick and the band for your shoulders and neck, and
        nothing heavy. In the evening, sleep is the priority: every bedroom has roller
        shutters that black out the room completely, even in broad daylight, and its own
        shower room.
      </p>

      <h2>Race morning: a 15-minute activation</h2>
      <ul>
        <li>5 minutes on the rower or the elliptical, building up gradually.</li>
        <li>Slow neck and shoulder rotations, then light neck isometrics, 2 × 10 s.</li>
        <li>10 bodyweight squats, 10 push-ups, a 20-second plank.</li>
        <li>A few jump rope skips to finish, without getting out of breath.</li>
      </ul>
      <p>
        The idea is to arrive at the circuit awake, not tired. The circuit is 4.7 km from the
        house.
      </p>

      <h2>During an endurance race</h2>
      <p>
        Between two stints, if the schedule brings you back to the house, 10 very easy
        minutes on the elliptical, a few neck and back stretches in the zen room, a shower and
        some sleep are worth more than anything else. Recovery is covered in detail in{" "}
        <Link href="/en/blog/recuperation-apres-effort-le-mans">
          our article on post-exercise recovery
        </Link>
        .
      </p>

      <h2>And the mechanics</h2>
      <p>
        A race week also means mechanics carrying wheels, bending over engines and getting
        little sleep. For them:
      </p>
      <ul>
        <li>
          <strong>The back</strong>: light, clean deadlifts, 3 × 8, and cable rows, to teach
          the back to carry loads without getting injured.
        </li>
        <li>
          <strong>The shoulders</strong>: band external rotations, 3 × 15, and face pulls with
          the triceps rope on the high pulley.
        </li>
        <li>
          <strong>In the evening</strong>: hip and back mobility on the mat, 10 minutes.
        </li>
      </ul>

      <h2>Practical information</h2>
      <ul>
        <li>
          The gym is <strong>reserved for your team</strong>: the house is rented as a whole,
          9 bedrooms and up to 20 people, with drivers, engineers and mechanics under one
          roof.
        </li>
        <li>
          <strong>Unsupervised</strong>: if your strength and conditioning coach travels with
          you, they will find the equipment they need; otherwise, stick to weights you can
          control.
        </li>
        <li>
          Equipment, lorries and trailers stay in the paddock: there is no room for them in
          the street.
        </li>
      </ul>
      <p>
        For karting drivers, read{" "}
        <Link href="/en/blog/preparation-physique-karting-le-mans">
          our article dedicated to karting
        </Link>
        . For accommodation during the big races, see{" "}
        <Link href="/en/blog/ou-se-loger-24h-du-mans-2027">
          where to stay for the 2027 24 Hours of Le Mans
        </Link>{" "}
        and{" "}
        <Link href="/en/blog/exposants-ecuries-circuit-le-mans">
          our article for teams and exhibitors
        </Link>
        .
      </p>
      <ExerciseGuide locale="en" ids={["neck-isometrics", "pallof-press", "seated-cable-row", "farmer-walk", "goblet-squat", "romanian-deadlift", "band-external-rotation", "face-pull", "rowing"]} />
    </>
  );
}
