import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Un cavaliere non solleva carichi, ma mantiene una postura per ore, assorbe ogni falcata
        con il bacino e dà gli aiuti con gambe indipendenti dalla parte superiore del corpo.
        Ospitiamo cavalieri venuti per i concorsi della zona: ecco come usare{" "}
        <Link href="/it/blog/salle-de-sport-privee-le-mans">la palestra della casa</Link>{" "}
        per montare meglio e risparmiare la schiena.
      </p>

      <h2>Cosa chiede l'equitazione</h2>
      <ul>
        <li>
          <strong>Un tronco stabile</strong>: il core permette di seguire il movimento del
          cavallo senza irrigidirsi né accasciarsi.
        </li>
        <li>
          <strong>Adduttori e glutei</strong> che tengono la posizione, nel dressage come in
          equilibrio sull'ostacolo.
        </li>
        <li>
          <strong>Un bacino mobile</strong> che assorbe le andature.
        </li>
        <li>
          <strong>Una parte alta della schiena tonica</strong> per stare dritti, spalle basse.
        </li>
        <li>
          <strong>Simmetria</strong>: ogni cavaliere ha un lato più forte.
        </li>
      </ul>

      <h2>L'allenamento del cavaliere (40 minuti)</h2>
      <ul>
        <li>
          <strong>Goblet squat</strong> con un bumper da 5 o 10 kg: 3 × 10, busto dritto.
        </li>
        <li>
          <strong>Copenhagen plank</strong> sulla panca: 3 × 20 s per lato, per gli adduttori.
        </li>
        <li>
          <strong>Hip thrust</strong> con bilanciere: 3 × 10.
        </li>
        <li>
          <strong>Pallof press</strong> al cavo, maniglia singola: 3 × 10 per lato, il busto non
          ruota.
        </li>
        <li>
          <strong>Pulley</strong> al cavo basso: 3 × 12, scapole strette.
        </li>
        <li>
          <strong>Dead bug</strong> sul tappetino: 3 × 10, per dissociare braccia e gambe.
        </li>
        <li>
          <strong>Affondi in camminata</strong>: 2 × 8 per gamba, controllando il lato più
          debole.
        </li>
      </ul>

      <h2>Il cardio, utile nel completo</h2>
      <p>
        Un percorso di cross o una lunga giornata di concorso stancano anche il cavaliere. Da 20
        a 30 minuti di ellittica o di vogatore Concept2 due volte a settimana bastano per non
        finire il percorso senza fiato.
      </p>

      <h2>Il giorno del concorso</h2>
      <ul>
        <li>
          <strong>La mattina</strong>: 10 minuti di mobilità del bacino e delle anche sul
          tappetino (basculamenti del bacino, aperture delle anche, gatto-mucca), prima di
          andare in scuderia.
        </li>
        <li>
          <strong>La sera</strong>: stretching di adduttori, flessori dell'anca e zona lombare
          nella sala zen; vedi la{" "}
          <Link href="/it/blog/recuperation-apres-effort-le-mans">nostra routine di recupero</Link>
          .
        </li>
      </ul>

      <h2>Informazioni pratiche per i cavalieri</h2>
      <ul>
        <li>
          Il <strong>Pôle européen du cheval</strong> (Yvré-l'Évêque) è a una ventina di minuti
          in auto, così come l'ippodromo delle Hunaudières. Vedi il{" "}
          <Link href="/it/blog/concours-equestre-pole-europeen-du-cheval">
            nostro articolo sui concorsi equestri
          </Link>
          .
        </li>
        <li>
          I cavalli, i van e i camion restano sul luogo del concorso: la casa non ha né scuderia
          né posto per un camion.
        </li>
        <li>
          Lavatrice e asciugatrice per l'abbigliamento, un bagno con doccia per camera, fino a 20
          persone: cavalieri, istruttori e famiglie.
        </li>
        <li>
          I giovani cavalieri dai 10 ai 17 anni sono accolti sotto la responsabilità dei loro
          accompagnatori; in palestra, i minorenni si allenano con un adulto.
        </li>
      </ul>
      <ExerciseGuide locale="it" ids={["goblet-squat", "copenhagen-plank", "hip-thrust", "pallof-press", "seated-cable-row", "dead-bug", "walking-lunge"]} />
    </>
  );
}
