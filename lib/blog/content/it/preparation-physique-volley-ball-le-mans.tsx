import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Nella pallavolo si salta, si schiaccia, si atterra, e si ricomincia centinaia di volte
        per torneo. Una squadra di pallavolo che alloggia da noi può mantenere la propria
        elevazione e proteggere spalle e ginocchia nella{" "}
        <Link href="/it/blog/salle-de-sport-privee-le-mans">palestra della casa</Link>
        . Ecco gli allenamenti che proponiamo, prima e durante un torneo.
      </p>

      <h2>Cosa chiede la pallavolo</h2>
      <ul>
        <li>
          <strong>L'elevazione</strong>: gambe forti e rapide per l'attacco e il muro.
        </li>
        <li>
          <strong>Atterraggi controllati</strong>: ginocchia e caviglie assorbono ogni salto.
        </li>
        <li>
          <strong>Spalle solide</strong>: la schiacciata e la battuta sollecitano la cuffia dei
          rotatori.
        </li>
        <li>
          <strong>Un tronco stabile</strong> che trasmette la forza dalle gambe al braccio.
        </li>
      </ul>

      <h2>L'allenamento per l'elevazione (45 minuti)</h2>
      <ul>
        <li>
          <strong>Box jump</strong>: 4 × 5, box da 40 a 50 cm, scendendo camminando. Si cerca la
          qualità di ogni salto, non la fatica.
        </li>
        <li>
          <strong>Back squat</strong>: 4 × 5, pesante e veloce in risalita.
        </li>
        <li>
          <strong>Hip thrust</strong> con bilanciere: 3 × 8.
        </li>
        <li>
          <strong>Affondi in camminata</strong> con manubri: 3 × 8 per gamba.
        </li>
        <li>
          <strong>Calf raise in piedi</strong>: 3 × 15.
        </li>
      </ul>

      <h2>L'allenamento di prevenzione per le spalle (20 minuti)</h2>
      <p>Da fare prima degli allenamenti o nei giorni di torneo, con carico leggero:</p>
      <ul>
        <li>
          <strong>Extrarotazioni con l'elastico</strong>, gomito aderente al corpo: 3 × 15.
        </li>
        <li>
          <strong>Face pull</strong> con la corda, cavo alto: 3 × 15.
        </li>
        <li>
          <strong>Lat machine</strong> al cavo, barra larga: 3 × 12.
        </li>
        <li>
          <strong>Piegamenti</strong>: 3 × 10, scapole attive.
        </li>
        <li>
          <strong>Thruster con la palla medica</strong>: 3 × 10, per coordinare gambe e braccia.
        </li>
      </ul>

      <h2>In squadra: il circuito pallavolo</h2>
      <p>
        Per 6-12 giocatori, a coppie: 40 secondi per stazione, 20 secondi per cambiare, due
        giri. Box jump, thruster con la palla medica, vogatore, face pull, affondi, plank, salto
        con la corda, rotazioni con l'elastico. Il coach dà il ritmo, la palestra accoglie
        tutti.
      </p>

      <h2>Durante il torneo</h2>
      <ul>
        <li>
          <strong>La mattina</strong>: attivazione di 15 minuti, ellittica, rotazioni delle
          spalle con l'elastico, qualche salto sul posto.
        </li>
        <li>
          <strong>La sera</strong>: niente pesi pesanti;{" "}
          <Link href="/it/blog/recuperation-apres-effort-le-mans">routine di recupero</Link>
          , pasto di squadra al grande tavolo e una vera notte di sonno.
        </li>
        <li>
          <strong>Le maglie</strong> passano in lavatrice e in asciugatrice per il giorno dopo.
        </li>
      </ul>

      <h2>Informazioni pratiche per un club</h2>
      <ul>
        <li>
          9 camere con bagno con doccia, fino a 20 persone: tutta la squadra e il suo staff.
        </li>
        <li>
          I ragazzi dai 10 ai 17 anni sono accolti sotto la responsabilità dei loro
          accompagnatori maggiorenni; in palestra, i minorenni si allenano con un adulto.
        </li>
        <li>
          Antarès è servito dal tram T1 diretto dalla stazione, a 15 minuti a piedi dalla casa.
        </li>
        <li>Pagamento possibile con fattura intestata al club.</li>
      </ul>
      <p>
        Maggiori informazioni nel{" "}
        <Link href="/it/blog/equipe-sportive-le-mans">nostro articolo per le squadre sportive</Link>
        .
      </p>
      <ExerciseGuide locale="it" ids={["box-jump", "back-squat", "hip-thrust", "walking-lunge", "calf-raise", "band-external-rotation", "face-pull", "lat-pulldown", "push-up", "medicine-ball-thruster"]} />
    </>
  );
}
