import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Le Mans ist weit mehr als eine Rennstrecke. Zwischen klassifiziertem
        mittelalterlichem Erbe, sarthoiser Gastronomie und unberührter Natur sind die
        Stadt und ihre Region ein ideales Ziel für ein Wochenende oder einen
        Familienurlaub. Hier sind die Sehenswürdigkeiten, die Sie nicht verpassen
        sollten.
      </p>

      <h2>Die Cité Plantagenêt, mittelalterliches Juwel von Le Mans</h2>
      <p>
        Die Cité Plantagenêt zählt zu den schönsten mittelalterlichen Ensembles Europas
        und ist das historische Herz von Le Mans. Ihre gepflasterten Gassen,
        Fachwerkhäuser und gallorömischen Stadtmauern dienten als Kulisse für zahlreiche
        Filme (Cyrano de Bergerac, Die drei Musketiere, Le Bossu …).
      </p>
      <ul>
        <li>
          <strong>Kathedrale Saint-Julien</strong>: eine der größten in Frankreich, ein
          gotisches Meisterwerk. Eintritt frei.
        </li>
        <li>
          <strong>Römische Stadtmauern</strong>: aus dem 3. Jahrhundert, zu den
          besterhaltenen der römischen Welt zählend.
        </li>
        <li>
          <strong>Nuit des Chimères</strong> (Juli-August): spektakuläre
          Lichtinszenierung der Cité, kostenlos und magisch.
        </li>
      </ul>

      <h2>Das Museum der 24 Stunden von Le Mans</h2>
      <p>
        Direkt neben dem Circuit Bugatti zeichnet das Museum ein Jahrhundert
        Rennsportgeschichte mit über 140 legendären Fahrzeugen nach: Bentley, Ford GT40,
        Porsche 917, Peugeot 905, Audi R18 … Ein Muss für Liebhaber und auch für
        Neulinge spannend.
      </p>

      <h2>Die Abtei von L'Épau</h2>
      <p>
        Ein Zisterzienserdenkmal aus dem 13. Jahrhundert, wenige Kilometer vom Zentrum
        entfernt. Die Abtei von L'Épau beherbergt jedes Frühjahr das renommierte{" "}
        <strong>Festival de l'Épau</strong>, das der klassischen Musik gewidmet ist.
        Der Park ist wunderschön und ideal für einen Familienspaziergang.
      </p>

      <h2>Das Departement Sarthe mit der Familie entdecken</h2>
      <h3>Zoo de la Flèche</h3>
      <p>
        40 Minuten von Le Mans entfernt — einer der schönsten Zoos Frankreichs.
        Eisbären, Tiger, Giraffen, Rote Pandas, über 1.500 Tiere in einem
        außergewöhnlichen natürlichen Rahmen. Planen Sie einen ganzen Tag ein.
      </p>

      <h3>Das beliebteste Dorf Frankreichs: Asnières-sur-Vègre</h3>
      <p>
        30 Minuten entfernt — ein klassifiziertes mittelalterliches Dorf mit
        römischer Brücke, Herrenhäusern und Wandfresken aus dem 13. Jahrhundert. Ein
        garantiert eindrucksvoller Spaziergang.
      </p>

      <h3>Le Lude und Poncé-sur-le-Loir</h3>
      <p>
        Das Loir-Tal bietet bemerkenswerte Schlösser und malerische Dörfer. Perfekt
        für einen Tag mit dem Fahrrad oder dem Auto.
      </p>

      <h2>Die sarthoise Gastronomie</h2>
      <ul>
        <li>
          <strong>Rillettes du Mans</strong>: emblematische Wurstwarenspezialität, zu
          genießen auf Landbrot mit einem Glas Jasnières.
        </li>
        <li>
          <strong>Poulet de Loué</strong>: Label Rouge, an seinen gelben Beinen
          erkennbar.
        </li>
        <li>
          <strong>Marmite sarthoise</strong>: Kaninchen, Huhn, Speck und Pilze in
          Jasnières geschmort.
        </li>
        <li>
          <strong>Weine aus der Sarthe</strong>: Jasnières und Coteaux du Loir — feine,
          mineralische, oft unbekannte Weißweine.
        </li>
      </ul>

      <h2>Wo in Le Mans für einen Familienaufenthalt wohnen?</h2>
      <p>
        Für einen Familienaufenthalt bietet die Miete eines ganzen Hauses viel mehr
        Freiheit als ein Hotel: eine Küche, um die Produkte vom Markt zuzubereiten,
        Platz für die Kinder und Privatsphäre für alle.
      </p>
      <p>
        Unser Coliving mit <strong>9 Suiten mit privaten Bädern</strong> ist ideal für
        Großfamilien, Familientreffen oder Mehrgenerationenaufenthalte. Fitnessraum,
        Zen-Bereich und Garten bieten Beschäftigung für Groß und Klein.
      </p>

      <h2>Veranstaltungen in Le Mans, die Sie nicht verpassen sollten</h2>
      <ul>
        <li><strong>24-Stunden-Motorradrennen</strong> — April</li>
        <li><strong>Großer Preis von Frankreich der MotoGP</strong> — Mai</li>
        <li><strong>Festival de l'Épau</strong> — Mai-Juni</li>
        <li><strong>24 Stunden von Le Mans</strong> — Juni</li>
        <li><strong>Nuit des Chimères</strong> — Juli und August</li>
        <li><strong>Le Mans Classic</strong> — Juli (in geraden Jahren)</li>
        <li><strong>24 Stunden der Lkw</strong> — Oktober</li>
        <li><strong>Marathon von Le Mans</strong> — Oktober</li>
      </ul>

      <h2>Ihren Aufenthalt vorbereiten</h2>
      <p>
        Ob Sie wegen der Rennen, des Kulturerbes oder der Gastronomie anreisen — unser
        Haus empfängt Sie 10 Minuten vom TGV-Bahnhof Le Mans entfernt, im Herzen aller
        Attraktionen. Sehen Sie sich <Link href="/de#disponibilite">unsere
        Verfügbarkeiten</Link> an oder entdecken Sie{" "}
        <Link href="/de/chambres">die 9 Zimmer</Link>.
      </p>
    </>
  );
}
