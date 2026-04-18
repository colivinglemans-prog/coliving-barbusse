import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Le Mans is much more than a motor racing circuit. Between its listed medieval
        heritage, Sarthe gastronomy and preserved nature, the city and region make an
        ideal destination for a weekend or family holiday. Here are the must-sees.
      </p>

      <h2>Plantagenet City, Le Mans's medieval gem</h2>
      <p>
        Listed among Europe's finest medieval ensembles, Plantagenet City (Cité
        Plantagenêt) is the historic heart of Le Mans. Its cobbled streets,
        half-timbered houses and Gallo-Roman ramparts have been used as backdrops for
        many films (Cyrano de Bergerac, The Three Musketeers, Le Bossu…).
      </p>
      <ul>
        <li>
          <strong>Saint-Julien Cathedral</strong>: one of the largest in France, a Gothic
          masterpiece. Free entry.
        </li>
        <li>
          <strong>Roman ramparts</strong>: 3rd century, among the best preserved in the
          Roman world.
        </li>
        <li>
          <strong>Nuit des Chimères</strong> (July-August): spectacular light-show over
          the city, free and magical.
        </li>
      </ul>

      <h2>The 24 Hours of Le Mans Museum</h2>
      <p>
        Next to the Bugatti Circuit, the museum tells a century of racing history with
        over 140 legendary vehicles: Bentley, Ford GT40, Porsche 917, Peugeot 905, Audi
        R18… A must for enthusiasts, and fascinating even for newcomers.
      </p>

      <h2>Épau Abbey</h2>
      <p>
        A 13th-century Cistercian monument a few kilometres from the centre. Épau Abbey
        hosts each spring the prestigious <strong>Épau Festival</strong> dedicated to
        classical music. The grounds are beautiful, ideal for a family walk.
      </p>

      <h2>Visiting the Sarthe with family</h2>
      <h3>La Flèche Zoo</h3>
      <p>
        40 minutes from Le Mans, one of France's finest zoos. Polar bears, tigers,
        giraffes, red pandas, over 1,500 animals in an exceptional natural setting. Plan
        a full day.
      </p>

      <h3>"Favourite Village of the French": Asnières-sur-Vègre</h3>
      <p>
        30 minutes away, a listed medieval village with its Roman bridge, manor houses
        and 13th-century murals. Guaranteed change of scenery.
      </p>

      <h3>Le Lude and Poncé-sur-le-Loir</h3>
      <p>
        The Loir valley has remarkable castles and charming villages. Perfect for a day
        by bike or car.
      </p>

      <h2>Sarthe gastronomy</h2>
      <ul>
        <li>
          <strong>Rillettes du Mans</strong>: emblematic pork spread, best enjoyed on
          country bread with a glass of Jasnières.
        </li>
        <li>
          <strong>Loué chicken</strong>: Label Rouge, recognisable by its yellow feet.
        </li>
        <li>
          <strong>Sarthe stew (Marmite sarthoise)</strong>: rabbit, chicken, bacon and
          mushrooms slow-cooked in Jasnières.
        </li>
        <li>
          <strong>Sarthe wines</strong>: Jasnières and Coteaux du Loir, fine and mineral
          whites often overlooked.
        </li>
      </ul>

      <h2>Where to stay in Le Mans for a family trip?</h2>
      <p>
        For a family stay, renting a whole house offers far more freedom than a hotel:
        kitchen to cook the market produce, space for the kids, privacy for everyone.
      </p>
      <p>
        Our coliving with <strong>9 suites with en-suite bathrooms</strong> is ideal for
        extended families, family reunions or multi-generational stays. Gym, zen space
        and garden keep young and old busy.
      </p>

      <h2>Events not to miss in Le Mans</h2>
      <ul>
        <li><strong>24 Hours Motorcycle</strong> — April</li>
        <li><strong>French MotoGP Grand Prix</strong> — May</li>
        <li><strong>Épau Festival</strong> — May-June</li>
        <li><strong>24 Hours of Le Mans</strong> — June</li>
        <li><strong>Nuit des Chimères</strong> — July and August</li>
        <li><strong>Le Mans Classic</strong> — July (even years)</li>
        <li><strong>24 Hours Trucks</strong> — October</li>
        <li><strong>Le Mans Marathon</strong> — October</li>
      </ul>

      <h2>Planning your stay</h2>
      <p>
        Whether you come for the races, the heritage or the food, our house welcomes
        you 10 minutes from the Le Mans TGV station and at the heart of every
        attraction. Check <Link href="/en#disponibilite">our availability</Link> or
        discover <Link href="/en/chambres">the 9 bedrooms</Link>.
      </p>
    </>
  );
}
