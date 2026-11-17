import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Nel pattinaggio di velocità in linea tutto parte dalle anche: una spinta laterale, una
        posizione flessa tenuta per ore e una schiena che deve reggere. Abbiamo già ospitato
        squadre di pattinatori venute per il circuito; ecco come usare{" "}
        <Link href="/it/blog/salle-de-sport-privee-le-mans">la palestra della casa</Link>{" "}
        per prepararsi, in particolare alla 24 Heures Rollers.
      </p>

      <h2>Cosa chiede il pattinaggio in linea</h2>
      <ul>
        <li>
          <strong>Glutei e adduttori potenti</strong> per la spinta laterale.
        </li>
        <li>
          <strong>Cosce resistenti</strong>, in posizione flessa per tutto un turno.
        </li>
        <li>
          <strong>Una zona lombare solida</strong>, con il busto inclinato in avanti.
        </li>
        <li>
          <strong>Caviglie stabili</strong> e un buon equilibrio su una gamba.
        </li>
      </ul>

      <h2>L'allenamento del pattinatore (50 minuti)</h2>
      <ul>
        <li>
          <strong>Back squat</strong>: 4 × 6, oppure front squat per tenere il busto dritto.
        </li>
        <li>
          <strong>Affondi laterali</strong> con manubri: 3 × 8 per lato, il gesto più vicino
          alla spinta.
        </li>
        <li>
          <strong>Step-up sul box</strong>: 3 × 8 per gamba.
        </li>
        <li>
          <strong>Stacco rumeno</strong>: 3 × 8.
        </li>
        <li>
          <strong>Copenhagen plank</strong> sulla panca, per gli adduttori: 3 × 20 s per lato.
        </li>
        <li>
          <strong>Box jump laterali</strong> su un box basso (20 cm): 3 × 6 per lato, atterraggio
          morbido.
        </li>
        <li>
          <strong>Equilibrio</strong>: restare su una gamba, ginocchio flesso in posizione da
          pattinaggio, 3 × 30 s per gamba, a occhi chiusi per i più sicuri.
        </li>
      </ul>

      <h2>La resistenza senza pattinare</h2>
      <p>
        L'ellittica riproduce una spinta gamba per gamba senza impatto: 30 minuti di
        resistenza, oppure intervalli di 2 minuti sostenuti e 1 minuto facile. Il vogatore
        Concept2 mantiene il cardio sollecitando schiena e braccia.
      </p>

      <h2>La 24 Heures Rollers, in squadra</h2>
      <p>
        A luglio il circuito Bugatti ospita la{" "}
        <Link href="/it/blog/24-heures-rollers-le-mans">24 Heures Rollers</Link>. Una squadra a
        staffetta che alloggia in casa, a 4,7 km dal circuito, può:
      </p>
      <ul>
        <li>
          attivarsi la mattina con 10 minuti di ellittica e qualche affondo laterale;
        </li>
        <li>
          tornare a dormire tra due turni in una camera con il buio completo, con la propria
          doccia;
        </li>
        <li>
          recuperare dopo la gara con la{" "}
          <Link href="/it/blog/recuperation-apres-effort-le-mans">nostra routine post-allenamento</Link>
          : anche, adduttori, zona lombare.
        </li>
      </ul>

      <h2>Informazioni pratiche</h2>
      <ul>
        <li>9 camere con bagno con doccia, fino a 20 persone.</li>
        <li>Lavatrice e asciugatrice per l'abbigliamento.</li>
        <li>Cucina attrezzata e grande tavolo per i pasti di squadra.</li>
        <li>
          Senza istruttore: ognuno si allena sotto la propria responsabilità, i minorenni con un
          adulto.
        </li>
      </ul>
      <p>
        Vedi anche{" "}
        <Link href="/it/blog/entrainements-salle-de-sport-le-mans">
          i nostri allenamenti, da soli o in gruppo
        </Link>
        .
      </p>
      <ExerciseGuide locale="it" ids={["back-squat", "front-squat", "lateral-lunge", "step-up", "romanian-deadlift", "copenhagen-plank", "box-jump"]} />
    </>
  );
}
