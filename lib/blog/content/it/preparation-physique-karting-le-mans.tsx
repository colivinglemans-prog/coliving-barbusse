import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Un kart non ha né servosterzo né sospensioni: il pilota assorbe le vibrazioni, le forze
        laterali sul collo e sulle costole, e tiene un volante duro in ogni curva. A maggio 2026
        una squadra di kart arrivata da Singapore ha alloggiato da noi per le SWS Karting Finals.
        Ecco come usare{" "}
        <Link href="/it/blog/salle-de-sport-privee-le-mans">la palestra della casa</Link>{" "}
        per prepararsi a una gara sul circuito internazionale di kart di Le Mans.
      </p>

      <h2>Cosa chiede il kart</h2>
      <ul>
        <li>
          <strong>Il collo</strong>, che sostiene il casco in ogni curva.
        </li>
        <li>
          <strong>Gli avambracci e la presa</strong>, su un volante senza servosterzo.
        </li>
        <li>
          <strong>Il tronco e le costole</strong>, premuti contro il sedile.
        </li>
        <li>
          <strong>Il cardio</strong>: la frequenza cardiaca sale in fretta durante una manche.
        </li>
      </ul>

      <h2>L'allenamento del pilota (45 minuti)</h2>
      <ul>
        <li>
          <strong>Collo</strong>: isometria contro la mano nelle quattro direzioni, 4 × 15 s;
          poi sdraiati sulla panca, testa oltre il bordo, flessioni lente con il solo peso della
          testa, 2 × 12 per direzione.
        </li>
        <li>
          <strong>Presa</strong>: sospensione alla sbarra per trazioni, 3 × 30 s; farmer walk
          con due manubri, 3 × 30 m.
        </li>
        <li>
          <strong>Trazioni</strong>: 3 serie al massimo meno una, con elastico per aiutarsi se
          serve.
        </li>
        <li>
          <strong>Pulley</strong> al cavo basso, maniglia a presa neutra: 3 × 12, poi rematore a
          un braccio, maniglia singola, 2 × 10 per braccio per bilanciare i due lati.
        </li>
        <li>
          <strong>Core</strong>: Pallof press 3 × 10 per lato, plank laterale 3 × 30 s per lato.
        </li>
        <li>
          <strong>Cardio</strong>: vogatore Concept2, 6 × 2 minuti sostenuti, 1 minuto facile.
        </li>
      </ul>

      <h2>La mattina della gara</h2>
      <p>
        Da 10 a 15 minuti: ellittica in progressione, rotazioni del collo e delle spalle, polsi,
        qualche secondo di sospensione alla sbarra, core leggero. L'obiettivo è arrivare al
        circuito svegli, non stanchi.
      </p>

      <h2>I giovani piloti</h2>
      <p>
        Molti piloti di kart sono minorenni. In palestra si allenano{" "}
        <strong>accompagnati da un adulto</strong> — genitore, meccanico o coach —, con esercizi
        a corpo libero, con l'elastico, al vogatore e con carichi leggeri. Il lavoro sul collo
        si fa senza carico.
      </p>

      <h2>Dopo le manche</h2>
      <p>
        Doccia in camera, pasto di squadra e qualche minuto di stretching per collo, avambracci
        e schiena nella sala zen. Il dettaglio è nella{" "}
        <Link href="/it/blog/recuperation-apres-effort-le-mans">nostra routine di recupero</Link>
        .
      </p>

      <h2>Informazioni pratiche per una squadra di kart</h2>
      <ul>
        <li>
          Il circuito internazionale di kart ospita le{" "}
          <Link href="/it/blog/sws-karting-finals-le-mans">SWS Karting Finals</Link>, il{" "}
          <Link href="/it/blog/championnat-monde-karting-kz-le-mans">
            campionato del mondo KZ
          </Link>{" "}
          e altre competizioni internazionali.
        </li>
        <li>
          I kart, il rimorchio e gli attrezzi restano nel paddock: in strada non c'è posto per
          loro.
        </li>
        <li>
          9 camere con bagno con doccia, fino a 20 persone: piloti, genitori e meccanici sotto
          lo stesso tetto.
        </li>
      </ul>
      <p>
        Per i piloti di automobilismo, vedi il{" "}
        <Link href="/it/blog/preparation-physique-course-automobile-le-mans">
          nostro articolo sull'automobilismo
        </Link>
        .
      </p>
      <ExerciseGuide locale="it" ids={["neck-isometrics", "farmer-walk", "pull-up", "seated-cable-row", "single-arm-cable-row", "pallof-press", "side-plank", "rowing"]} />
    </>
  );
}
