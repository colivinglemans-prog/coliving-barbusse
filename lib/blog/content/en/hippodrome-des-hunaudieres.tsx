import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        The Hunaudières Racecourse is the only horse racing track in the Sarthe and one of
        the most prestigious in western France. Throughout the year, it hosts trotting and
        flat races, evening events and family activities. Here's everything you need to
        know to plan your visit.
      </p>

      <h2>Where is the Hunaudières Racecourse?</h2>
      <p>
        Located on Route de Tours south of Le Mans, the Hunaudières Racecourse is operated
        by the Société des Courses du Mans. It features a 1,350 m sand trotting track,
        unique in the region. The racecourse is about a twenty-minute drive from our house
        and easily accessible from Le Mans station.
      </p>

      <h2>2026 schedule: 13 race meetings through the year</h2>
      <p>
        The 2026 racing season kicked off on <strong>4 March 2026</strong> with a flat
        racing meeting. Thirteen meetings are scheduled throughout the year, mixing
        trotting, flat racing and PMU betting races. The calendar balances disciplines
        and highlights the flagship events that have given Le Mans its horse-racing
        reputation.
      </p>
      <p>
        For the full upcoming schedule, visit the official page of the{" "}
        <a href="https://www.letrot.com/hippodromes/le-mans/7207" target="_blank" rel="noopener noreferrer">Société des Courses du Mans</a>{" "}
        or call +33 2 43 84 94 94.
      </p>

      <h2>Flagship meetings not to miss</h2>
      <ul>
        <li>
          <strong>PMU meetings</strong>: regular betting races throughout the year, a
          perfect introduction to horse racing in a relaxed atmosphere.
        </li>
        <li>
          <strong>Evening races</strong>: night meetings with on-site catering, activities
          and a family-friendly vibe.
        </li>
        <li>
          <strong>Grand Prix de la Ville du Mans</strong> (trotting): one of the season's
          premier events.
        </li>
        <li>
          <strong>Horse Day</strong>: children's activities, pony rides, equestrian shows.
        </li>
      </ul>

      <h2>Why attend a race meeting?</h2>
      <ul>
        <li>
          <strong>Affordable entry</strong> (often free or just a few euros), contrary to
          common belief.
        </li>
        <li>
          <strong>Festive atmosphere</strong>: food stalls, drinks and entertainment
          between races.
        </li>
        <li>
          <strong>Discover PMU betting</strong>: regulars happily share tips and insights
          with newcomers.
        </li>
        <li>
          <strong>Green setting</strong>: the racecourse is nestled in the typical Sarthe
          countryside.
        </li>
      </ul>

      <h2>How to get there from our house</h2>
      <ul>
        <li>
          <strong>By car</strong>: ~20 minutes, via Route de Tours south of Le Mans.
        </li>
        <li>
          <strong>Tram + walk</strong>: possible via T1 to the Antarès station, then a few
          minutes on foot.
        </li>
        <li>
          <strong>Taxi / rideshare</strong>: very handy after an evening meeting.
        </li>
      </ul>

      <h2>Your stay in Le Mans around the races</h2>
      <p>
        Our coliving house with <strong>9 private suites with en-suite bathrooms</strong>{" "}
        is ideal for a family or friends' weekend around horse racing. Up to 18 guests in
        a quiet setting, 20 minutes from the racecourse and 10 minutes from the TGV
        station.
      </p>
      <ul>
        <li>Free street parking in a quiet residential area</li>
        <li>215 m² total (common areas, bedrooms and gym/zen annex) to gather after the races</li>
        <li>Fully equipped kitchen for a convivial dinner</li>
        <li>Gym and zen space</li>
        <li>High-speed Wi-Fi</li>
        <li>Smart lock, self check-in from 5 pm</li>
      </ul>

      <h2>Combining with other activities?</h2>
      <p>A day at the races goes perfectly with:</p>
      <ul>
        <li>A visit to <Link href="/en/blog/que-visiter-le-mans-sarthe">Plantagenet City</Link> and the historic centre</li>
        <li>A walk in the <Link href="/en#localisation">Gué de Maulny park</Link></li>
        <li>Dinner at a great <Link href="/en/blog/restos-bars-magasins-le-mans">neighbourhood restaurant</Link></li>
        <li>A visit to the 24 Hours of Le Mans Museum (right next to the circuit)</li>
      </ul>

      <h2>Book your stay</h2>
      <p>
        Check <Link href="/en#disponibilite">our availability</Link> to plan your visit to
        the Hunaudières Racecourse. Our house is perfect for a group that wants to combine
        horse racing, tourism and Sarthe cuisine.
      </p>
    </>
  );
}
