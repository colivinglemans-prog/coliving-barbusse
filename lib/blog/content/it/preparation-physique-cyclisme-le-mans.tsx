import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Un ciclista passa ore in sella, ed è proprio per questo che la sala pesi gli è utile:
        gambe più forti, un tronco che tiene la posizione, una schiena che non si lamenta più
        dopo quattro ore di sella. Abbiamo ospitato un gruppo di ciclisti nel weekend della 24
        Heures Vélo: ecco come sfruttare{" "}
        <Link href="/it/blog/salle-de-sport-privee-le-mans">la palestra della casa</Link>{" "}
        prima, durante e dopo una gara a Le Mans.
      </p>

      <h2>Cosa porta il lavoro con i pesi al ciclista</h2>
      <ul>
        <li>
          <strong>Gambe più potenti</strong>: più forza significa più watt nei rilanci e sugli
          strappi.
        </li>
        <li>
          <strong>Un tronco solido</strong>: il bacino resta stabile sulla sella, la pedalata
          non si disperde.
        </li>
        <li>
          <strong>Una schiena e una nuca che tengono</strong> la posizione aerodinamica.
        </li>
        <li>
          <strong>Ossa e tendini più resistenti</strong>: la bici, sport in cui il peso è
          sostenuto, li sollecita poco.
        </li>
      </ul>

      <h2>L'allenamento di forza del ciclista (50 minuti)</h2>
      <p>Da fare una o due volte a settimana fuori dal periodo di gare:</p>
      <ul>
        <li>
          <strong>Back squat</strong> nel rack: 4 × 6, impegnativo ma pulito.
        </li>
        <li>
          <strong>Stacco rumeno</strong>: 3 × 8, per femorali e glutei, spesso indietro nel
          ciclista.
        </li>
        <li>
          <strong>Step-up sul box</strong> (da 40 a 50 cm) con manubri: 3 × 8 per gamba, per
          correggere la differenza tra la gamba forte e quella debole.
        </li>
        <li>
          <strong>Hip thrust</strong> con bilanciere, schiena sulla panca: 3 × 10.
        </li>
        <li>
          <strong>Pulley</strong> al cavo basso: 3 × 12, per la parte alta della schiena.
        </li>
        <li>
          <strong>Core</strong>: plank 3 × 40 s, plank laterale 2 × 30 s per lato, dead bug 2 ×
          10.
        </li>
      </ul>

      <h2>Quando si avvicina una gara</h2>
      <p>
        Nella settimana della gara si mantiene un po' di forza ma senza affaticarsi: 2 × 5 squat
        leggeri e veloci, un po' di core, e basta. La vigilia bastano 15 minuti di ellittica e
        un po' di mobilità delle anche.
      </p>

      <h2>La 24 Heures Vélo: staffette e recupero</h2>
      <p>
        A fine agosto il circuito Bugatti ospita la{" "}
        <Link href="/it/blog/24-heures-velo-le-mans-2027">24 Heures Vélo</Link>, in solitaria o
        a squadre. Per una squadra a staffetta che alloggia in casa, a 4,7 km dal circuito:
      </p>
      <ul>
        <li>
          <strong>Tra due turni</strong>: 10 minuti di ellittica leggerissima per far circolare
          il sangue, una doccia in camera, mangiare, dormire nel buio completo grazie alle
          tapparelle.
        </li>
        <li>
          <strong>Dopo la gara</strong>: la routine del{" "}
          <Link href="/it/blog/recuperation-apres-effort-le-mans">nostro articolo sul recupero</Link>
          , incentrata su anche, femorali e zona lombare.
        </li>
      </ul>

      <h2>Il vogatore, l'alleato dei giorni senza bici</h2>
      <p>
        Il vogatore Concept2 fa lavorare la parte superiore del corpo che la bici trascura,
        senza impatto. Una seduta di 20 minuti di resistenza, o 6 × 3 minuti sostenuti, tiene
        allenato il cuore nei giorni di pioggia o di riposo per le gambe.
      </p>

      <h2>Informazioni pratiche per una squadra di ciclisti</h2>
      <ul>
        <li>
          <strong>Le bici si ripongono al riparo nella sala zen</strong>, all'interno.
        </li>
        <li>
          <strong>Lavatrice e asciugatrice</strong> per pantaloncini e maglie.
        </li>
        <li>
          <strong>Un bagno con doccia per camera</strong>, 9 camere, fino a 20 persone.
        </li>
        <li>
          La stazione TGV è a 15 minuti a piedi, a circa 55 minuti da Parigi.
        </li>
      </ul>
      <p>
        Per altri allenamenti, vedi{" "}
        <Link href="/it/blog/entrainements-salle-de-sport-le-mans">
          i nostri allenamenti da soli o in gruppo
        </Link>{" "}
        e il{" "}
        <Link href="/it/blog/equipe-sportive-le-mans">nostro articolo per le squadre sportive</Link>
        .
      </p>
      <ExerciseGuide locale="it" ids={["back-squat", "romanian-deadlift", "step-up", "hip-thrust", "seated-cable-row", "plank", "side-plank", "dead-bug", "rowing"]} />
    </>
  );
}
