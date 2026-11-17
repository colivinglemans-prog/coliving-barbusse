import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Una partita, una gara, una giornata di ritiro o una staffetta notturna: quello che fate
        nelle ore successive conta quanto lo sforzo stesso, soprattutto quando il giorno dopo vi
        aspetta un'altra prova. Ecco una routine di recupero da seguire in casa, con la
        palestra, la sala zen e il resto della casa.
      </p>

      <h2>Nella mezz'ora successiva: defaticare</h2>
      <ul>
        <li>
          <strong>10 minuti di defaticamento</strong> sull'ellittica o sul vogatore Concept2, a
          un ritmo molto facile, che permetta di parlare senza sforzo. Si aiuta il corpo a
          tornare alla calma invece di crollare sul divano.
        </li>
        <li>
          <strong>Bere</strong> e mangiare un primo spuntino: la cucina è attrezzata, basta aver
          fatto la spesa.
        </li>
        <li>
          <strong>Una doccia</strong>: ogni camera ha il proprio bagno con doccia, non c'è fila
          nemmeno in 20.
        </li>
      </ul>

      <h2>La routine di mobilità (20 minuti)</h2>
      <p>
        Da fare nella sala zen, sui tappetini da yoga, oppure in palestra sui tappetini:
      </p>
      <ul>
        <li>
          <strong>Spalle</strong>: passaggi delle spalle con il bastone, da davanti a dietro, 2
          × 10; poi extrarotazioni con l'elastico, 2 × 15, senza carico pesante.
        </li>
        <li>
          <strong>Schiena</strong>: gatto-mucca a quattro zampe, 10 volte lentamente; poi
          sospensione alla sbarra per trazioni, 2 × 20 secondi, piedi a terra se serve, per
          decomprimere.
        </li>
        <li>
          <strong>Anche</strong>: squat profondo tenuto 1 minuto aggrappandosi al rack, affondo
          basso 45 secondi per lato, posizione del piccione 1 minuto per lato.
        </li>
        <li>
          <strong>Gambe</strong>: femorali con l'elastico, sdraiati sulla schiena, 45 secondi per
          gamba; polpacci contro il muro, 45 secondi per gamba.
        </li>
        <li>
          <strong>Collo</strong> (dopo una gara o un lungo viaggio): inclinazioni e rotazioni
          lente, 5 per lato.
        </li>
      </ul>

      <h2>Il pasto di squadra</h2>
      <p>
        Dopo lo sforzo servono carboidrati per ricostituire le riserve e proteine per i muscoli.
        Il grande tavolo della cucina conta <strong>16 posti a sedere, 20</strong>{" "}
        accostando i tavolini della veranda: tutta la squadra mangia insieme, all'ora che
        preferisce, quello che si cucina da sé. La cucina ha due forni, due piani cottura,
        grandi pentole e stoviglie per 20.
      </p>

      <h2>Il sonno, la vera leva</h2>
      <ul>
        <li>
          <strong>Una camera per persona o per coppia</strong>, ciascuna con la propria porta e
          la propria chiave: nessuno si sveglia quando rientra l'ultimo.
        </li>
        <li>
          <strong>Tapparelle che fanno il buio completo</strong>, anche in pieno giorno:
          indispensabile per le squadre notturne e i piloti che dormono tra due turni di guida.
          Vedi anche il{" "}
          <Link href="/it/blog/equipe-de-nuit-le-mans">nostro articolo sulle squadre notturne</Link>
          .
        </li>
        <li>
          <strong>Una casa in un quartiere residenziale tranquillo</strong>.
        </li>
      </ul>

      <h2>La mattina dopo</h2>
      <ul>
        <li>
          <strong>Defaticamento</strong>: 20 minuti di corsa lentissima al parco del Gué de
          Maulny, a 5 minuti a piedi, oppure 20 minuti di ellittica se le gambe sono pesanti.
        </li>
        <li>
          <strong>Mobilità</strong>: la stessa routine della sera prima, in versione breve.
        </li>
        <li>
          <strong>Niente allenamento pesante</strong> il giorno dopo una gara: la forza si
          riprende due giorni più tardi.
        </li>
      </ul>

      <h2>Le divise pulite per il giorno dopo</h2>
      <p>
        Un torneo di due giorni significa due set di divise. La casa ha{" "}
        <strong>lavatrice e asciugatrice</strong>: le maglie del sabato sono pronte per la
        domenica.
      </p>

      <h2>Informazioni pratiche</h2>
      <ul>
        <li>
          La palestra, la sala zen e il giardino sono compresi nell'affitto della casa intera.
          Il dettaglio dell'attrezzatura è nel{" "}
          <Link href="/it/blog/salle-de-sport-privee-le-mans">
            nostro articolo sulla palestra
          </Link>
          .
        </li>
        <li>
          Questi consigli non sostituiscono quelli del vostro fisioterapista o del vostro
          medico, in caso di dolore o infortunio.
        </li>
        <li>
          Per allenarvi durante il soggiorno, vedi{" "}
          <Link href="/it/blog/entrainements-salle-de-sport-le-mans">
            i nostri allenamenti, da soli o in gruppo
          </Link>
          .
        </li>
      </ul>
      <ExerciseGuide locale="it" ids={["rowing", "band-external-rotation"]} />
    </>
  );
}
