import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Un ciclista pasa horas sobre la bici, y precisamente por eso el gimnasio le resulta
        útil: piernas más fuertes, un tronco que aguanta la posición, una espalda que ya no se
        queja después de cuatro horas de sillín. Recibimos a un grupo de ciclistas el fin de
        semana de las 24 Heures Vélo: así puede aprovechar{" "}
        <Link href="/es/blog/salle-de-sport-privee-le-mans">el gimnasio de la casa</Link>{" "}
        antes, durante y después de una prueba en Le Mans.
      </p>

      <h2>Lo que la musculación aporta al ciclista</h2>
      <ul>
        <li>
          <strong>Piernas más potentes</strong>: más fuerza son más vatios en los cambios de
          ritmo y en los repechos.
        </li>
        <li>
          <strong>Un tronco sólido</strong>: la pelvis se mantiene estable en el sillín y la
          pedalada no se dispersa.
        </li>
        <li>
          <strong>Una espalda y una nuca que aguantan</strong> la posición aerodinámica.
        </li>
        <li>
          <strong>Huesos y tendones más resistentes</strong>: el ciclismo, deporte sin impacto,
          apenas los estimula.
        </li>
      </ul>

      <h2>La sesión de fuerza del ciclista (50 minutos)</h2>
      <p>Para hacer una o dos veces por semana fuera del periodo de competición:</p>
      <ul>
        <li>
          <strong>Back squat</strong> en la jaula: 4 × 6, difícil pero limpio.
        </li>
        <li>
          <strong>Peso muerto rumano</strong>: 3 × 8, para los isquiotibiales y los glúteos, a
          menudo rezagados en el ciclista.
        </li>
        <li>
          <strong>Step-up al cajón</strong> (40 a 50 cm) con mancuernas: 3 × 8 por pierna,
          para corregir la diferencia entre la pierna fuerte y la débil.
        </li>
        <li>
          <strong>Hip thrust</strong> con barra, espalda en el banco: 3 × 10.
        </li>
        <li>
          <strong>Remo horizontal</strong> en polea baja: 3 × 12, para la parte alta de la
          espalda.
        </li>
        <li>
          <strong>Core</strong>: plancha 3 × 40 s, plancha lateral 2 × 30 s por lado, dead bug
          2 × 10.
        </li>
      </ul>

      <h2>Cuando se acerca una carrera</h2>
      <p>
        En la semana de la prueba se mantiene algo de fuerza, pero sin fatiga: 2 × 5
        sentadillas ligeras y rápidas, core, y nada más. La víspera bastan 15 minutos de
        elíptica y movilidad de caderas.
      </p>

      <h2>Las 24 Heures Vélo: relevos y recuperación</h2>
      <p>
        A finales de agosto, el circuito Bugatti acoge las{" "}
        <Link href="/es/blog/24-heures-velo-le-mans-2027">24 Heures Vélo</Link>, en solitario o
        por equipos. Para un equipo de relevos alojado en la casa, a 4,7 km del circuito:
      </p>
      <ul>
        <li>
          <strong>Entre dos relevos</strong>: 10 minutos de elíptica muy suave para activar la
          circulación, una ducha en la propia habitación, comer y dormir totalmente a oscuras
          gracias a las persianas.
        </li>
        <li>
          <strong>Después de la carrera</strong>: la rutina de{" "}
          <Link href="/es/blog/recuperation-apres-effort-le-mans">nuestro artículo sobre la recuperación</Link>
          , centrada en las caderas, los isquiotibiales y la zona lumbar.
        </li>
      </ul>

      <h2>El remo, el aliado de los días sin bici</h2>
      <p>
        El remo Concept2 trabaja la parte superior del cuerpo que la bici olvida, sin impacto.
        Una sesión de 20 minutos de resistencia, o 6 × 3 minutos exigentes, mantiene el corazón
        en forma los días de lluvia o de descanso de piernas.
      </p>

      <h2>Información práctica para un equipo ciclista</h2>
      <ul>
        <li>
          <strong>Las bicis se guardan a cubierto en la sala zen</strong>, en el interior.
        </li>
        <li>
          <strong>Lavadora y secadora</strong> para los culotes y los maillots.
        </li>
        <li>
          <strong>Un baño con ducha por habitación</strong>, 9 habitaciones, hasta 20 personas.
        </li>
        <li>
          La estación de TGV está a 15 minutos a pie, a unos 55 minutos de París.
        </li>
      </ul>
      <p>
        Para otras sesiones, vea{" "}
        <Link href="/es/blog/entrainements-salle-de-sport-le-mans">
          nuestros entrenamientos individuales o en grupo
        </Link>{" "}
        y{" "}
        <Link href="/es/blog/equipe-sportive-le-mans">nuestro artículo para equipos deportivos</Link>
        .
      </p>
      <ExerciseGuide locale="es" ids={["back-squat", "romanian-deadlift", "step-up", "hip-thrust", "seated-cable-row", "plank", "side-plank", "dead-bug", "rowing"]} />
    </>
  );
}
