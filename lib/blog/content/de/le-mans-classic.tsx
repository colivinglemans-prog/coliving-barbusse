import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Le Mans Classic ist die größte weltweite Versammlung historischer
        Rennwagen. Alle zwei Jahre kommen über 235.000 Enthusiasten zum
        24-Stunden-Circuit, um 700 legendäre Autos in Fahrt zu erleben, vom
        Bentley Blower bis zum Porsche 962. So bereiten Sie Ihr Wochenende vor.
      </p>

      <h2>Was ist Le Mans Classic?</h2>
      <p>
        Le Mans Classic wurde 2002 ins Leben gerufen und ist eine
        originalgetreue Neuauflage der 24 Stunden von Le Mans mit Autos, die
        zwischen 1923 und 1993 an der Prüfung teilgenommen haben. Sechs
        Starterfelder mit jeweils 70 bis 80 Fahrzeugen starten 24 Stunden lang
        auf der Rennstrecke, in einer außergewöhnlichen Retro-Atmosphäre. Die
        Veranstaltung ist zugleich ein riesiges Fest rund um das
        Sammler-Automobil: Clubs, Auktionen von Artcurial, Concours d'Elegance,
        Händlerdorf, Konzert…
      </p>

      <h2>Wann findet die nächste Ausgabe statt?</h2>
      <p>
        Le Mans Classic findet traditionell zu Sommerbeginn (Juli) alle zwei
        Jahre statt. Auf der offiziellen Website{" "}
        <a href="https://www.lemansclassic.com/" target="_blank" rel="noopener noreferrer">lemansclassic.com</a>{" "}
        finden Sie die genauen Daten und die Eröffnung des Ticketverkaufs.
      </p>

      <h2>Warum Le Mans Classic so anzieht</h2>
      <ul>
        <li>
          <strong>Ein Eintauchen in die Geschichte</strong>: Autos auf der
          Strecke fahren sehen, die man sonst nur im Museum trifft.
        </li>
        <li>
          <strong>Gesellige Atmosphäre</strong>: Die Veranstaltung zieht
          Enthusiasten aus aller Welt an, in einer entspannteren und
          familiäreren Stimmung als die modernen 24h.
        </li>
        <li>
          <strong>Zugängliches Paddock</strong>: Die Autos werden vor aller
          Augen vorbereitet, die Besitzer plaudern bereitwillig.
        </li>
        <li>
          <strong>Epochen-Rekonstruktion</strong>: Kostüme, Vintage-Stände,
          Animationen aus den 1920er- bis 1990er-Jahren.
        </li>
      </ul>

      <h2>Wo wohnen für Le Mans Classic?</h2>
      <p>
        Anders als bei den 24h von Le Mans im Juni sind Unterkünfte für Le Mans
        Classic etwas leichter zu finden, aber man muss trotzdem früh dran sein
        (mindestens 6 Monate im Voraus, um eine Auswahl zu haben).
      </p>

      <h3>In der Stadt, für leichten Zugang</h3>
      <p>
        Das Zentrum von Le Mans bleibt die praktischste Option: 20 Minuten von
        der Rennstrecke außerhalb des Events (30-45 Min. an Renntagen), aber
        fern von Staus und Camps. Ideal für Familien und Liebhaber, die auch
        das Erbe der Cité Plantagenêt genießen wollen.
      </p>

      <h3>Offizielles Camping</h3>
      <p>
        Unvergleichliche Atmosphäre, bei der sich alle Clubs treffen, aber
        Material und gute Laune einplanen. Eher den überzeugten Fans
        vorbehalten.
      </p>

      <h3>Hausvermietung für Clubs</h3>
      <p>
        Viele Sammlerclubs kommen in Gruppen. Ein großes Haus erlaubt es, alle
        an einem komfortablen Ort zu versammeln, mit einfachem Parken für die
        Sammlerautos.
      </p>

      <h2>Unser Haus: perfekt für Sammlerclubs</h2>
      <p>
        Unsere <strong>9 privaten Suiten mit eigenem Bad</strong> beherbergen
        bis zu 18 Personen in ruhiger Umgebung, 20 Minuten vom Circuit Bugatti
        entfernt außerhalb des Events (30-45 Min. an Renntagen):
      </p>
      <ul>
        <li>Kostenfreies Parken in einer ruhigen Wohnstraße</li>
        <li>10 Min. zu Fuß zum Bahnhof Le Mans + direkte Straßenbahn T1 zur Rennstrecke (~30 Min. von Tür zu Tür, ideal um an Tagen mit Andrang das Sammlerauto sicher abzustellen)</li>
        <li>Voll ausgestattete Küche für ein gemeinsames Abendessen im „Team-Mahl'-Modus</li>
        <li>215 m² insgesamt (Gemeinschaftsräume, Zimmer und Sport/Zen-Bereich) zum Zusammenkommen</li>
        <li>Breitband-WLAN, Fitnessraum, Zen-Bereich</li>
        <li>Selbständige Anreise ab 17 Uhr mit smartem Schloss</li>
      </ul>

      <h2>Tipps für Ihr Wochenende</h2>
      <ol>
        <li>
          <strong>Buchen Sie Tickets und Unterkunft direkt zur Eröffnung</strong>:
          Die Tribünenplätze und besten Unterkünfte sind sehr schnell weg.
        </li>
        <li>
          <strong>Planen Sie ein zeittypisches Outfit ein</strong>, falls Sie
          mitspielen möchten: viele Besucher kommen kostümiert.
        </li>
        <li>
          <strong>Kamera aufgeladen</strong>: einer der schönsten
          fotografischen Spielplätze der Welt für Liebhaber legendärer
          Karosserien.
        </li>
        <li>
          <strong>Denken Sie an Ohrstöpsel</strong>, um die atmosphärischen
          Motoren der 60er- und 70er-Jahre zu genießen, ohne die Trommelfelle
          zu sehr zu strapazieren.
        </li>
      </ol>

      <h2>Buchen Sie Ihren Aufenthalt zu Le Mans Classic</h2>
      <p>
        Wir haben noch Verfügbarkeiten für die nächste Ausgabe von Le Mans
        Classic. Prüfen Sie den{" "}
        <Link href="/de#disponibilite">Echtzeit-Kalender</Link> und buchen Sie,
        bevor die letzten Plätze vergeben sind.
      </p>
    </>
  );
}
