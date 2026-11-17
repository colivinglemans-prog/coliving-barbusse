import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Un corredor que hace musculación corre más tiempo sin lesionarse: unos gemelos, unas
        caderas y un tronco más fuertes absorben mejor los miles de apoyos de una carrera. Para
        un club que viene de concentración, una carrera en ruta o un trail en la región, así
        puede combinar{" "}
        <Link href="/es/blog/salle-de-sport-privee-le-mans">el gimnasio de la casa</Link>{" "}
        con las salidas al parque cercano.
      </p>

      <h2>Correr a dos pasos de la casa</h2>
      <p>
        El <strong>parque del Gué de Maulny</strong> (10 ha) está a 5 minutos a pie: suficiente
        para un rodaje, unas series o técnica de carrera sin coger el coche. El resto de la
        sesión se hace en el gimnasio.
      </p>

      <h2>Lo que la musculación aporta al corredor</h2>
      <ul>
        <li>
          <strong>Gemelos y tendones de Aquiles más resistentes</strong>.
        </li>
        <li>
          <strong>Caderas estables</strong>: menos rodilla que se va hacia dentro en cada
          apoyo.
        </li>
        <li>
          <strong>Mejor economía de carrera</strong>: la fuerza hace que cada zancada cueste
          menos.
        </li>
        <li>
          <strong>Un tronco que aguanta</strong> al final de la carrera, cuando la postura se
          deteriora.
        </li>
      </ul>

      <h2>La sesión de fortalecimiento del corredor (45 minutos)</h2>
      <ul>
        <li>
          <strong>Back squat o goblet squat</strong>: 3 × 6 a 8.
        </li>
        <li>
          <strong>Peso muerto rumano</strong>: 3 × 8.
        </li>
        <li>
          <strong>Step-up al cajón</strong> (40 cm): 3 × 8 por pierna.
        </li>
        <li>
          <strong>Zancadas caminando</strong>: 2 × 10 por pierna.
        </li>
        <li>
          <strong>Elevación de gemelos de pie</strong>, barra en la espalda: 3 × 15, y después
          a una pierna 2 × 12.
        </li>
        <li>
          <strong>Core</strong>: plancha lateral 2 × 30 s por lado, dead bug 2 × 10.
        </li>
        <li>
          <strong>Caderas</strong>: desplazamiento lateral con banda elástica alrededor de las
          rodillas, 2 × 15 pasos por lado.
        </li>
      </ul>

      <h2>La sesión cruzada, sin impacto</h2>
      <p>
        Para un día de recuperación o un corredor que vuelve de una lesión: de 30 a 40 minutos
        de elíptica o de remo Concept2. El corazón trabaja como en carrera y las
        articulaciones descansan. Variante: 5 × 4 minutos exigentes en la elíptica, con 2
        minutos suaves entre cada uno.
      </p>

      <h2>Un fin de semana de concentración tipo</h2>
      <ul>
        <li>
          <strong>Sábado por la mañana</strong>: series en el parque (por ejemplo 8 × 400 m) y
          después core en el gimnasio.
        </li>
        <li>
          <strong>Sábado por la tarde</strong>: la sesión de fortalecimiento de arriba y comida
          de equipo.
        </li>
        <li>
          <strong>Domingo por la mañana</strong>: tirada larga a ritmo suave y después{" "}
          <Link href="/es/blog/recuperation-apres-effort-le-mans">rutina de recuperación</Link>
          .
        </li>
      </ul>

      <h2>Antes de una carrera</h2>
      <p>
        En los tres días previos, nada de musculación pesada. La víspera: 20 minutos de rodaje
        muy suave con algunas aceleraciones. Por la mañana: 10 minutos de elíptica, algo de
        técnica de carrera y movilidad de tobillos y caderas.
      </p>

      <h2>Información práctica</h2>
      <ul>
        <li>
          9 habitaciones con baño con ducha, hasta 20 personas: todo el club bajo el mismo
          techo.
        </li>
        <li>Lavadora y secadora para la ropa del día anterior.</li>
        <li>Cocina equipada para el plato de pasta de la víspera de la carrera.</li>
        <li>
          Sin supervisión: cada uno entrena bajo su responsabilidad, los menores con un
          adulto.
        </li>
      </ul>
      <p>
        Vea también{" "}
        <Link href="/es/blog/entrainements-salle-de-sport-le-mans">
          nuestras sesiones, individuales o en grupo
        </Link>{" "}
        y{" "}
        <Link href="/es/blog/equipe-sportive-le-mans">nuestro artículo para equipos deportivos</Link>
        .
      </p>
      <ExerciseGuide locale="es" ids={["back-squat", "goblet-squat", "romanian-deadlift", "step-up", "walking-lunge", "calf-raise", "side-plank", "dead-bug"]} />
    </>
  );
}
