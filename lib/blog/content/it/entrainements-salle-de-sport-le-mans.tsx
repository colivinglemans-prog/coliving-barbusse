import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Siete in casa per qualche giorno e la palestra è in fondo al giardino. Ecco degli
        allenamenti pronti da seguire, da soli o in gruppo, da 20 a 60 minuti, secondo il vostro
        obiettivo: forza, massa muscolare, cardio, perdita di peso o semplice ripresa. Tutti
        usano l'attrezzatura della{" "}
        <Link href="/it/blog/salle-de-sport-privee-le-mans">nostra palestra privata</Link>.
      </p>

      <h2>Prima di iniziare</h2>
      <ul>
        <li>
          <strong>I carichi non sono imposti</strong>: si esprimono in sforzo percepito.
          «Impegnativo» vuol dire che vi restano due ripetizioni in riserva alla fine della
          serie; «massimale», nessuna.
        </li>
        <li>
          <strong>Riscaldamento comune a tutti gli allenamenti</strong> (da 8 a 10 minuti): 5
          minuti di vogatore o di ellittica a ritmo blando, poi 2 giri di 10 rotazioni delle
          spalle con il bastone, 10 squat a corpo libero, 10 affondi, 10 piegamenti, 20 secondi
          di plank.
        </li>
        <li>
          <strong>Senza istruttore</strong>: la palestra si usa sotto la vostra responsabilità.
          Aumentate i carichi progressivamente, fatevi assistere in panca e, in caso di dubbi
          sulla vostra salute, chiedete il parere di un medico prima di cominciare. I minorenni
          si allenano con un adulto.
        </li>
        <li>
          <strong>Il pavimento è fatto per lasciar cadere un bilanciere caricato con i
          bumper</strong> (piastrelle in gomma da 20 mm); la ghisa e i manubri si riappoggiano.
        </li>
      </ul>

      <h2>Allenamenti da soli</h2>

      <h3>Forza (60 minuti)</h3>
      <ul>
        <li>
          <strong>Back squat</strong> nel rack: 5 serie da 5, impegnativo, da 2 a 3 minuti di
          recupero.
        </li>
        <li>
          <strong>Panca piana</strong>, nel rack con le sicure: 5 × 5.
        </li>
        <li>
          <strong>Trazioni</strong> alla sbarra del rack: 4 serie al massimo meno una
          ripetizione (con elastico per aiutarsi se serve).
        </li>
        <li>
          <strong>Pulley al cavo basso</strong>, maniglia a presa neutra: 3 × 10.
        </li>
        <li>Finire con 3 × 30 secondi di plank.</li>
      </ul>

      <h3>Massa muscolare, parte superiore (50 minuti)</h3>
      <ul>
        <li>Panca inclinata: 4 × 8-10.</li>
        <li>Lat machine al cavo alto, barra larga: 4 × 10-12.</li>
        <li>Military press con bilanciere, in piedi: 3 × 8.</li>
        <li>Dip: 3 serie al massimo meno due.</li>
        <li>Push down per tricipiti al cavo, corda o barra dritta corta: 3 × 12-15.</li>
        <li>Rematore a un braccio al cavo basso, maniglia singola: 3 × 10 per braccio.</li>
        <li>Curl bicipiti al cavo basso, barra dritta corta o corda: 3 × 12.</li>
      </ul>

      <h3>Massa muscolare, parte inferiore (50 minuti)</h3>
      <ul>
        <li>Front squat o back squat: 4 × 8.</li>
        <li>Stacco rumeno con bilanciere: 4 × 10.</li>
        <li>Affondi in camminata con manubri: 3 × 10 per gamba.</li>
        <li>Step-up sul box (da 30 a 40 cm): 3 × 10 per gamba.</li>
        <li>Calf raise in piedi, bilanciere sulla schiena: 4 × 15.</li>
      </ul>

      <h3>Cardio al vogatore (35 minuti)</h3>
      <ul>
        <li>
          <strong>8 × 500 m</strong> sul Concept2, a ritmo sostenuto e regolare, 1 minuto e 30
          di recupero tra una ripetuta e l'altra. Annotate il vostro tempo medio: è il vostro
          riferimento per la prossima volta.
        </li>
        <li>
          Variante resistenza: <strong>30 minuti di ellittica</strong> a un'intensità che
          permette ancora di parlare.
        </li>
      </ul>

      <h3>Brucia grassi (AMRAP di 20 minuti)</h3>
      <p>Più giri possibili in 20 minuti, a un ritmo che riuscite a mantenere:</p>
      <ul>
        <li>10 thruster con la palla medica (6 kg)</li>
        <li>10 box jump (o step-up) sul box</li>
        <li>50 salti con la corda</li>
        <li>200 m di vogatore</li>
      </ul>

      <h3>Ripresa per chi viaggia per lavoro (30 minuti)</h3>
      <p>
        Per chi esce da una giornata di riunioni o di cantiere e non ha né l'energia né la
        voglia di un allenamento impegnativo: 10 minuti di ellittica, poi 3 giri di 12 goblet
        squat con un bumper da 5 o 10 kg, 12 pulley al cavo basso, 10 piegamenti e 30 secondi
        di plank. Finire con 5 minuti di stretching nella sala zen.
      </p>

      <h3>Mobilità (20 minuti)</h3>
      <p>
        Per i giorni di riposo o per le schiene irrigidite dal viaggio: passaggi delle spalle
        con il bastone, squat profondo tenuto aggrappandosi al rack, aperture delle anche sul
        tappetino, rotazioni delle spalle con l'elastico, poi stretching. Il dettaglio è nel{" "}
        <Link href="/it/blog/recuperation-apres-effort-le-mans">
          nostro articolo sul recupero
        </Link>
        .
      </p>

      <h2>Allenamenti in gruppo</h2>

      <h3>In due: «io lavoro, tu recuperi» (40 minuti)</h3>
      <p>
        Lavora un solo partner alla volta, l'altro recupera; ci si dà il cambio a ogni serie. 5
        giri di:
      </p>
      <ul>
        <li>250 m di vogatore (nel frattempo il partner fa plank);</li>
        <li>8 stacchi da terra con il bilanciere, con un carico comune;</li>
        <li>10 thruster con la palla medica.</li>
      </ul>

      <h3>Circuito a stazioni per 6-10 persone (45 minuti)</h3>
      <p>
        Ognuno parte da una stazione; 40 secondi di lavoro, 20 secondi per cambiare. Due o tre
        giri secondo il livello.
      </p>
      <ol>
        <li>Vogatore</li>
        <li>Ellittica</li>
        <li>Thruster con la palla medica</li>
        <li>Box jump o step-up</li>
        <li>Salto con la corda</li>
        <li>Lat machine al cavo alto</li>
        <li>Trazioni o dip (con elastico se serve)</li>
        <li>Goblet squat con un bumper</li>
        <li>Plank sul tappetino</li>
        <li>Piegamenti</li>
      </ol>
      <p>
        Se siete più di 10, fate due gruppi: uno in palestra, l'altro a correre al parco del
        Gué de Maulny, a 5 minuti a piedi, e poi si inverte.
      </p>

      <h3>Staffetta di squadra al vogatore</h3>
      <p>
        La sfida che coinvolge tutti: <strong>5.000 m di squadra</strong>, a staffetta da 250
        m, il più velocemente possibile. Si annota il tempo su un foglio, e si ripete l'ultimo
        giorno del soggiorno per vedere chi è migliorato.
      </p>

      <h3>Risveglio muscolare da seminario (20 minuti, tutti i livelli)</h3>
      <p>
        Prima della prima riunione, per una squadra che non si allena per forza: 5 minuti di
        vogatore o di ellittica a turno, poi 2 giri di 10 squat, 10 piegamenti con le mani sul
        box, 10 tirate con l'elastico e 20 secondi di plank, poi 5 minuti di stretching.
        Nessuno finisce sfinito, tutti arrivano svegli.
      </p>

      <h2>Una settimana tipo</h2>
      <ul>
        <li>
          <strong>Weekend di 2 notti</strong>: un allenamento di forza o un circuito la prima
          sera, una corsetta e un po' di mobilità la mattina dopo.
        </li>
        <li>
          <strong>Soggiorno di una settimana</strong>: forza il lunedì, cardio al vogatore il
          martedì, parte superiore il mercoledì, mobilità il giovedì, parte inferiore il
          venerdì, AMRAP o staffetta di squadra il sabato, riposo la domenica.
        </li>
        <li>
          <strong>Soggiorno lungo, in trasferta di lavoro</strong>: tre allenamenti a settimana
          (forza, parte superiore, parte inferiore) e un allenamento di cardio bastano per
          progredire.
        </li>
      </ul>

      <h2>E secondo il vostro sport</h2>
      <p>
        Per allenamenti pensati per una disciplina, leggete i nostri articoli sulla
        preparazione atletica:{" "}
        <Link href="/it/blog/preparation-physique-course-automobile-le-mans">automobilismo</Link>,{" "}
        <Link href="/it/blog/preparation-physique-karting-le-mans">kart</Link>,{" "}
        <Link href="/it/blog/preparation-physique-cyclisme-le-mans">ciclismo</Link>,{" "}
        <Link href="/it/blog/preparation-physique-roller-le-mans">pattinaggio in linea</Link>,{" "}
        <Link href="/it/blog/preparation-physique-course-a-pied-le-mans">corsa</Link>,{" "}
        <Link href="/it/blog/preparation-physique-volley-ball-le-mans">pallavolo</Link>,{" "}
        <Link href="/it/blog/preparation-physique-handball-le-mans">pallamano</Link> ed{" "}
        <Link href="/it/blog/preparation-physique-equitation-le-mans">equitazione</Link>.
      </p>
      <ExerciseGuide locale="it" ids={["back-squat", "front-squat", "goblet-squat", "bench-press", "incline-bench-press", "overhead-press", "romanian-deadlift", "deadlift", "pull-up", "dips", "push-up", "seated-cable-row", "single-arm-cable-row", "lat-pulldown", "triceps-pushdown", "cable-curl", "walking-lunge", "step-up", "calf-raise", "medicine-ball-thruster", "box-jump", "jump-rope", "rowing", "plank"]} />
    </>
  );
}
