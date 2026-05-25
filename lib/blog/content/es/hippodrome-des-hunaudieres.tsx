import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        El Hippodrome des Hunaudières es el único hipódromo de la Sarthe y uno
        de los más prestigiosos del oeste de Francia. A lo largo del año
        acoge carreras de trote y de galope, veladas festivas y animaciones
        familiares. Esto es lo que hay que saber para preparar su visita.
      </p>

      <h2>¿Dónde se encuentra el Hippodrome des Hunaudières?</h2>
      <p>
        Situado en la route de Tours al sur de Le Mans, el Hippodrome des
        Hunaudières está gestionado por la Société des Courses du Mans.
        Dispone de una pista de trote en arena de 1.350 m, única en la
        región. El hipódromo se encuentra a unos veinte minutos en coche de
        nuestra casa y es fácilmente accesible desde la estación de Le Mans.
      </p>

      <h2>Calendario 2026: 13 reuniones al año</h2>
      <p>
        La temporada hípica 2026 se inauguró el <strong>4 de marzo de 2026</strong>{" "}
        con una reunión dedicada al plano. Trece reuniones están programadas
        a lo largo del año, mezclando trote, galope y carreras PMU. El
        calendario está diseñado para equilibrar las disciplinas y poner en
        valor las grandes citas que dan fama a Le Mans en el mundo hípico.
      </p>
      <p>
        Para el programa detallado de las próximas carreras, consulte el
        sitio oficial de la{" "}
        <a href="https://www.letrot.com/hippodromes/le-mans/7207" target="_blank" rel="noopener noreferrer">Société des Courses du Mans</a>{" "}
        o llame al 02 43 84 94 94.
      </p>

      <h2>Las grandes reuniones que no debe perderse</h2>
      <ul>
        <li>
          <strong>Reuniones PMU</strong>: carreras regulares a lo largo del
          año, perfectas para descubrir el universo hípico en un ambiente
          agradable.
        </li>
        <li>
          <strong>Veladas nocturnas</strong>: carreras nocturnas con
          restauración in situ, animaciones y ambiente familiar.
        </li>
        <li>
          <strong>Grand Prix de la Ville du Mans</strong> (trote): una de las
          pruebas estrella de la temporada.
        </li>
        <li>
          <strong>Journée du cheval</strong>: animaciones para niños,
          bautismos de poni, espectáculos ecuestres.
        </li>
      </ul>

      <h2>¿Por qué asistir a una reunión hípica?</h2>
      <ul>
        <li>
          <strong>Entrada a precio asequible</strong> (a menudo gratuita o
          unos pocos euros) al contrario de lo que se cree habitualmente.
        </li>
        <li>
          <strong>Ambiente festivo</strong>: bar, restauración, animaciones
          entre carreras.
        </li>
        <li>
          <strong>Descubrimiento del PMU</strong>: los aficionados a las
          apuestas comparten gustosamente consejos y análisis con los recién
          llegados.
        </li>
        <li>
          <strong>Entorno natural</strong>: el hipódromo se inscribe en un
          entorno verde típico de la Sarthe.
        </li>
      </ul>

      <h2>Cómo llegar desde nuestra casa</h2>
      <ul>
        <li>
          <strong>En coche</strong>: ~20 minutos, route de Tours al sur de Le
          Mans.
        </li>
        <li>
          <strong>Tranvía + caminata</strong>: posible vía el T1 hasta la
          parada Antarès, luego unos minutos a pie.
        </li>
        <li>
          <strong>Taxi / VTC</strong>: muy práctico por la noche al salir de
          una reunión nocturna.
        </li>
      </ul>

      <h2>Su estancia en Le Mans en torno al hipódromo</h2>
      <p>
        Nuestro coliving de <strong>9 suites privadas con baño</strong> es
        ideal para un fin de semana en familia o entre amigos en torno a las
        carreras hípicas. Hasta 18 personas en un entorno tranquilo, a 20
        minutos del hipódromo y 10 minutos de la estación TGV.
      </p>
      <ul>
        <li>Aparcamiento gratuito en la calle residencial tranquila</li>
        <li>215 m² en total (espacios comunes, habitaciones y anexo deporte/zen) para reunirse después de las carreras</li>
        <li>Cocina equipada para una cena agradable</li>
        <li>Sala de deporte y espacio zen</li>
        <li>Wi-Fi de alta velocidad</li>
        <li>Cerradura conectada, llegada autónoma a partir de las 17 h</li>
      </ul>

      <h2>¿Y combinarlo con otras actividades?</h2>
      <p>
        Un día en el hipódromo combina muy bien con:
      </p>
      <ul>
        <li>Una visita a la <Link href="/es/blog/que-visiter-le-mans-sarthe">Cité Plantagenêt</Link> y el centro histórico</li>
        <li>Un paseo por el <Link href="/es#localisation">parque del Gué de Maulny</Link></li>
        <li>Una cena en un buen <Link href="/es/blog/restos-bars-magasins-le-mans">restaurante del barrio</Link></li>
        <li>Una visita al Museo de las 24h de Le Mans (justo al lado del circuito)</li>
      </ul>

      <h2>Reservar su estancia</h2>
      <p>
        Consulte <Link href="/es#disponibilite">nuestra disponibilidad</Link>{" "}
        para preparar su visita al Hippodrome des Hunaudières. Nuestra casa
        es ideal para un grupo que desea combinar carreras hípicas, turismo
        y gastronomía sarthoise.
      </p>
    </>
  );
}
