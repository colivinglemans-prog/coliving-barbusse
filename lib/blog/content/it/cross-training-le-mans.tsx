import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Bilanciere olimpico, bumper, pavimento antishock, vogatore Concept2, palla medica, box e
        sbarra per trazioni: tutto ciò che serve per un WOD si trova nella{" "}
        <Link href="/it/blog/salle-de-sport-privee-le-mans">palestra della casa</Link>
        . Se praticate cross training (o CrossFit nel vostro box abituale), non perderete il
        ritmo durante il soggiorno a Le Mans. Ecco l'attrezzatura, e sei WOD pensati per questa
        palestra, da soli o in squadra.
      </p>

      <h2>L'attrezzatura di un box, in casa</h2>
      <ul>
        <li>
          <strong>Sollevamento pesi</strong>: bilanciere olimpico da 20 kg, 165 kg di bumper
          (185 kg compreso il bilanciere), fermadischi, cintura.
        </li>
        <li>
          <strong>Un pavimento in piastrelle di gomma da 20 mm</strong>: si lascia cadere il
          bilanciere sopra la testa o dopo uno stacco da terra, come in un box.
        </li>
        <li>
          <strong>Ginnastica</strong>: sbarra per trazioni e parallele per dip sul rack.
        </li>
        <li>
          <strong>Monostrutturale</strong>: vogatore Concept2, corda per saltare, ellittica.
        </li>
        <li>
          <strong>Funzionale</strong>: palla medica da 6 kg, box in legno regolabile da 20 a 50
          cm, manubri caricati con dischi in ghisa, cavo con carrucola.
        </li>
      </ul>
      <p>
        Cosa non c'è: né anelli, né kettlebell, né fune da arrampicata, né assault bike. I WOD
        qui sotto ne fanno a meno.
      </p>

      <h2>Sei WOD per questa palestra</h2>

      <h3>1. «Barbusse» — For time, da soli</h3>
      <p>21-15-9 ripetizioni di:</p>
      <ul>
        <li>Thruster con bilanciere (carico moderato)</li>
        <li>Trazioni</li>
      </ul>
      <p>Poi 500 m di vogatore. Time cap: 15 minuti.</p>

      <h3>2. AMRAP di 20 minuti</h3>
      <ul>
        <li>250 m di vogatore</li>
        <li>15 thruster con la palla medica</li>
        <li>10 box jump (50 cm, o step-up)</li>
        <li>5 trazioni</li>
      </ul>

      <h3>3. EMOM di 16 minuti</h3>
      <ul>
        <li>Minuti dispari: 3 power clean, pesanti ma puliti.</li>
        <li>Minuti pari: 12 calorie al vogatore.</li>
      </ul>

      <h3>4. Forza poi metcon</h3>
      <ul>
        <li>
          <strong>Forza</strong>: back squat 5-5-3-3-1, salendo fino a un carico pesante del
          giorno.
        </li>
        <li>
          <strong>Metcon</strong>: 3 giri di 400 m di vogatore, 15 dip, 50 salti con la corda.
        </li>
      </ul>

      <h3>5. In due, «you go, I go»</h3>
      <p>
        10 giri condivisi: il partner A rema 250 m mentre B tiene il bilanciere nella posizione
        alta dello stacco da terra; poi ci si scambia. Poi 50 thruster con la palla medica da
        dividersi come si vuole.
      </p>

      <h3>6. Team WOD, da 4 a 8 persone</h3>
      <p>
        Un solo bilanciere, un solo vogatore, un solo box: la squadra si divide 2.000 m di
        vogatore, 100 thruster con la palla medica, 80 box jump, 60 stacchi da terra e 40
        trazioni, nell'ordine che preferisce, una sola persona per stazione alla volta. Il
        cronometro si ferma quando tutto è fatto. Gli altri fanno il tifo.
      </p>

      <h2>Le buone pratiche</h2>
      <ul>
        <li>
          <strong>Riscaldamento</strong>: 5 minuti di vogatore, mobilità con il bastone, poi il
          bilanciere scarico per i movimenti di sollevamento pesi.
        </li>
        <li>
          <strong>Carichi adeguati</strong>: nel cross training, la tecnica viene prima del
          cronometro. Nessuno vi segue: riducete il carico o le ripetizioni se serve.
        </li>
        <li>
          <strong>Solo i bumper</strong> si lasciano cadere; la ghisa e i manubri si riappoggiano
          a terra.
        </li>
        <li>
          <strong>I minorenni</strong> si allenano con un adulto.
        </li>
        <li>
          <strong>Rimettere a posto</strong> bilancieri, dischi e box dopo l'allenamento.
        </li>
      </ul>

      <h2>Dopo il WOD</h2>
      <p>
        Doccia in camera, pasto al grande tavolo e qualche minuto di stretching nella sala zen.
        Vedi la{" "}
        <Link href="/it/blog/recuperation-apres-effort-le-mans">nostra routine di recupero</Link>{" "}
        e, per allenamenti più classici,{" "}
        <Link href="/it/blog/entrainements-salle-de-sport-le-mans">
          i nostri allenamenti da soli o in gruppo
        </Link>
        .
      </p>

      <h2>Informazioni pratiche</h2>
      <ul>
        <li>
          La casa si affitta per intero: 9 camere con bagno con doccia, fino a 20 persone.
          Ideale per un weekend di box tra amici o un ritiro di club.
        </li>
        <li>La palestra è riservata al vostro gruppo per tutto il soggiorno.</li>
        <li>
          Stazione TGV a 15 minuti a piedi, a circa 55 minuti da Parigi.
        </li>
      </ul>
      <ExerciseGuide locale="it" ids={["thruster", "pull-up", "rowing", "medicine-ball-thruster", "box-jump", "power-clean", "back-squat", "dips", "jump-rope", "deadlift"]} />
    </>
  );
}
