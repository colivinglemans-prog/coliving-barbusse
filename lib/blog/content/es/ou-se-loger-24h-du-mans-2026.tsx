import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Cada año en junio, Le Mans recibe a más de 300.000 espectadores para las 24 Horas
        de Le Mans. Encontrar alojamiento para la edición 2026 exige anticiparse — los
        hoteles cuelgan el cartel de completo con meses de antelación y las grandes casas
        se reservan desde la apertura de ventas. Esta es una guía práctica para elegir
        dónde dormir.
      </p>

      <h2>¿Cuándo se celebran las 24 Horas de Le Mans 2026?</h2>
      <p>
        La 94ª edición de las 24 Horas de Le Mans se celebra el fin de semana del{" "}
        <strong>13 y 14 de junio de 2026</strong>. Los entrenamientos libres y las
        clasificaciones empiezan desde el miércoles, y el gran desfile de pilotos anima
        la ciudad el viernes por la noche. La mayoría de los visitantes llegan a partir
        del jueves y se marchan el domingo por la noche o el lunes por la mañana — hay
        que prever una estancia de 3 a 5 noches.
      </p>

      <h2>Las distintas zonas de alojamiento</h2>
      <h3>Cerca del circuito (Arnage, Mulsanne, Ruaudin)</h3>
      <p>
        Estos pueblos están pegados al trazado. La oferta es muy limitada, los precios
        se disparan y el tráfico está bloqueado permanentemente. Solo interesa si
        quieres estar a un paso del circuito — de lo contrario los atascos te harán
        perder mucho tiempo.
      </p>

      <h3>Le Mans ciudad (20 min del circuito fuera del evento, 45-60 min los días de carrera)</h3>
      <p>
        El mejor compromiso. Disfrutas del centro histórico (Cité Plantagenêt, catedral,
        restaurantes) y llegas al circuito en coche en 20 minutos sin atascos (calcula
        45-60 min los días de carrera). Es la zona ideal para grupos y familias que
        quieren alternar carrera y turismo.
      </p>

      <h3>Pueblos cercanos (20-40 min)</h3>
      <p>
        Más baratos pero más incómodos: prepárate para los atascos del sábado por la
        mañana y del domingo por la noche. Reserva esta opción si todo está completo en
        la ciudad o si sois muchos y buscáis la tarifa más baja.
      </p>

      <h2>¿Qué tipo de alojamiento elegir?</h2>
      <h3>Hotel clásico</h3>
      <p>
        Práctico para 1 o 2 personas pero se llena rápido. Las tarifas se duplican o
        triplican durante el evento. Reserva imprescindible desde enero.
      </p>

      <h3>Airbnb / alquiler de casa</h3>
      <p>
        La mejor opción para un grupo o una familia. Dispones de cocina (los
        restaurantes están llenos), aparcamiento fácil y un espacio real para relajarte
        entre dos sesiones en el circuito.
      </p>

      <h3>Camping en el circuito</h3>
      <p>
        Ambiente increíble pero noches cortas. Reservado a los apasionados que quieren
        vivir el evento las 24 horas del día.
      </p>

      <h2>¿Cuánto cuesta un alojamiento durante las 24 horas?</h2>
      <ul>
        <li>Habitación de hotel básica: 150-300 €/noche (frente a 60-90 € fuera del evento)</li>
        <li>Airbnb para 4 personas: 200-500 €/noche</li>
        <li>Gran casa para grupo (10-20 pers.): 1.500-3.500 €/noche</li>
      </ul>
      <p>
        Truco: cuantos más seáis, menor será el coste por persona. Una gran casa
        compartida entre 15 suele salir más barata que un hotel individual.
      </p>

      <h2>Nuestra casa — 9 suites privadas a 20 minutos del circuito</h2>
      <p>
        Para grupos, familias numerosas o empresas, nuestra casa de 215 m² ofrece{" "}
        <strong>9 habitaciones dobles con baño privado</strong>. Dormís 20 personas en
        calma, cada uno en su espacio, sin compromiso en cuanto a comodidad.
      </p>
      <ul>
        <li>20 min del Circuito Bugatti fuera del evento (45-60 min los días de carrera por los atascos)</li>
        <li>10 min a pie de la estación TGV Le Mans + tranvía T1 directo al circuito (~30 min puerta a puerta, sin estrés de aparcamiento)</li>
        <li>Aparcamiento gratuito en la calle, justo delante de la casa</li>
        <li>Cocina totalmente equipada</li>
        <li>Sala de deporte y espacio zen en la casa</li>
        <li>Cerradura conectada: llegada autónoma a partir de las 17 h</li>
      </ul>

      <h2>Consejos para reservar bien</h2>
      <ol>
        <li>
          <strong>Reserva antes de febrero</strong>: las mejores opciones se van desde
          enero.
        </li>
        <li>
          <strong>Prevé 3-4 noches mínimo</strong>: la mayoría de propietarios no
          aceptan estancias de una sola noche durante el evento.
        </li>
        <li>
          <strong>Comprueba las condiciones de aparcamiento</strong>: una casa situada
          en una calle residencial tranquila, lejos del circuito, sigue siendo la mejor
          opción.
        </li>
        <li>
          <strong>Compara el coste por persona</strong>: una gran casa suele ganar al
          hotel a partir de 6 viajeros.
        </li>
        <li>
          <strong>Anticipa los atascos</strong>: sal 2 h antes del inicio de la carrera
          el sábado o, mejor aún, coge el <strong>tranvía T1</strong> desde la estación
          de Le Mans (~20 min hasta la entrada Este del circuito, tranvías cada 4-5 min
          el día de carrera). Es la solución más fiable.
        </li>
      </ol>

      <h2>¿Listo para reservar?</h2>
      <p>
        Consulta las <Link href="/es#disponibilite">fechas disponibles</Link> para las
        24 Horas de Le Mans 2026 y asegura tu estancia. También puedes descubrir{" "}
        <Link href="/es/chambres">las 9 habitaciones</Link> o ver{" "}
        <Link href="/es#avis">las opiniones de nuestros anteriores viajeros</Link>.
      </p>
    </>
  );
}
