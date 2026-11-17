import Image from "next/image";
import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        In fondo al giardino, in una dépendance separata dalla casa, vi aspetta una vera sala
        pesi e di cross training: rack per squat, bilanciere olimpico, 185 kg di carico, cavo
        con carrucola, vogatore Concept2 ed ellittica. È riservata al vostro gruppo per tutto il
        soggiorno. Ecco cosa contiene, cosa ci si può fare e per chi cambia il soggiorno.
      </p>

      <h2>Una sala a parte, riservata al vostro gruppo</h2>
      <p>
        La palestra non è un angolo di garage con due manubri: è uno spazio dedicato, separato
        dalla casa, con il <strong>pavimento coperto da piastrelle antishock in gomma da 20
        mm</strong>, le stesse dei box di cross training. Si può{" "}
        <strong>lasciar cadere un bilanciere caricato con i bumper</strong> dopo uno stacco da
        terra o uno slancio, senza rovinare il pavimento né svegliare la casa. Poiché la casa si
        affitta per intero, la palestra non è condivisa con nessuno al di fuori del vostro
        gruppo.
      </p>

      <h2>L'attrezzatura, zona per zona</h2>

      <h3>La forza: rack, bilanciere e bumper</h3>
      <ul>
        <li>
          <strong>Un rack per squat</strong> con sbarra per trazioni, parallele per dip e
          appoggi regolabili: squat, panca piana, military press, trazioni, dip, in sicurezza.
        </li>
        <li>
          <strong>Un bilanciere olimpico da 20 kg</strong> (2,20 m), con un cuscinetto
          protettivo per lo squat e due fermadischi.
        </li>
        <li>
          <strong>165 kg di bumper</strong>, da 2,5 a 25 kg: <strong>fino a 185 kg
          sul bilanciere</strong>. Quanto basta per lavorare pesante nello squat e nello stacco
          da terra.
        </li>
        <li>
          <strong>Una panca regolabile</strong> (piana, inclinata) e una{" "}
          <strong>cintura da sollevamento pesi</strong>.
        </li>
      </ul>

      <figure className="my-8">
        <Image
          src="/images/blog/salle-de-sport/cage-powergym.jpg"
          alt="Il rack per squat della palestra: sbarra per trazioni, parallele per dip, appoggi e cavo alto e basso"
          width={772}
          height={772}
          sizes="(max-width: 768px) 100vw, 512px"
          className="mx-auto w-full max-w-md rounded-xl bg-white"
        />
        <figcaption className="mt-2 text-center text-sm text-secondary">
          Il rack della palestra, con il suo cavo alto e basso (foto: Powergym).
        </figcaption>
      </figure>

      <figure className="my-8">
        <Image
          src="/images/blog/entrainement-salle-de-sport.jpg"
          alt="La palestra: il rack, la panca, i bumper riposti e la cintura da sollevamento pesi"
          width={1920}
          height={1280}
          sizes="(max-width: 768px) 100vw, 768px"
          className="w-full rounded-xl"
        />
        <figcaption className="mt-2 text-center text-sm text-secondary">
          La panca, i bumper riposti e la cintura, accanto al rack.
        </figcaption>
      </figure>

      <h3>Il cavo e i manubri</h3>
      <ul>
        <li>
          <strong>Un cavo alto e basso</strong> montato sul rack, con cinque impugnature: una
          maniglia per rematore a presa neutra, una corda per tricipiti, una barra larga per i
          dorsali, una maniglia singola per lavorare un braccio alla volta e una barra dritta
          corta. Lat machine, pulley, estensioni, curl, rotazioni della spalla.
        </li>
        <li>
          <strong>60 kg di dischi in ghisa</strong> (da 1 a 10 kg) per caricare il cavo o i
          manubri, al chilo.
        </li>
      </ul>

      <h3>Il cardio</h3>
      <ul>
        <li>
          <strong>Un vogatore Concept2</strong>, il riferimento delle palestre e dei club di
          canottaggio: interval training, resistenza, sfide a cronometro.
        </li>
        <li>
          <strong>Un'ellittica NordicTrack</strong>, senza impatto sulle articolazioni.
        </li>
        <li>
          <strong>Una corda per saltare</strong>.
        </li>
      </ul>

      <h3>Il cross training, il corpo libero e la mobilità</h3>
      <ul>
        <li>
          <strong>Una palla medica da 6 kg</strong> e un <strong>box da salto in legno</strong>{" "}
          regolabile da 20 a 50 cm.
        </li>
        <li>
          <strong>Degli elastici</strong>, un <strong>bastone per la mobilità</strong> e dei{" "}
          <strong>tappetini</strong> per il riscaldamento, il core e lo stretching.
        </li>
      </ul>

      <h2>Cosa ci si può fare</h2>
      <figure className="my-8">
        <Image
          src="/images/blog/salle-de-sport/cage-exercices-powergym.jpg"
          alt="Esempi di esercizi sul rack: squat, trazioni, lat machine, dip, pulley al cavo basso"
          width={772}
          height={772}
          sizes="(max-width: 768px) 100vw, 640px"
          className="mx-auto w-full max-w-xl rounded-xl bg-white"
        />
        <figcaption className="mt-2 text-center text-sm text-secondary">
          Squat, trazioni, dip, tirate: cosa permette lo stesso rack (foto: Powergym).
        </figcaption>
      </figure>

      <ul>
        <li>
          <strong>Aumentare la forza</strong>: squat, stacco da terra, panca piana, trazioni
          zavorrate, con carichi seri.
        </li>
        <li>
          <strong>Mettere su massa muscolare</strong>: bilanciere, cavo e manubri per lavorare
          ogni gruppo muscolare, dalla schiena ai tricipiti.
        </li>
        <li>
          <strong>Migliorare il fiato</strong>: interval training al vogatore, resistenza
          all'ellittica, salto con la corda.
        </li>
        <li>
          <strong>Bruciare calorie</strong>: circuiti e AMRAP che combinano palla medica, box
          jump, corda e vogatore.
        </li>
        <li>
          <strong>Preparare una gara</strong>: rinforzo specifico per il vostro sport,
          prevenzione degli infortuni, attivazione la mattina della prova.
        </li>
        <li>
          <strong>Recuperare</strong>: defaticamento sull'ellittica, mobilità e stretching, poi
          la sala zen.
        </li>
      </ul>
      <p>
        Abbiamo raccolto allenamenti pronti da seguire, da soli o in gruppo, nel{" "}
        <Link href="/it/blog/entrainements-salle-de-sport-le-mans">
          nostro articolo sugli allenamenti
        </Link>
        , e una routine post-allenamento nel{" "}
        <Link href="/it/blog/recuperation-apres-effort-le-mans">
          nostro articolo sul recupero
        </Link>
        .
      </p>

      <h2>Per chi</h2>
      <ul>
        <li>
          <strong>Le squadre sportive</strong> in torneo o in ritiro: la preparazione atletica
          si fa in casa, tra una partita e l'altra. Vedi il{" "}
          <Link href="/it/blog/equipe-sportive-le-mans">nostro articolo sulle squadre sportive</Link>
          .
        </li>
        <li>
          <strong>I piloti e i loro team</strong>, venuti per il circuito: collo, core, cardio e
          un risveglio muscolare la mattina della gara.
        </li>
        <li>
          <strong>I seminari</strong>: una seduta collettiva di 20 minuti prima della prima
          riunione sveglia meglio di un terzo caffè.
        </li>
        <li>
          <strong>Le squadre in trasferta di lavoro</strong> a Le Mans per diverse settimane,
          che non vogliono smettere di allenarsi.
        </li>
        <li>
          <strong>Le famiglie con ragazzi</strong> sportivi, accompagnati da un adulto.
        </li>
      </ul>

      <h2>La preparazione atletica, sport per sport</h2>
      <p>Un articolo per disciplina, con allenamenti pensati per questa palestra:</p>
      <ul>
        <li>
          <Link href="/it/blog/preparation-physique-course-automobile-le-mans">
            Automobilismo
          </Link>{" "}
          e{" "}
          <Link href="/it/blog/preparation-physique-karting-le-mans">kart</Link>;
        </li>
        <li>
          <Link href="/it/blog/preparation-physique-cyclisme-le-mans">ciclismo</Link>,{" "}
          <Link href="/it/blog/preparation-physique-roller-le-mans">pattinaggio in linea</Link> e{" "}
          <Link href="/it/blog/preparation-physique-course-a-pied-le-mans">corsa</Link>
          ;
        </li>
        <li>
          <Link href="/it/blog/preparation-physique-volley-ball-le-mans">pallavolo</Link>,{" "}
          <Link href="/it/blog/preparation-physique-handball-le-mans">pallamano</Link> ed{" "}
          <Link href="/it/blog/preparation-physique-equitation-le-mans">equitazione</Link>.
        </li>
      </ul>

      <h2>Con il resto della casa</h2>
      <ul>
        <li>
          <strong>Una sala zen con tappetini da yoga</strong> per lo stretching in tranquillità.
        </li>
        <li>
          <strong>Il parco del Gué de Maulny</strong> (10 ettari) a 5 minuti a piedi, per
          correre.
        </li>
        <li>
          <strong>Un bagno con doccia per camera</strong>: 9 camere, 9 docce, nessuna fila dopo
          l'allenamento.
        </li>
        <li>
          <strong>Lavatrice e asciugatrice</strong> per l'abbigliamento sportivo.
        </li>
        <li>
          <strong>Una cucina attrezzata</strong> e un grande tavolo da 16 a 20 posti per i pasti
          di squadra.
        </li>
      </ul>

      <h2>Buono a sapersi</h2>
      <ul>
        <li>
          <strong>Senza istruttore</strong>: la palestra si usa sotto la responsabilità di
          ciascuno. Riscaldatevi, scegliete carichi che controllate, fatevi assistere per le
          serie pesanti in panca, e rimettete a posto l'attrezzatura dopo l'allenamento.
        </li>
        <li>
          <strong>I minorenni</strong> si allenano accompagnati da un adulto (genitore o
          accompagnatore del club).
        </li>
        <li>
          <strong>Si lasciano cadere i bumper, non la ghisa</strong>: le piastrelle sono fatte
          per un bilanciere caricato con i bumper; i dischi in ghisa e i manubri si
          riappoggiano.
        </li>
      </ul>

      <h2>Prenotate la casa e la sua palestra</h2>
      <p>
        La palestra è compresa nell'affitto della casa, come la sala zen e il giardino.
        Consultate le nostre <Link href="/it#disponibilite">disponibilità in tempo reale</Link>{" "}
        e prenotate direttamente, senza commissioni.
      </p>
      <ExerciseGuide locale="it" ids={["back-squat", "deadlift", "bench-press", "pull-up", "seated-cable-row", "rowing", "medicine-ball-thruster", "box-jump"]} />
    </>
  );
}
