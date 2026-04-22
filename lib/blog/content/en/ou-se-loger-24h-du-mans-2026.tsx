import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Every June, Le Mans welcomes over 300,000 spectators for the 24 Hours of Le Mans.
        Finding accommodation for the 2026 edition takes planning — hotels are booked
        out months ahead and large houses go the moment booking opens. Here's a
        practical guide to pick where to stay.
      </p>

      <h2>When is the 24 Hours of Le Mans 2026?</h2>
      <p>
        The 94th edition of the 24 Hours of Le Mans takes place on the weekend of{" "}
        <strong>13-14 June 2026</strong>. Free practice and qualifying start on Wednesday,
        and the famous drivers' parade fills the city on Friday evening. Most visitors
        arrive from Thursday and leave Sunday evening or Monday morning — plan a 3 to
        5 night stay.
      </p>

      <h2>The different accommodation areas</h2>
      <h3>Close to the circuit (Arnage, Mulsanne, Ruaudin)</h3>
      <p>
        These villages are right on the track. Supply is very limited, prices soar and
        traffic is permanently blocked. Only worth it if you want to be steps from the
        circuit — otherwise jams will cost you a lot of time.
      </p>

      <h3>Le Mans city (20 min from the circuit off-event, 45-60 min on race days)</h3>
      <p>
        The best compromise. You get to enjoy the historic centre (Plantagenet City,
        cathedral, restaurants) and reach the circuit by car in 20 minutes off-event
        (45-60 min on race days due to traffic).
        Ideal for groups and families wanting to mix the race with sightseeing.
      </p>

      <h3>Surrounding villages (20-40 min)</h3>
      <p>
        Cheaper but trickier: expect jams on Saturday morning and Sunday evening. A
        fallback if the city is full or you're a large group hunting the lowest rate.
      </p>

      <h2>What kind of accommodation to pick?</h2>
      <h3>Classic hotel</h3>
      <p>
        Practical for 1 to 2 people but quickly booked. Rates double or triple during
        the event. Book from January.
      </p>

      <h3>Airbnb / house rental</h3>
      <p>
        The best choice for a group or family. You get a kitchen (avoiding packed
        restaurants), private parking (critical), and real space to relax between sessions
        at the circuit.
      </p>

      <h3>Camping at the circuit</h3>
      <p>
        Incredible atmosphere but short nights. Reserved for fans who want the event
        24/7.
      </p>

      <h2>How much does accommodation cost during the 24 Hours?</h2>
      <ul>
        <li>Basic hotel room: €150-300/night (vs €60-90 off-event)</li>
        <li>Airbnb for 4 people: €200-500/night</li>
        <li>Large group house (10-18 people): €1,500-3,500/night</li>
      </ul>
      <p>
        Tip: the more of you, the lower the per-person cost. A shared house at 15 often
        comes out cheaper than individual hotel rooms.
      </p>

      <h2>Our house — 9 private suites 20 minutes from the circuit</h2>
      <p>
        For groups, large families or businesses, our 215 m² house offers{" "}
        <strong>9 twin bedrooms with en-suite bathrooms</strong>. Up to 18 guests sleep
        in peace, each in their own space, with no compromise on comfort.
      </p>
      <ul>
        <li>20 min from the Bugatti Circuit off-event (45-60 min on race days due to traffic)</li>
        <li>10 min walk from Le Mans TGV station + direct tram T1 to the circuit (~30 min door-to-door, no parking stress)</li>
        <li>Free street parking right in front of the house</li>
        <li>Fully equipped kitchen</li>
        <li>Gym and zen space</li>
        <li>Smart lock: self check-in from 5 pm</li>
      </ul>

      <h2>Tips for booking</h2>
      <ol>
        <li>
          <strong>Book before February</strong>: the best options go from January.
        </li>
        <li>
          <strong>Plan 3-4 nights minimum</strong>: most hosts won't accept one-night
          stays during the event.
        </li>
        <li>
          <strong>Check the parking situation</strong>: a house in a quiet residential
          street, far from the circuit, remains the best bet.
        </li>
        <li>
          <strong>Compare per-person cost</strong>: a large house beats hotels from 6
          guests onwards.
        </li>
        <li>
          <strong>Plan for traffic</strong>: leave 2 hours before the race start on
          Saturday, or even better: take the <strong>T1 tram</strong> from Le Mans
          station (~20 min to the East entrance of the circuit, trams every 4-5 min on
          race day). The most reliable option.
        </li>
      </ol>

      <h2>Ready to book?</h2>
      <p>
        Check <Link href="/en#disponibilite">our availability</Link> for the 24 Hours of Le
        Mans 2026 and secure your stay. You can also discover{" "}
        <Link href="/en/chambres">the 9 bedrooms</Link> or read{" "}
        <Link href="/en#avis">reviews from our previous guests</Link>.
      </p>
    </>
  );
}
