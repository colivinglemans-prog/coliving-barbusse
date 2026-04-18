import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Le Mans Classic is the world's largest gathering of vintage racing cars. Every two
        years, over 235,000 enthusiasts descend on the Le Mans Circuit to watch 700
        legendary cars in action — from the Bentley Blower to the Porsche 962. Here's
        how to plan your weekend.
      </p>

      <h2>What is Le Mans Classic?</h2>
      <p>
        Created in 2002, Le Mans Classic is a faithful re-enactment of the 24 Hours of Le
        Mans featuring cars that raced the event between 1923 and 1993. Six grids of 70
        to 80 cars compete on the circuit for 24 hours, in an exceptional retro
        atmosphere. The event is also a massive celebration of classic motoring: clubs,
        Artcurial auctions, elegance competitions, trade village, concerts…
      </p>

      <h2>When is the next edition?</h2>
      <p>
        Le Mans Classic traditionally takes place in early summer (July), every two
        years. Check the official website at{" "}
        <a href="https://www.lemansclassic.com/" target="_blank" rel="noopener noreferrer">lemansclassic.com</a>{" "}
        for exact dates and ticket release.
      </p>

      <h2>Why Le Mans Classic draws crowds</h2>
      <ul>
        <li>
          <strong>Immersion in history</strong>: watching cars you usually only see in
          museums race on the track.
        </li>
        <li>
          <strong>Friendly atmosphere</strong>: the event attracts enthusiasts from around
          the world in a relaxed, family-friendly setting compared to modern 24 Hours.
        </li>
        <li>
          <strong>Accessible paddock</strong>: cars are prepared in plain view, owners are
          happy to chat.
        </li>
        <li>
          <strong>Period re-enactments</strong>: costumes, vintage stands, entertainment
          from the 1920s to the 1990s.
        </li>
      </ul>

      <h2>Where to stay for Le Mans Classic?</h2>
      <p>
        Unlike the 24 Hours of Le Mans in June, accommodation is a bit easier to find for
        Le Mans Classic — but still book at least 6 months in advance for the best
        choice.
      </p>

      <h3>In town, for easy access</h3>
      <p>
        Le Mans centre remains the most practical option: 15-20 minutes from the circuit
        off-event (30-45 min on race days), but away from the jams and campsites. Ideal
        for families and enthusiasts who also want to enjoy the heritage of Plantagenet
        City.
      </p>

      <h3>Official campsite</h3>
      <p>
        Unbeatable atmosphere with all the clubs meeting up, but bring gear and a good
        mood. Reserved for dedicated enthusiasts.
      </p>

      <h3>House rental for clubs</h3>
      <p>
        Many collector clubs come as a group. A large house lets you gather everyone in a
        comfortable place, with easy parking for the collection cars.
      </p>

      <h2>Our house: perfect for collector clubs</h2>
      <p>
        Our <strong>9 private suites with en-suite bathrooms</strong> welcome up to 18
        guests in a quiet setting, 15-20 minutes from the Bugatti Circuit off-event
        (30-45 min on race days):
      </p>
      <ul>
        <li>Free street parking in a quiet residential area</li>
        <li>10 min walk from Le Mans station + direct tram T1 to the circuit (~30 min door-to-door, ideal to leave the collection car safe on busy days)</li>
        <li>Fully equipped kitchen for team dinners</li>
        <li>215 m² total (common areas, bedrooms and gym/zen annex) to regroup</li>
        <li>High-speed Wi-Fi, gym, zen space</li>
        <li>Self check-in from 5 pm with smart lock</li>
      </ul>

      <h2>Tips for your weekend</h2>
      <ol>
        <li>
          <strong>Book tickets and accommodation as soon as they open</strong>: grandstand
          seats and the best lodgings go fast.
        </li>
        <li>
          <strong>Consider period clothing</strong> to play the part: many visitors come
          in costume.
        </li>
        <li>
          <strong>Charged camera</strong>: it's one of the most photogenic playgrounds
          for fans of legendary bodywork.
        </li>
        <li>
          <strong>Bring earplugs</strong> to enjoy the naturally aspirated engines of the
          60s-70s without trashing your eardrums.
        </li>
      </ol>

      <h2>Book your Le Mans Classic stay</h2>
      <p>
        We still have availability for the next edition of Le Mans Classic. Check our{" "}
        <Link href="/#disponibilite">real-time calendar</Link> and secure your stay
        before the last spots go.
      </p>
    </>
  );
}
