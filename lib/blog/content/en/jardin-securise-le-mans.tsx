import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        As the warm season returns, our garden is ready to welcome you. A 90 m² private outdoor
        space, fully enclosed and secure, right in the heart of Le Mans: the perfect spot to
        enjoy long summer evenings with family, friends or a group.
      </p>

      <h2>A fully enclosed, secure garden</h2>
      <p>
        The garden is <strong>fully walled in</strong>: a real cocoon, away from prying eyes and
        traffic. It's reassuring for families with young children, who can play outside safely,
        and great for groups who want a private space all to themselves. Facing
        <strong> due south</strong>, it enjoys sunshine all day long.
      </p>

      <h2>An outdoor space designed for gathering</h2>
      <p>
        The garden was set up to comfortably host a large group — just like the house itself,
        which sleeps up to 20 across its 9 suites:
      </p>
      <ul>
        <li>
          <strong>8-seater lounge furniture</strong>: sofas and armchairs for sunny aperitifs
          and relaxing moments.
        </li>
        <li>
          <strong>Large tables to dine outside for up to 20 people</strong>: perfect for team
          meals, family dinners or barbecues with friends.
        </li>
        <li>
          <strong>90 m² in total</strong>: 25 m² of planting plus a generous, easy-living
          gravelled area.
        </li>
      </ul>

      <h2>Ideal for every kind of stay</h2>
      <ul>
        <li>
          <strong>Families</strong>: an enclosed, secure space where children play freely while
          parents relax.
        </li>
        <li>
          <strong>Groups of friends</strong>: sunny aperitifs, long tables and convivial
          evenings without disturbing the neighbours.
        </li>
        <li>
          <strong>Clubs and circuit events</strong> (24 Hours, Le Mans Classic, MotoGP): the
          place to regroup among enthusiasts after a day at the track.
        </li>
        <li>
          <strong>Seminars and corporate stays</strong>: a pleasant outdoor setting for breaks
          and team meals.
        </li>
      </ul>

      <h2>A stone's throw from the centre and the circuit</h2>
      <p>
        The house is ideally located: a 10-minute walk from Le Mans station (direct T1 tram to
        the circuit), 20 minutes from the Bugatti Circuit and very close to Plantagenet City.
        After a day of sightseeing or racing, nothing beats coming home to enjoy the garden.
      </p>

      <h2>Book your stay</h2>
      <p>
        Enjoy the garden and the whole house for your next stay in Le Mans. Check our{" "}
        <Link href="/en#disponibilite">real-time availability</Link> and book direct, with no
        commission.
      </p>
    </>
  );
}
