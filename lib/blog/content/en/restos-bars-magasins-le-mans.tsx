import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Our house is ideally located in the Gare Sud neighbourhood of Le Mans, 10 minutes
        walk from the TGV station. Here are the addresses we recommend to our guests for
        eating, drinking, shopping or exploring — all without needing the car.
      </p>

      <h2>Restaurants within walking distance</h2>

      <h3>Pizza Night 72 — pizzas and burgers (217 rue Henri Barbusse)</h3>
      <p>
        Right on our street, open late in the evening — ideal after a long drive or a
        day at the circuit. Pizzas and burgers, take-away or delivery. Perfect for
        dining in without going out.
      </p>

      <h3>Le Chemin de la Table — French cuisine (12 bis Av. Henri Lefeuvre)</h3>
      <p>
        A well-loved neighbourhood restaurant, a few minutes' walk in the Gare Sud area.
        Generous French cuisine, summer terrace, warm welcome. Mostly open for lunch on
        weekdays and Friday evening — booking recommended.
      </p>

      <h3>Le Terminus Gourmand — brasserie opposite the station (65 Bd Marie et Alexandre Oyon)</h3>
      <p>
        Brasserie with a large terrace right across from the TGV station. Creative
        French cuisine, daily menu and great value for money. Perfect for a quick lunch
        before catching a train or dinner before a night out.
      </p>

      <h2>Further into Le Mans, worth the trip</h2>
      <p>
        To mix things up, here are some well-known addresses in Le Mans (10-15 minutes
        walk or a short taxi ride from the house):
      </p>
      <ul>
        <li>
          <strong>Délices Marocains</strong> (1 rue Lionel Royer) — authentic Moroccan
          cuisine, generous tagines and couscous.
        </li>
        <li>
          <strong>Verre I Table</strong> (108 rue Nationale) — modern bistro, refined
          dishes, interesting wine list.
        </li>
        <li>
          <strong>Brasserie l'Amphitryon</strong> (16 av. du Général Leclerc) — large
          French brasserie, perfect for groups.
        </li>
      </ul>

      <h2>Bars and nightlife</h2>
      <p>
        For a drink or to extend the evening, Le Mans city centre has the best
        addresses. Allow 15-20 minutes walking or a short taxi ride from the house.
      </p>

      <h3>Le Bistrot des Jacobins — craft beer bar (1 bis place des Jacobins)</h3>
      <p>
        At the foot of Saint-Julien Cathedral, a must in the historic centre. 7 craft
        beers on tap, a nice wine selection, charcuterie and cheese boards. Sunny
        terrace on the square, cosy vaulted room. Drivers of the 24 Hours of Le Mans
        often stop by during race week.
      </p>

      <h3>Shaker &amp; Co — cocktail bar (32 rue du Port)</h3>
      <p>
        Excellent cocktail bar (rated 4.8/5), intimate atmosphere. Creative menu,
        quality ingredients. Ideal for a drink as a couple or with friends before
        dinner.
      </p>

      <h3>Café Pop — bar and party spot (40 rue du Port)</h3>
      <p>
        Bar-club on the same street. Livelier vibe, energetic music, open late on
        weekends. Great to finish the night on the dance floor.
      </p>

      <h3>Portland — café bar (34 rue du Port)</h3>
      <p>
        Café bar on the busiest street in Le Mans. Friendly atmosphere, good drinks
        selection, often packed at the weekend.
      </p>

      <h2>Groceries and food shopping</h2>

      <h3>Carrefour City — on the way to the station</h3>
      <p>
        Less than 10 minutes walk towards the station. Ideal for groceries when arriving
        or a quick top-up (wide opening hours, open Sunday mornings).
      </p>

      <h3>Carrefour Market Le Mans La Pointe — for big shops (12 min walk)</h3>
      <p>
        A full supermarket about twelve minutes walk away. Best for bulk shopping with a
        group or fresh produce to cook at the house.
      </p>

      <h3>Artisan Boulanger Pâtissier Lancelot Céline &amp; Yohann (7 min walk)</h3>
      <p>
        Artisan bakery on the way to the station. Baguettes, pastries and cakes made
        on-site. The perfect spot for breakfast and weekend treats.
      </p>

      <h2>A park nearby: Gué de Maulny</h2>
      <p>
        Between the house and the station, <strong>Gué de Maulny</strong> is a
        16-hectare public park along the Huisne river. Natural lawns, benches, picnic
        tables, children's playground and a multi-sport area. A real breath of fresh
        air, ideal for a morning walk, a run or a sunny family lunch. Outdoor
        exhibitions are regularly on display.
      </p>

      <h2>Weekend tips</h2>
      <ol>
        <li>
          <strong>Arrival Friday evening</strong>: takeaway pizza from Pizza Night 72,
          aperitif at the house.
        </li>
        <li>
          <strong>Saturday morning</strong>: breakfast at Lancelot bakery, then a walk at
          Gué de Maulny park.
        </li>
        <li>
          <strong>Saturday lunch</strong>: terrace lunch at Le Chemin de la Table or Le
          Terminus Gourmand.
        </li>
        <li>
          <strong>Saturday afternoon</strong>: groceries at Carrefour Market for a cozy
          dinner at home.
        </li>
        <li>
          <strong>Sunday</strong>: visit the historic centre (Plantagenet City, 15 min
          away) and lunch at Brasserie l'Amphitryon.
        </li>
      </ol>

      <h2>Your stay at the heart of the neighbourhood</h2>
      <p>
        Our coliving is in a lively, well-connected area: TGV station 10 min walk, shops
        and restaurants nearby, a riverside park right next door. Check{" "}
        <Link href="/#disponibilite">our availability</Link> and enjoy a relaxed stay
        without needing a car for the everyday.
      </p>
    </>
  );
}
