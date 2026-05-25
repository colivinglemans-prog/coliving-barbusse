import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Le Mans Classic è il più grande raduno mondiale di auto da corsa
        d'epoca. Ogni due anni, oltre 235.000 appassionati si riuniscono al
        Circuito delle 24 Ore per vedere correre 700 vetture mitiche, dalla
        Bentley Blower alla Porsche 962. Ecco come preparare il vostro
        weekend.
      </p>

      <h2>Cos'è Le Mans Classic?</h2>
      <p>
        Creato nel 2002, Le Mans Classic è una ricreazione fedele delle 24
        Ore di Le Mans con vetture che hanno corso la prova tra il 1923 e il
        1993. Sei plateau da 70 a 80 vetture si lanciano sul circuito per 24
        ore, in un'atmosfera retrò eccezionale. L'evento è anche una
        gigantesca festa intorno all'auto d'epoca: club, aste Artcurial,
        concorsi d'eleganza, village commerciale, concerto…
      </p>

      <h2>Quando si svolge la prossima edizione?</h2>
      <p>
        Le Mans Classic si tiene tradizionalmente all'inizio dell'estate
        (luglio), ogni due anni. Consultate il sito ufficiale{" "}
        <a href="https://www.lemansclassic.com/" target="_blank" rel="noopener noreferrer">lemansclassic.com</a> per
        le date esatte e l'apertura della biglietteria.
      </p>

      <h2>Perché Le Mans Classic attira così tanto</h2>
      <ul>
        <li>
          <strong>Un'immersione nella storia</strong>: vedere girare in
          pista auto che di solito si incrociano solo al museo.
        </li>
        <li>
          <strong>Atmosfera conviviale</strong>: l'evento attira
          appassionati da tutto il mondo in un'atmosfera più rilassata e
          familiare rispetto alle 24h moderne.
        </li>
        <li>
          <strong>Paddock accessibile</strong>: le vetture vengono
          preparate alla vista di tutti, i proprietari chiacchierano
          volentieri.
        </li>
        <li>
          <strong>Ricostruzione d'epoca</strong>: costumi, stand vintage,
          animazioni dagli anni '20 agli anni '90.
        </li>
      </ul>

      <h2>Dove alloggiare per Le Mans Classic?</h2>
      <p>
        A differenza delle 24h di Le Mans in giugno, gli alloggi sono un
        po' più facili da trovare per Le Mans Classic, ma bisogna
        comunque muoversi presto (almeno 6 mesi prima per avere scelta).
      </p>

      <h3>In città, per un accesso facile</h3>
      <p>
        Le Mans centro resta l'opzione più pratica: 20 minuti dal
        circuito fuori dall'evento (30-45 min nei giorni di gara), ma
        lontano dal traffico e dagli accampamenti. Ideale per le famiglie
        e gli amatori che vogliono anche godersi il patrimonio della
        Cité Plantagenêt.
      </p>

      <h3>Campeggio ufficiale</h3>
      <p>
        Atmosfera ineguagliabile con tutti i club che si ritrovano, ma
        prevedere materiale e buon umore. Piuttosto riservato agli
        appassionati convinti.
      </p>

      <h3>Affitto di una casa per i club</h3>
      <p>
        Molti club di collezionisti vengono in gruppo. Una grande casa
        permette di riunire tutti in un luogo confortevole, con
        parcheggio facile per le auto da collezione.
      </p>

      <h2>La nostra casa: perfetta per i club di collezionisti</h2>
      <p>
        Le nostre <strong>9 suite private con bagno</strong> ospitano
        fino a 18 persone in una cornice tranquilla, a 20 minuti dal
        Circuit Bugatti fuori dall'evento (30-45 min nei giorni di gara):
      </p>
      <ul>
        <li>Parcheggio gratuito in una via residenziale tranquilla</li>
        <li>10 min a piedi dalla stazione di Le Mans + tram T1 diretto verso il circuito (~30 min da porta a porta, ideale per lasciare l'auto da collezione al riparo nei giorni di affluenza)</li>
        <li>Cucina attrezzata per cenare insieme in modalità "cena di squadra"</li>
        <li>215 m² in totale (spazi comuni, camere e annesso sport/zen) per ritrovarsi</li>
        <li>Wi-Fi a banda larga, sala fitness, spazio zen</li>
        <li>Arrivo autonomo dalle 17 con serratura connessa</li>
      </ul>

      <h2>Consigli per il vostro weekend</h2>
      <ol>
        <li>
          <strong>Prenotate biglietti e alloggio all'apertura</strong>:
          i posti in tribuna e i migliori alloggi vanno via molto in
          fretta.
        </li>
        <li>
          <strong>Prevedete un abito d'epoca</strong> se volete stare al
          gioco: molti visitatori arrivano in costume.
        </li>
        <li>
          <strong>Macchina fotografica carica</strong>: è uno dei più bei
          terreni di gioco fotografici al mondo per gli amatori di
          carrozzerie mitiche.
        </li>
        <li>
          <strong>Prevedete tappi per le orecchie</strong> per godervi i
          motori atmosferici degli anni '60-'70 senza affaticare troppo
          i timpani.
        </li>
      </ol>

      <h2>Prenotate il vostro soggiorno Le Mans Classic</h2>
      <p>
        Abbiamo ancora disponibilità per la prossima edizione di Le Mans
        Classic. Consultate il{" "}
        <Link href="/it#disponibilite">calendario in tempo reale</Link> e
        prenotate prima che gli ultimi posti vadano via.
      </p>
    </>
  );
}
