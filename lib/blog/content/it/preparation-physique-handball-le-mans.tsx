import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        La pallamano concatena scatti, duelli, cambi di direzione e tiri in sospensione: uno
        sport di contatto che sollecita le ginocchia e la spalla del braccio di tiro. Ad agosto
        2026 una squadra femminile di pallamano ha trascorso un weekend di torneo nella casa, in
        19 con il suo staff. Ecco come usare{" "}
        <Link href="/it/blog/salle-de-sport-privee-le-mans">la palestra della casa</Link>{" "}
        per preparare una partita o un ritiro.
      </p>

      <h2>Cosa chiede la pallamano</h2>
      <ul>
        <li>
          <strong>Esplosività</strong>: partenze, salti, appoggi.
        </li>
        <li>
          <strong>Ginocchia protette</strong>: gli atterraggi e i cambi di direzione sono il
          primo rischio di infortunio.
        </li>
        <li>
          <strong>Una spalla da tiratore solida</strong>, in particolare nella parte posteriore
          della spalla.
        </li>
        <li>
          <strong>Un tronco forte</strong> per i duelli.
        </li>
      </ul>

      <h2>L'allenamento di forza ed esplosività (50 minuti)</h2>
      <ul>
        <li>
          <strong>Box jump</strong>: 4 × 4, atterraggio silenzioso, ginocchia in linea con i
          piedi.
        </li>
        <li>
          <strong>Back squat</strong>: 4 × 5.
        </li>
        <li>
          <strong>Stacco rumeno</strong>: 3 × 8, per i femorali, che proteggono il ginocchio.
        </li>
        <li>
          <strong>Affondi in camminata</strong> con manubri: 3 × 8 per gamba.
        </li>
        <li>
          <strong>Panca piana</strong>: 3 × 6.
        </li>
        <li>
          <strong>Trazioni</strong>: 3 serie al massimo meno una.
        </li>
        <li>
          <strong>Thruster con la palla medica</strong>: 3 × 10, spinta esplosiva.
        </li>
      </ul>

      <h2>La prevenzione, da fare prima di ogni allenamento (15 minuti)</h2>
      <ul>
        <li>
          <strong>Spalla</strong>: extrarotazioni con l'elastico 3 × 15, face pull con la corda
          3 × 15.
        </li>
        <li>
          <strong>Ginocchia</strong>: atterraggi su una gamba dal box basso (20 cm), 3 × 5 per
          gamba, tenendo l'atterraggio 2 secondi, ginocchio in linea.
        </li>
        <li>
          <strong>Adduttori</strong>: Copenhagen plank, 2 × 20 s per lato.
        </li>
        <li>
          <strong>Core</strong>: plank laterale, 2 × 30 s per lato.
        </li>
      </ul>

      <h2>Il circuito di squadra</h2>
      <p>
        Per una squadra di 14-16 giocatrici o giocatori: due gruppi. Il primo fa il circuito a
        stazioni in palestra (vogatore, box jump, thruster con la palla medica, cavo, trazioni,
        plank, corda, affondi), il secondo va a correre al parco del Gué de Maulny, a 5 minuti a
        piedi. Si inverte dopo 20 minuti.
      </p>

      <h2>Il weekend di torneo</h2>
      <ul>
        <li>
          <strong>La mattina della partita</strong>: 15 minuti di attivazione (ellittica,
          prevenzione per spalla e ginocchia), poi partenza verso il palazzetto.
        </li>
        <li>
          <strong>Tra una partita e l'altra</strong>: pasto di squadra al grande tavolo da 16 a
          20 posti, maglie in lavatrice.
        </li>
        <li>
          <strong>La sera</strong>:{" "}
          <Link href="/it/blog/recuperation-apres-effort-le-mans">routine di recupero</Link>{" "}
          e una vera notte di sonno, ciascuno nella propria camera.
        </li>
      </ul>

      <h2>Informazioni pratiche per un club</h2>
      <ul>
        <li>
          Antarès, dove si giocano anche partite di pallamano, è servito dal tram T1 diretto
          dalla stazione, a 15 minuti a piedi dalla casa.
        </li>
        <li>
          9 camere con bagno con doccia, fino a 20 persone; i ragazzi dai 10 ai 17 anni sotto la
          responsabilità dei loro accompagnatori, i minorenni in palestra con un adulto.
        </li>
        <li>Pagamento possibile con fattura intestata al club.</li>
      </ul>
      <p>
        Maggiori informazioni nel{" "}
        <Link href="/it/blog/equipe-sportive-le-mans">nostro articolo per le squadre sportive</Link>
        .
      </p>
      <ExerciseGuide locale="it" ids={["box-jump", "back-squat", "romanian-deadlift", "walking-lunge", "bench-press", "pull-up", "medicine-ball-thruster", "band-external-rotation", "face-pull", "copenhagen-plank", "side-plank"]} />
    </>
  );
}
