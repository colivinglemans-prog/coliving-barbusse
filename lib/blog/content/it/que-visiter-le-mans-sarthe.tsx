import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Le Mans è molto più di un circuito automobilistico. Tra patrimonio medievale
        riconosciuto, gastronomia della Sarthe e natura preservata, la città e la sua
        regione sono una destinazione ideale per un weekend o una vacanza in famiglia.
        Ecco gli imperdibili da non perdere.
      </p>

      <h2>La Cité Plantagenêt, gioiello medievale di Le Mans</h2>
      <p>
        Classificata tra i più bei complessi medievali d'Europa, la Cité Plantagenêt è il
        cuore storico di Le Mans. Le sue stradine acciottolate, le case a graticcio e i
        bastioni gallo-romani hanno fatto da scenografia a numerosi film (Cyrano de
        Bergerac, I tre moschettieri, Le Bossu…).
      </p>
      <ul>
        <li>
          <strong>Cattedrale Saint-Julien</strong>: una delle più grandi di Francia,
          capolavoro gotico. Ingresso gratuito.
        </li>
        <li>
          <strong>Bastioni romani</strong>: III secolo, tra i meglio conservati del mondo
          romano.
        </li>
        <li>
          <strong>Nuit des Chimères</strong> (luglio-agosto): illuminazione spettacolare
          della città, gratuita e magica.
        </li>
      </ul>

      <h2>Il museo della 24 Ore di Le Mans</h2>
      <p>
        Accanto al Circuit Bugatti, il museo ripercorre un secolo di storia della corsa
        con oltre 140 veicoli mitici: Bentley, Ford GT40, Porsche 917, Peugeot 905, Audi
        R18… Imperdibile per gli appassionati, interessante anche per i neofiti.
      </p>

      <h2>L'Abbazia dell'Épau</h2>
      <p>
        Monumento cistercense del XIII secolo a pochi chilometri dal centro, l'Abbazia
        dell'Épau ospita ogni anno in primavera il prestigioso{" "}
        <strong>Festival de l'Épau</strong> dedicato alla musica classica. Il parco è
        magnifico, ideale per una passeggiata in famiglia.
      </p>

      <h2>Visitare la Sarthe in famiglia</h2>
      <h3>Zoo de la Flèche</h3>
      <p>
        A 40 minuti da Le Mans, uno dei più bei zoo di Francia. Orsi polari, tigri,
        giraffe, panda rossi, oltre 1.500 animali in un contesto naturale eccezionale.
        Prevedi l'intera giornata.
      </p>

      <h3>Il Villaggio Preferito dei Francesi: Asnières-sur-Vègre</h3>
      <p>
        A 30 minuti, un villaggio medievale riconosciuto, con il suo ponte romano, i
        manieri e gli affreschi murali del XIII secolo. Passeggiata da sogno garantita.
      </p>

      <h3>Le Lude e Poncé-sur-le-Loir</h3>
      <p>
        La valle del Loir offre castelli notevoli e villaggi pittoreschi. Perfetto per una
        giornata in bici o in auto.
      </p>

      <h2>La gastronomia della Sarthe</h2>
      <ul>
        <li>
          <strong>Rillettes du Mans</strong>: salume tipico, da gustare su pane casareccio
          con un bicchiere di Jasnières.
        </li>
        <li>
          <strong>Poulet de Loué</strong>: label rouge, riconoscibile dalle zampe gialle.
        </li>
        <li>
          <strong>Marmite sarthoise</strong>: coniglio, pollo, lardo e funghi cotti lenti
          al Jasnières.
        </li>
        <li>
          <strong>Vini della Sarthe</strong>: Jasnières e Coteaux du Loir, bianchi
          eleganti e minerali spesso poco conosciuti.
        </li>
      </ul>

      <h2>Dove alloggiare a Le Mans per un soggiorno in famiglia?</h2>
      <p>
        Per un soggiorno in famiglia, l'affitto di una casa intera offre molta più libertà
        di un hotel: cucina per preparare i prodotti del mercato, spazio per i bambini,
        intimità per ciascuno.
      </p>
      <p>
        Il nostro coliving di <strong>9 suite con bagno privato</strong> è ideale per
        famiglie allargate, riunioni di famiglia o soggiorni multi-generazionali. Sala
        fitness, spazio zen e giardino per intrattenere grandi e piccini.
      </p>

      <h2>Eventi imperdibili a Le Mans</h2>
      <ul>
        <li><strong>24 Ore Moto</strong> — aprile</li>
        <li><strong>Gran Premio di Francia MotoGP</strong> — maggio</li>
        <li><strong>Festival de l'Épau</strong> — maggio-giugno</li>
        <li><strong>24 Ore di Le Mans</strong> — giugno</li>
        <li><strong>Nuit des Chimères</strong> — luglio e agosto</li>
        <li><strong>Le Mans Classic</strong> — luglio (anni pari)</li>
        <li><strong>24 Ore Camion</strong> — ottobre</li>
        <li><strong>Maratona di Le Mans</strong> — ottobre</li>
      </ul>

      <h2>Preparare il tuo soggiorno</h2>
      <p>
        Che tu venga per le gare, il patrimonio o la gastronomia, la nostra casa ti
        accoglie a 10 minuti dalla stazione TGV Le Mans e nel cuore di tutte le
        attrazioni. Consulta <Link href="/it#disponibilite">le nostre disponibilità</Link>{" "}
        o scopri <Link href="/it/chambres">le 9 camere</Link>.
      </p>
    </>
  );
}
