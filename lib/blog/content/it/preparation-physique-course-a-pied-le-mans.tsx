import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Un runner che si allena con i pesi corre più a lungo senza infortunarsi: polpacci, anche
        e tronco più forti assorbono meglio le migliaia di appoggi di una gara. Per un club
        venuto in ritiro, una gara su strada o un trail nella zona, ecco come combinare{" "}
        <Link href="/it/blog/salle-de-sport-privee-le-mans">la palestra della casa</Link>{" "}
        e le uscite nel parco vicino.
      </p>

      <h2>Correre a due passi da casa</h2>
      <p>
        Il <strong>parco del Gué de Maulny</strong> (10 ettari) è a 5 minuti a piedi: quanto
        basta per una corsa lenta, delle ripetute o degli esercizi di tecnica di corsa senza
        prendere l'auto. Il resto dell'allenamento si fa in palestra.
      </p>

      <h2>Cosa porta il lavoro con i pesi al runner</h2>
      <ul>
        <li>
          <strong>Polpacci e tendini d'Achille più resistenti</strong>.
        </li>
        <li>
          <strong>Anche stabili</strong>: il ginocchio cede meno verso l'interno a ogni
          appoggio.
        </li>
        <li>
          <strong>Una migliore economia di corsa</strong>: la forza rende ogni falcata meno
          dispendiosa.
        </li>
        <li>
          <strong>Un tronco che tiene</strong> a fine gara, quando la postura peggiora.
        </li>
      </ul>

      <h2>L'allenamento di rinforzo del runner (45 minuti)</h2>
      <ul>
        <li>
          <strong>Back squat o goblet squat</strong>: 3 × 6-8.
        </li>
        <li>
          <strong>Stacco rumeno</strong>: 3 × 8.
        </li>
        <li>
          <strong>Step-up sul box</strong> (40 cm): 3 × 8 per gamba.
        </li>
        <li>
          <strong>Affondi in camminata</strong>: 2 × 10 per gamba.
        </li>
        <li>
          <strong>Calf raise in piedi</strong>, bilanciere sulla schiena: 3 × 15, poi su una
          gamba 2 × 12.
        </li>
        <li>
          <strong>Core</strong>: plank laterale 2 × 30 s per lato, dead bug 2 × 10.
        </li>
        <li>
          <strong>Anche</strong>: camminata laterale con elastico intorno alle ginocchia, 2 × 15
          passi per lato.
        </li>
      </ul>

      <h2>L'allenamento incrociato, senza impatto</h2>
      <p>
        Per un giorno di recupero o per un runner che rientra da un infortunio: da 30 a 40
        minuti di ellittica o di vogatore Concept2. Il cuore lavora come in corsa, le
        articolazioni riposano. Variante: 5 × 4 minuti sostenuti sull'ellittica, 2 minuti facili
        tra una ripetuta e l'altra.
      </p>

      <h2>Un weekend di ritiro tipo</h2>
      <ul>
        <li>
          <strong>Sabato mattina</strong>: ripetute al parco (per esempio 8 × 400 m), poi core in
          palestra.
        </li>
        <li>
          <strong>Sabato sera</strong>: l'allenamento di rinforzo qui sopra, pasto di squadra.
        </li>
        <li>
          <strong>Domenica mattina</strong>: lungo a ritmo blando, poi{" "}
          <Link href="/it/blog/recuperation-apres-effort-le-mans">routine di recupero</Link>
          .
        </li>
      </ul>

      <h2>Prima di una gara</h2>
      <p>
        Nei tre giorni precedenti, niente pesi pesanti. La vigilia: 20 minuti di corsa
        leggerissima con qualche allungo. La mattina: 10 minuti di ellittica, qualche esercizio
        di tecnica di corsa e mobilità di caviglie e anche.
      </p>

      <h2>Informazioni pratiche</h2>
      <ul>
        <li>
          9 camere con bagno con doccia, fino a 20 persone: tutto il club sotto lo stesso tetto.
        </li>
        <li>Lavatrice e asciugatrice per l'abbigliamento del giorno prima.</li>
        <li>Cucina attrezzata per il piatto di pasta della vigilia di gara.</li>
        <li>
          Senza istruttore: ognuno si allena sotto la propria responsabilità, i minorenni con un
          adulto.
        </li>
      </ul>
      <p>
        Vedi anche{" "}
        <Link href="/it/blog/entrainements-salle-de-sport-le-mans">
          i nostri allenamenti, da soli o in gruppo
        </Link>{" "}
        e il{" "}
        <Link href="/it/blog/equipe-sportive-le-mans">nostro articolo per le squadre sportive</Link>
        .
      </p>
      <ExerciseGuide locale="it" ids={["back-squat", "goblet-squat", "romanian-deadlift", "step-up", "walking-lunge", "calf-raise", "side-plank", "dead-bug"]} />
    </>
  );
}
