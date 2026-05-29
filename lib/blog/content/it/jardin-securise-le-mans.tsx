import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Con il ritorno della bella stagione, il nostro giardino è pronto ad accogliervi. Uno
        spazio esterno privato di 90 m², completamente recintato e sicuro, nel cuore di Le Mans:
        il luogo ideale per godersi le lunghe serate estive in famiglia, tra amici o in gruppo.
      </p>

      <h2>Un giardino recintato e completamente sicuro</h2>
      <p>
        Il giardino è <strong>completamente recintato</strong>: un vero rifugio, al riparo da
        sguardi indiscreti e dal traffico. Un aspetto rassicurante per le famiglie con bambini
        piccoli, che possono giocare all'aperto in tutta tranquillità, e perfetto per i gruppi
        che desiderano uno spazio privato tutto per sé. Esposto a <strong>pieno sud</strong>,
        gode del sole tutto il giorno.
      </p>

      <h2>Uno spazio esterno pensato per ritrovarsi</h2>
      <p>
        Il giardino è stato allestito per ospitare comodamente un grande gruppo — proprio come
        l'interno della casa, che ospita fino a 18 persone nelle sue 9 suite:
      </p>
      <ul>
        <li>
          <strong>Un salotto da giardino da 8 posti</strong>: divani e poltrone per gli
          aperitivi al sole e i momenti di relax.
        </li>
        <li>
          <strong>Grandi tavoli per mangiare all'aperto fino a 20 persone</strong>: perfetti per
          i pasti di squadra, le cene in famiglia o le grigliate tra amici.
        </li>
        <li>
          <strong>90 m² in totale</strong>: 25 m² di piantumazioni e un'ampia area in ghiaia
          facile da vivere.
        </li>
      </ul>

      <h2>Ideale per ogni tipo di soggiorno</h2>
      <ul>
        <li>
          <strong>Famiglie</strong>: uno spazio chiuso e sicuro dove i bambini giocano
          liberamente mentre i genitori si rilassano.
        </li>
        <li>
          <strong>Gruppi di amici</strong>: aperitivi al sole, lunghe tavolate e serate
          conviviali senza disturbare il vicinato.
        </li>
        <li>
          <strong>Club ed eventi del circuito</strong> (24 Ore, Le Mans Classic, MotoGP): il
          posto giusto per ritrovarsi tra appassionati dopo una giornata di gara.
        </li>
        <li>
          <strong>Seminari e soggiorni aziendali</strong>: una piacevole cornice esterna per le
          pause e i pasti di squadra.
        </li>
      </ul>

      <h2>A due passi dal centro e dal circuito</h2>
      <p>
        La casa è in posizione ideale: a 10 minuti a piedi dalla stazione di Le Mans (tram T1
        diretto verso il circuito), a 20 minuti dal Circuit Bugatti e vicinissima alla Cité
        Plantagenêt. Dopo una giornata di visite o di gara, niente di meglio che tornare a
        godersi il giardino.
      </p>

      <h2>Prenotate il vostro soggiorno</h2>
      <p>
        Godetevi il giardino e tutta la casa per il vostro prossimo soggiorno a Le Mans.
        Consultate le nostre <Link href="/it#disponibilite">disponibilità in tempo reale</Link> e
        prenotate in diretta, senza commissioni.
      </p>
    </>
  );
}
