import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Le Mans es mucho más que un circuito de automovilismo. Entre patrimonio
        medieval catalogado, gastronomía de Sarthe y naturaleza preservada, la ciudad
        y su región son un destino ideal para un fin de semana o unas vacaciones en
        familia. Estos son los imprescindibles que no debes perderte.
      </p>

      <h2>La Cité Plantagenêt, joya medieval de Le Mans</h2>
      <p>
        Catalogada entre los conjuntos medievales más bellos de Europa, la Cité
        Plantagenêt es el corazón histórico de Le Mans. Sus callejuelas empedradas,
        casas con entramado de madera y murallas galorromanas han servido de escenario
        para numerosas películas (Cyrano de Bergerac, Los Tres Mosqueteros, El
        Jorobado…).
      </p>
      <ul>
        <li>
          <strong>Catedral Saint-Julien</strong>: una de las mayores de Francia, obra
          maestra del gótico. Acceso gratuito.
        </li>
        <li>
          <strong>Murallas romanas</strong>: del siglo III, entre las mejor conservadas
          del mundo romano.
        </li>
        <li>
          <strong>Nuit des Chimères</strong> (julio-agosto): espectacular iluminación
          de la ciudad, gratuita y mágica.
        </li>
      </ul>

      <h2>El museo de las 24 Horas de Le Mans</h2>
      <p>
        Junto al Circuito Bugatti, el museo recorre un siglo de historia de la carrera
        con más de 140 vehículos míticos: Bentley, Ford GT40, Porsche 917, Peugeot 905,
        Audi R18… Imprescindible para los apasionados, interesante incluso para los
        profanos.
      </p>

      <h2>La Abadía de l'Épau</h2>
      <p>
        Monumento cisterciense del siglo XIII a pocos kilómetros del centro, la Abadía
        de l'Épau acoge cada año en primavera el prestigioso <strong>Festival de
        l'Épau</strong>, dedicado a la música clásica. El parque es magnífico, ideal
        para un paseo en familia.
      </p>

      <h2>Visitar Sarthe en familia</h2>
      <h3>Zoo de la Flèche</h3>
      <p>
        A 40 minutos de Le Mans, uno de los zoos más bonitos de Francia. Osos polares,
        tigres, jirafas, pandas rojos, más de 1.500 animales en un entorno natural
        excepcional. Reserva el día completo.
      </p>

      <h3>El Pueblo Favorito de los Franceses: Asnières-sur-Vègre</h3>
      <p>
        A 30 minutos, un pueblo medieval catalogado, con su puente románico, sus
        casonas y sus frescos murales del siglo XIII. Paseo de evasión garantizado.
      </p>

      <h3>Le Lude y Poncé-sur-le-Loir</h3>
      <p>
        El valle del Loir ofrece castillos notables y pueblos pintorescos. Perfecto
        para una jornada en bici o en coche.
      </p>

      <h2>La gastronomía de Sarthe</h2>
      <ul>
        <li>
          <strong>Rillettes du Mans</strong>: embutido emblemático, para degustar sobre
          pan de campo con una copa de Jasnières.
        </li>
        <li>
          <strong>Pollo de Loué</strong>: con sello label rouge, reconocible por sus
          patas amarillas.
        </li>
        <li>
          <strong>Marmite sarthoise</strong>: conejo, pollo, panceta y setas cocidos a
          fuego lento con Jasnières.
        </li>
        <li>
          <strong>Vinos de Sarthe</strong>: Jasnières y Coteaux du Loir, blancos finos
          y minerales a menudo desconocidos.
        </li>
      </ul>

      <h2>¿Dónde alojarse en Le Mans para una estancia familiar?</h2>
      <p>
        Para una estancia en familia, el alquiler de una casa entera ofrece mucha más
        libertad que un hotel: cocina para preparar los productos del mercado, espacio
        para los niños, intimidad para cada uno.
      </p>
      <p>
        Nuestro coliving de <strong>9 suites con baño privado</strong> es ideal para
        familias numerosas, reuniones familiares o estancias multigeneracionales. Sala
        de deporte, espacio zen y jardín para entretener a pequeños y mayores.
      </p>

      <h2>Eventos imperdibles en Le Mans</h2>
      <ul>
        <li><strong>24 Horas Moto</strong> — abril</li>
        <li><strong>Gran Premio de Francia MotoGP</strong> — mayo</li>
        <li><strong>Festival de l'Épau</strong> — mayo-junio</li>
        <li><strong>24 Horas de Le Mans</strong> — junio</li>
        <li><strong>Nuit des Chimères</strong> — julio y agosto</li>
        <li><strong>Le Mans Classic</strong> — julio (años pares)</li>
        <li><strong>24 Horas Camiones</strong> — octubre</li>
        <li><strong>Maratón de Le Mans</strong> — octubre</li>
      </ul>

      <h2>Preparar tu estancia</h2>
      <p>
        Tanto si vienes por las carreras, como por el patrimonio o la gastronomía,
        nuestra casa te recibe a 10 minutos de la estación TGV Le Mans y en el corazón
        de todas las atracciones. Consulta{" "}
        <Link href="/es#disponibilite">nuestras disponibilidades</Link> o descubre{" "}
        <Link href="/es/chambres">las 9 habitaciones</Link>.
      </p>
    </>
  );
}
