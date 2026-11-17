import type { ExerciseCatalog } from "./types";

export const EXERCISES_IT: ExerciseCatalog = {
  "back-squat": {
    name: "Back squat (squat con bilanciere sulla schiena)",
    cues: [
      "Bilanciere appoggiato sulla parte alta della schiena, non sulla nuca; mani strette, gomiti sotto il bilanciere.",
      "Piedi alla larghezza delle spalle, punte leggermente aperte; ginocchia in linea con i piedi.",
      "Inspirare e contrarre il core prima di scendere, petto alto, sguardo dritto davanti a sé.",
      "Scendere almeno fino alla coscia parallela al pavimento se la mobilità lo consente, e risalire spingendo il pavimento.",
      "Regolare le sicure del rack appena sotto la posizione più bassa.",
    ],
    mistakes: [
      "Ginocchia che cedono verso l'interno in risalita.",
      "Talloni che si sollevano o peso sulle punte dei piedi.",
      "Schiena che si arrotonda in basso, per mancanza di stabilità del core o di mobilità.",
      "Aumentare il carico troppo in fretta a scapito della profondità.",
    ],
  },
  "front-squat": {
    name: "Front squat (squat frontale)",
    cues: [
      "Bilanciere appoggiato sulla parte anteriore delle spalle, gomiti alti, dita sotto il bilanciere senza stringerlo.",
      "Busto il più dritto possibile per tutta la discesa.",
      "Ginocchia che avanzano liberamente, in linea con i piedi.",
    ],
    mistakes: [
      "Gomiti che cadono: il bilanciere rotola in avanti.",
      "Caricare quanto nel back squat.",
      "Tenere il bilanciere con le mani invece che sulle spalle.",
    ],
  },
  "goblet-squat": {
    name: "Goblet squat",
    cues: [
      "Un bumper da 5 o 10 kg tenuto con due mani contro il petto, oppure un manubrio tenuto in verticale, gomiti sotto il carico.",
      "Il bumper è pronto subito, senza dover montare un manubrio: comodo quando più persone si allenano nello stesso momento.",
      "Scendere tra le ginocchia, busto dritto, talloni a terra.",
      "Ideale per imparare lo squat o per riscaldarsi.",
    ],
    mistakes: [
      "Carico che si allontana dal petto e tira il busto in avanti.",
      "Discesa troppo corta.",
    ],
  },
  "bench-press": {
    name: "Panca piana",
    cues: [
      "Nel rack, con le sicure regolate appena sopra il petto, oppure con un compagno che assiste.",
      "Scapole addotte e depresse, piedi ben piantati a terra, glutei sulla panca.",
      "Scendere con il bilanciere sotto controllo verso la parte bassa dei pettorali, avambracci verticali.",
      "Spingere il bilanciere verso l'alto e leggermente all'indietro.",
    ],
    mistakes: [
      "Far rimbalzare il bilanciere sul petto.",
      "Gomiti completamente aperti a 90° dal corpo (spalle esposte).",
      "Glutei che si staccano dalla panca.",
      "Caricare pesante da soli senza sicure né assistenza.",
    ],
  },
  "incline-bench-press": {
    name: "Panca inclinata",
    cues: [
      "Panca inclinata moderatamente (circa 30°).",
      "Stesse regole della panca piana: scapole addotte, piedi piantati.",
      "Bilanciere che scende verso la parte alta del petto.",
    ],
    mistakes: [
      "Panca troppo verticale: l'esercizio diventa uno shoulder press.",
      "Carico troppo pesante per mantenere il controllo.",
    ],
  },
  "overhead-press": {
    name: "Military press in piedi",
    cues: [
      "Bilanciere che parte dalle clavicole, mani poco più larghe delle spalle.",
      "Glutei e addominali contratti: il corpo forma un blocco unico.",
      "Arretrare la testa per far passare il bilanciere, poi portare la testa sotto il bilanciere in alto.",
    ],
    mistakes: [
      "Inarcare la zona lombare per spingere.",
      "Spingere il bilanciere davanti a sé invece di portarlo in verticale.",
      "Aiutarsi con le gambe senza volerlo.",
    ],
  },
  deadlift: {
    name: "Stacco da terra",
    cues: [
      "Bilanciere sopra il centro del piede, tibie quasi a contatto con il bilanciere.",
      "Schiena piatta e contratta, spalle leggermente davanti al bilanciere, braccia tese.",
      "Spingere il pavimento con le gambe, il bilanciere sfiora le gambe in salita.",
      "Finire in piedi, anche estese, senza inclinarsi all'indietro.",
      "Con i bumper si può riappoggiare il bilanciere con decisione sulle piastrelle.",
    ],
    mistakes: [
      "Schiena che si arrotonda, soprattutto a fine serie.",
      "Bilanciere che si allontana dalle gambe.",
      "Anche che salgono prima delle spalle.",
      "Iperestensione della schiena in cima al movimento.",
    ],
  },
  "romanian-deadlift": {
    name: "Stacco rumeno (a gambe semitese)",
    cues: [
      "Partire in piedi, ginocchia leggermente flesse e fisse.",
      "Spingere i glutei all'indietro, il bilanciere scivola lungo le cosce.",
      "Scendere finché la schiena resta piatta, sentendo l'allungamento dei femorali.",
    ],
    mistakes: [
      "Arrotondare la schiena per scendere di più.",
      "Piegare le ginocchia come in uno squat.",
      "Bilanciere che si allontana dalle gambe.",
    ],
  },
  "power-clean": {
    name: "Power clean (girata di potenza)",
    cues: [
      "Posizione di partenza dello stacco da terra, schiena piatta.",
      "Portare su il bilanciere vicino al corpo, poi estensione esplosiva delle anche.",
      "Passare rapidamente i gomiti sotto il bilanciere e riceverlo sulle spalle, gambe leggermente flesse.",
      "Imparare prima con il bilanciere scarico o con carichi leggeri.",
    ],
    mistakes: [
      "Tirare con le braccia invece che con gambe e anche.",
      "Bilanciere che si allontana davanti al corpo.",
      "Ricevere il bilanciere con i gomiti bassi, sui polsi.",
    ],
  },
  thruster: {
    name: "Thruster",
    cues: [
      "Front squat concatenato con una spinta sopra la testa, in un unico movimento.",
      "La spinta delle gambe lancia il bilanciere verso l'alto.",
      "Gomiti alti in fondo allo squat, braccia tese a fine movimento.",
    ],
    mistakes: [
      "Spingere solo con le braccia, senza usare le gambe.",
      "Squat troppo corto quando subentra la fatica.",
      "Inarcare la schiena in alto.",
    ],
  },
  "pull-up": {
    name: "Trazione alla sbarra",
    cues: [
      "Partire a braccia tese, spalle attive (non abbandonate verso le orecchie).",
      "Tirare i gomiti verso le anche fino a portare il mento sopra la sbarra.",
      "Scendere sotto controllo.",
      "Un elastico passato sotto i piedi o le ginocchia aiuta a fare ripetizioni complete.",
    ],
    mistakes: [
      "Mezze ripetizioni senza distendere le braccia in basso.",
      "Dondolarsi per salire (salvo kipping voluto e controllato).",
      "Allungare il collo verso la sbarra invece di sollevare il corpo.",
    ],
  },
  dips: {
    name: "Dip",
    cues: [
      "Braccia tese, spalle basse, busto leggermente inclinato in avanti.",
      "Scendere fino a gomiti a circa 90°, senza forzare oltre.",
      "Spingere fino a braccia tese.",
    ],
    mistakes: [
      "Scendere troppo in basso, con le spalle che ruotano in avanti.",
      "Lasciarsi cadere invece di controllare la discesa.",
    ],
  },
  "push-up": {
    name: "Piegamento sulle braccia",
    cues: [
      "Mani poco più larghe delle spalle, corpo allineato dalla testa ai talloni.",
      "Gomiti a circa 45° dal corpo.",
      "Petto fino a terra, poi spingere fino a braccia tese.",
      "Più facile: mani sul box; più difficile: piedi sul box.",
    ],
    mistakes: [
      "Anche che cedono o che salgono.",
      "Ampiezza ridotta.",
    ],
  },
  "seated-cable-row": {
    name: "Pulley basso (rematore al cavo basso)",
    cues: [
      "Seduti o in piedi di fronte al cavo basso, maniglia a presa neutra, schiena dritta.",
      "Tirare la maniglia verso l'ombelico stringendo le scapole.",
      "Tornare lentamente, braccia tese, senza arrotondare la schiena.",
    ],
    mistakes: [
      "Tirare sbilanciando il busto all'indietro.",
      "Alzare le spalle.",
    ],
  },
  "single-arm-cable-row": {
    name: "Rematore a un braccio al cavo basso",
    cues: [
      "Maniglia singola sul cavo basso, un piede avanti, la mano libera appoggiata sulla coscia.",
      "Tirare il gomito verso l'anca stringendo la scapola, senza ruotare il busto.",
      "Tornare lentamente fino a braccio teso, con la spalla che si allunga in avanti.",
      "Iniziare dal braccio più debole, e fare lo stesso numero di ripetizioni per lato.",
    ],
    mistakes: [
      "Ruotare il busto per tirare più pesante.",
      "Alzare la spalla verso l'orecchio.",
    ],
  },
  "lat-pulldown": {
    name: "Lat machine (trazione al cavo alto)",
    cues: [
      "Barra larga, mani poco più larghe delle spalle.",
      "Tirare la barra verso la parte alta del petto, gomiti verso il basso.",
      "Busto leggermente inclinato all'indietro, senza dondolare.",
    ],
    mistakes: [
      "Tirare la barra dietro la nuca.",
      "Buttarsi all'indietro per tirare più pesante.",
      "Lasciar risalire la barra senza controllo.",
    ],
  },
  "triceps-pushdown": {
    name: "Push down per tricipiti al cavo (corda)",
    cues: [
      "Corda per tricipiti o barra dritta corta sul cavo alto, gomiti aderenti al corpo.",
      "Spingere verso il basso fino a braccia tese, aprendo la corda a fine movimento.",
      "Si muovono solo gli avambracci.",
    ],
    mistakes: [
      "Gomiti che vanno avanti e indietro.",
      "Sporgersi sulla corda per spingere con il peso del corpo.",
    ],
  },
  "cable-curl": {
    name: "Curl bicipiti al cavo basso",
    cues: [
      "In piedi di fronte al cavo basso, barra dritta corta o corda, gomiti aderenti al corpo.",
      "Portare le mani verso le spalle senza avanzare i gomiti, scendere lentamente fino a braccia tese.",
      "Il cavo mantiene la tensione per tutto il movimento, e il carico si regola al chilo con i dischi in ghisa.",
      "Con la corda, pollici verso l'alto (hammer curl): lavora anche l'avambraccio.",
    ],
    mistakes: [
      "Dondolare il busto all'indietro per sollevare il carico.",
      "Gomiti che avanzano: subentrano le spalle.",
      "Stare troppo vicini alla carrucola: fare un passo indietro per tenere il cavo teso in basso.",
    ],
  },
  "face-pull": {
    name: "Face pull (tirata al viso)",
    cues: [
      "Corda sul cavo alto, all'altezza del viso.",
      "Tirare la corda verso la fronte allargando le mani, gomiti alti.",
      "Finire con i pollici rivolti all'indietro, scapole strette. Carico leggero.",
    ],
    mistakes: [
      "Carico troppo pesante: il busto va all'indietro.",
      "Gomiti che cadono: l'esercizio diventa un rematore classico.",
    ],
  },
  "band-external-rotation": {
    name: "Extrarotazione con elastico",
    cues: [
      "Elastico agganciato al rack all'altezza del gomito, gomito aderente al corpo, piegato a 90°.",
      "Ruotare l'avambraccio verso l'esterno senza staccare il gomito.",
      "Movimento lento, elastico leggero, da 15 a 20 ripetizioni.",
    ],
    mistakes: [
      "Elastico troppo duro.",
      "Gomito che si stacca dal corpo.",
    ],
  },
  "walking-lunge": {
    name: "Affondi in camminata",
    cues: [
      "Ampio passo in avanti, scendere finché il ginocchio posteriore sfiora il pavimento.",
      "Ginocchio anteriore in linea con il piede, busto dritto.",
      "Spingere sul tallone anteriore per concatenare il passo successivo.",
    ],
    mistakes: [
      "Passo troppo corto: il ginocchio anteriore supera di molto la punta del piede.",
      "Ginocchio anteriore che cede verso l'interno.",
      "Sbattere il ginocchio posteriore a terra.",
    ],
  },
  "lateral-lunge": {
    name: "Affondo laterale",
    cues: [
      "Ampio passo di lato, sedersi sulla gamba che si piega, l'altra resta tesa.",
      "Piedi paralleli, ginocchio flesso in linea con il piede.",
      "Spingere per tornare al centro.",
    ],
    mistakes: [
      "Tallone che si stacca dal lato flesso.",
      "Schiena che si arrotonda.",
    ],
  },
  "step-up": {
    name: "Step-up sul box",
    cues: [
      "Piede intero appoggiato sul box, salire spingendo solo con quella gamba.",
      "Altezza del box che lascia il ginocchio poco sopra l'anca, non di più.",
      "Scendere sotto controllo.",
    ],
    mistakes: [
      "Darsi lo slancio con la gamba rimasta a terra.",
      "Box troppo alto.",
    ],
  },
  "hip-thrust": {
    name: "Hip thrust",
    cues: [
      "Parte alta della schiena appoggiata alla panca, bilanciere sulla piega dell'anca, protetto dal cuscinetto.",
      "Sollevare le anche fino ad allineare spalle, anche e ginocchia, stringendo i glutei.",
      "Mento in dentro, costole basse.",
    ],
    mistakes: [
      "Inarcare la zona lombare in alto invece di stringere i glutei.",
      "Piedi troppo lontani o troppo vicini.",
    ],
  },
  "calf-raise": {
    name: "Calf raise in piedi (polpacci)",
    cues: [
      "Salire il più in alto possibile sulle punte, tenere un secondo.",
      "Scendere lentamente, con i talloni sotto il livello delle punte se si è su un disco.",
    ],
    mistakes: [
      "Rimbalzare senza ampiezza.",
      "Piegare le ginocchia per aiutarsi.",
    ],
  },
  "medicine-ball-thruster": {
    name: "Thruster con palla medica",
    cues: [
      "Palla medica da 6 kg tenuta con due mani contro il petto, gomiti sotto la palla.",
      "Squat completo, poi risalire spingendo la palla sopra la testa, braccia tese, in un unico movimento.",
      "È la spinta delle gambe a far salire la palla; riportarla al petto scendendo.",
      "La palla non si lascia mai: in palestra non si lancia né al soffitto né contro le pareti.",
    ],
    mistakes: [
      "Spingere solo con le braccia, senza lo slancio delle gambe.",
      "Squat troppo corto quando subentra la fatica.",
      "Inarcare la schiena, con la palla dietro la testa, a fine movimento.",
    ],
  },
  "box-jump": {
    name: "Box jump",
    cues: [
      "Iniziare basso (da 20 a 30 cm) e aumentare l'altezza progressivamente.",
      "Saltare a piedi uniti, atterrare con tutto il piede, ginocchia in linea, in modo morbido.",
      "Distendersi completamente sul box, poi scendere camminando.",
    ],
    mistakes: [
      "Box troppo alto: atterraggio in squat profondo, rischio di caduta.",
      "Scendere saltando all'indietro quando subentra la fatica (tendini d'Achille).",
      "Ginocchia che cedono verso l'interno all'atterraggio.",
    ],
  },
  "jump-rope": {
    name: "Salto con la corda",
    cues: [
      "Saltelli brevi sull'avampiede, ginocchia morbide.",
      "La corda gira con i polsi, gomiti vicini al corpo.",
      "Iniziare con serie brevi.",
    ],
    mistakes: [
      "Saltare troppo in alto.",
      "Far girare la corda con le braccia.",
    ],
  },
  rowing: {
    name: "Vogatore (Concept2)",
    cues: [
      "Sequenza della spinta: gambe, poi busto, poi braccia; al ritorno: braccia, busto, gambe.",
      "La forza viene soprattutto dalle gambe.",
      "Schiena dritta, spalle basse, maniglia tirata verso le costole basse.",
      "Regolazione della resistenza (damper) tra 3 e 5 per la maggior parte delle sedute.",
    ],
    mistakes: [
      "Tirare con le braccia prima di aver spinto con le gambe.",
      "Damper al massimo pensando di lavorare di più.",
      "Schiena arrotondata, spalle alzate.",
    ],
  },
  plank: {
    name: "Plank (tenuta frontale)",
    cues: [
      "In appoggio sugli avambracci, gomiti sotto le spalle.",
      "Corpo allineato, glutei e addominali contratti.",
      "Respirare normalmente.",
    ],
    mistakes: [
      "Anche che cedono o che salgono.",
      "Trattenere il respiro.",
    ],
  },
  "side-plank": {
    name: "Plank laterale",
    cues: [
      "Gomito sotto la spalla, corpo allineato di profilo.",
      "Anche alte, senza ruotare il busto.",
    ],
    mistakes: [
      "Anca che cade.",
      "Spalla che cede nell'appoggio.",
    ],
  },
  "copenhagen-plank": {
    name: "Copenhagen plank (adduttori)",
    cues: [
      "Plank laterale, gamba superiore appoggiata sulla panca: il ginocchio sulla panca per iniziare, il piede per progredire.",
      "La gamba inferiore resta libera o sollevata.",
      "Corpo allineato, tempi brevi all'inizio (da 10 a 20 secondi).",
    ],
    mistakes: [
      "Iniziare in appoggio sul piede: troppo duro per l'adduttore all'inizio.",
      "Anca che cade.",
    ],
  },
  "dead-bug": {
    name: "Dead bug",
    cues: [
      "Supini, braccia tese verso il soffitto, ginocchia a 90°.",
      "Zona lombare schiacciata a terra per tutto l'esercizio.",
      "Distendere lentamente un braccio e la gamba opposta, tornare, cambiare lato.",
    ],
    mistakes: [
      "Zona lombare che si stacca da terra.",
      "Andare troppo veloci.",
    ],
  },
  "pallof-press": {
    name: "Pallof press (tenuta anti-rotazione)",
    cues: [
      "Di profilo rispetto al cavo regolato all'altezza del petto, maniglia singola tenuta con due mani.",
      "Distendere le braccia davanti a sé e tenere due secondi senza lasciar ruotare il busto.",
      "Piedi alla larghezza delle spalle, ginocchia leggermente flesse.",
    ],
    mistakes: [
      "Carico troppo pesante: il busto ruota verso il cavo.",
      "Inclinarsi per resistere.",
    ],
  },
  "farmer-walk": {
    name: "Farmer walk (camminata del contadino)",
    cues: [
      "Un manubrio carico in ogni mano, sollevato da terra a schiena piatta.",
      "Camminare dritti, spalle basse, passi piccoli e regolari.",
    ],
    mistakes: [
      "Inclinarsi da un lato.",
      "Lasciar cadere a terra i manubri caricati in ghisa: riappoggiarli.",
    ],
  },
  "neck-isometrics": {
    name: "Isometria del collo",
    cues: [
      "Seduti o in piedi, la mano appoggiata contro la fronte, la nuca o il lato della testa.",
      "Spingere la testa contro la mano senza muoversi, a circa metà forza, da 10 a 15 secondi.",
      "Progredire lentamente, senza mai forzare bruscamente.",
    ],
    mistakes: [
      "Spingere al massimo fin dall'inizio.",
      "Fare movimenti rapidi o rotazioni con carico.",
    ],
  },
};
