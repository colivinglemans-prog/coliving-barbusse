import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        El GP Explorer se ha acabado. La tercera edición, titulada
        <strong> GP Explorer: The Last Race</strong> y celebrada del 3 al 5 de octubre de 2025
        en el Circuito Bugatti, hacía honor a su nombre: fue la última. Repasamos las tres
        ediciones que marcaron Le Mans — y lo que sigue dando vida al circuito.
      </p>

      <h2>¿Habrá una próxima edición?</h2>
      <p>
        No. Squeezie concibió la edición de 2025 como un punto final asumido, empezando por su
        título: <em>The Last Race</em>. Desde entonces no se ha anunciado ninguna edición
        nueva, así que no hay ninguna venta de entradas que vigilar. Si busca «GP Explorer
        2026» o «próxima edición del GP Explorer», la respuesta es sencilla: no habrá otra.
      </p>

      <h2>Las tres ediciones en breve</h2>
      <ul>
        <li>
          <strong>2022 — la primera</strong>: lanzada por Squeezie con creadores de contenido
          al volante de Fórmula 4 en el Circuito Bugatti, batió el récord de audiencia
          francófona en Twitch con más de un millón de espectadores simultáneos.
        </li>
        <li>
          <strong>2023 — la confirmación</strong>: otro éxito masivo, con un pico de más de
          1,3 millones de espectadores en directo y las gradas llenas en Le Mans.
        </li>
        <li>
          <strong>2025 — The Last Race</strong>: del 3 al 5 de octubre de 2025, un formato
          ampliado a tres días con carreras, sorpresas en pista y conciertos. En 2024 no hubo
          edición.
        </li>
      </ul>

      <h2>Lo que deja el GP Explorer</h2>
      <p>
        En tres ediciones, el evento dio a conocer el Circuito Bugatti a una generación que no
        seguía necesariamente el automovilismo, y demostró que un fin de semana en Le Mans se
        prepara como un festival: llegar en tren, dormir en la ciudad, ir al circuito en
        tranvía y prescindir del coche por completo. La receta es exactamente la misma para
        las demás grandes citas del circuito, esas sí muy vivas.
      </p>

      <h2>Lo que continúa en el Circuito Bugatti</h2>
      <p>
        A Le Mans no le faltan eventos — y varios reúnen a mucha más gente de la que reunió
        nunca el GP Explorer:
      </p>
      <ul>
        <li>
          <Link href="/es/blog/24-heures-moto-le-mans-2027">Las 24 Horas Moto</Link>, en abril:
          100.000 espectadores y un ambiente motero único.
        </li>
        <li>
          <Link href="/es/blog/motogp-france-le-mans-2027">El MotoGP de Francia</Link>, en
          primavera: el Gran Premio con más asistencia del campeonato.
        </li>
        <li>
          <Link href="/es/blog/ou-se-loger-24h-du-mans-2027">Las 24 Horas de Le Mans</Link>, en
          junio: la carrera de resistencia más famosa del mundo.
        </li>
        <li>
          <Link href="/es/blog/le-mans-classic-2027">Le Mans Classic</Link>, en verano: la cita
          de los coches clásicos.
        </li>
        <li>
          <Link href="/es/blog/24-heures-camions-le-mans">Las 24 Horas de Camiones</Link>, en
          septiembre: el formato más familiar y más asequible.
        </li>
      </ul>

      <h2>Dónde alojarse para un fin de semana en el circuito</h2>
      <p>
        La costumbre adquirida en los años del GP Explorer sigue siendo la buena: en grupo, una
        casa grande compartida cuesta mucho menos que otras tantas habitaciones de hotel y
        permite alargar la velada juntos. Alojarse en la ciudad en lugar de junto al circuito
        también da acceso a los restaurantes y bares del centro, muy animados las noches de
        evento.
      </p>

      <h2>Nuestra casa: pensada para grupos</h2>
      <p>
        Nuestro coliving de <strong>9 suites con baño privado</strong> acoge hasta 20
        personas:
      </p>
      <ul>
        <li>20 min del Circuito Bugatti fuera del evento (45-60 min los días de carrera)</li>
        <li>10 min a pie de la estación TGV + tranvía T1 directo al circuito (~30 min puerta a puerta, sin atascos ni problemas de aparcamiento)</li>
        <li>Aparcamiento gratuito en una calle residencial tranquila</li>
        <li>215 m² en total (zonas comunes, habitaciones y anexo deporte/zen) para reuniros</li>
        <li>Wi-Fi de alta velocidad para seguir las sesiones en directo</li>
        <li>Cocina equipada para cenar antes de salir</li>
        <li>Cerradura conectada, llegada autónoma a partir de las 17 h</li>
      </ul>

      <h2>Reserve su fin de semana en Le Mans</h2>
      <p>
        El GP Explorer no tendrá continuación, pero el calendario del circuito sigue lleno todo
        el año. Consulte{" "}
        <Link href="/es#disponibilite">nuestra disponibilidad</Link> y reserve en directo.
      </p>
      <p>
        Ver también:{" "}
        <Link href="/es/blog/que-visiter-le-mans-sarthe">
          Qué visitar en Le Mans y la Sarthe
        </Link>
        {" "}o{" "}
        <Link href="/es/blog/restos-bars-magasins-le-mans">
          Las buenas direcciones del barrio
        </Link>
        .
      </p>
    </>
  );
}
