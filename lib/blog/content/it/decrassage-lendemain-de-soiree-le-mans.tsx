import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Un matrimonio nella zona, un compleanno al ristorante, una serata in città o la vittoria
        festeggiata dopo la gara: la mattina dopo, le gambe sono pesanti e la testa pure.
        Piuttosto che restare sul divano, una seduta di defaticamento leggera aiuta a rimettersi
        in moto. Ecco come farla in casa, con{" "}
        <Link href="/it/blog/salle-de-sport-privee-le-mans">la palestra</Link>, la sala zen e il
        parco vicino.
      </p>

      <h2>Cosa fa il defaticamento, e cosa non fa</h2>
      <ul>
        <li>
          <strong>Rimette il corpo in movimento</strong>: la circolazione riparte, i muscoli
          irrigiditi dal ballo o da una notte corta si sciolgono, e spesso ci si sente meglio
          dopo che prima.
        </li>
        <li>
          <strong>Non elimina l'alcol più in fretta</strong>: solo il tempo lo fa. Una serata
          non si «suda via».
        </li>
        <li>
          <strong>Non sostituisce né l'acqua, né il sonno, né una vera colazione</strong>.
        </li>
      </ul>

      <h2>Prima di iniziare</h2>
      <ul>
        <li>
          <strong>Se avete bevuto ancora da poco, niente allenamento</strong>: l'equilibrio e i
          riflessi non sono tornati. Niente carichi pesanti, niente box jump, niente bilanciere
          sopra la testa quel giorno.
        </li>
        <li>
          <strong>Bevete prima</strong> un grande bicchiere d'acqua, e tenete una bottiglia a
          portata di mano durante la seduta.
        </li>
        <li>
          <strong>Mangiate qualcosa</strong>: del pane, una banana, qualcosa di semplice. La
          cucina è attrezzata, anche con la macchina da caffè con macinino.
        </li>
        <li>
          Vertigini, nausea, cuore che accelera: ci si ferma e ci si riposa. Il defaticamento
          deve restare piacevole.
        </li>
      </ul>

      <h2>La seduta di defaticamento (30 minuti)</h2>
      <ul>
        <li>
          <strong>Da 10 a 15 minuti di cardio molto facile</strong> sull'ellittica o sul
          vogatore Concept2. Dovete poter parlare senza sforzo. Se il vogatore sembra troppo
          duro, basta l'ellittica.
        </li>
        <li>
          <strong>Mobilità, 10 minuti</strong>: passaggi delle spalle con il bastone,
          gatto-mucca a quattro zampe, squat profondo tenuto aggrappandosi al rack, affondo basso
          30 secondi per lato.
        </li>
        <li>
          <strong>Un po' di rinforzo leggero</strong> se torna la voglia: 2 giri di 10 goblet
          squat con un bumper da 5 kg, 10 pulley al cavo basso, 20 secondi di plank.
        </li>
        <li>
          <strong>Stretching nella sala zen</strong>, sui tappetini da yoga, respirando
          lentamente: 5 minuti.
        </li>
      </ul>

      <h2>Oppure all'aperto: la camminata al parco</h2>
      <p>
        Il <strong>parco del Gué de Maulny</strong> (10 ettari) è a 5 minuti a piedi. Una
        camminata di 20-30 minuti all'aria aperta, in gruppo, fa spesso bene quanto la palestra,
        e nessuno ha bisogno di cambiarsi. I più in forma possono fare un giro di corsetta.
      </p>

      <h2>In gruppo: il defaticamento collettivo</h2>
      <p>
        Dopo un matrimonio o un weekend tra amici, la seduta si può fare insieme: un gruppo in
        palestra (ellittica e vogatore a turno, mobilità sui tappetini), l'altro a camminare al
        parco, poi si inverte. Si finisce tutti attorno al grande tavolo della cucina, 16 posti a
        sedere, 20 con i tavolini della veranda, per un brunch.
      </p>

      <h2>Il resto della mattinata</h2>
      <ul>
        <li>
          <strong>Una doccia</strong> nel proprio bagno con doccia: 9 camere, 9 docce, nessuna
          attesa nemmeno in 20.
        </li>
        <li>
          <strong>Un pisolino</strong> se serve: le tapparelle delle camere fanno il buio
          completo, anche in pieno giorno.
        </li>
        <li>
          <strong>La partenza</strong> è entro le 11:00; una partenza posticipata è possibile su
          richiesta, a pagamento e secondo disponibilità. Comodo il giorno dopo un matrimonio.
        </li>
      </ul>

      <h2>Buono a sapersi</h2>
      <ul>
        <li>
          La casa accoglie famiglie e gruppi, ma <strong>non è una sala per feste</strong>:
          niente serate né feste rumorose sul posto. La serata si passa in città o nella sala
          ricevimenti, la notte e il giorno dopo in casa.
        </li>
        <li>
          La palestra si usa senza istruttore, sotto la responsabilità di ciascuno; i minorenni
          con un adulto.
        </li>
        <li>
          Per un allenamento più completo nei giorni seguenti, vedi{" "}
          <Link href="/it/blog/entrainements-salle-de-sport-le-mans">
            i nostri allenamenti da soli o in gruppo
          </Link>{" "}
          e la{" "}
          <Link href="/it/blog/recuperation-apres-effort-le-mans">
            nostra routine di recupero
          </Link>
          .
        </li>
      </ul>
      <ExerciseGuide locale="it" ids={["rowing", "goblet-squat", "seated-cable-row", "plank"]} />
    </>
  );
}
