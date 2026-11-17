import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        En el voleibol se salta, se remata, se cae y se vuelve a empezar cientos de veces por
        torneo. Un equipo de voleibol que se aloja en nuestra casa puede mantener su salto y
        proteger hombros y rodillas en{" "}
        <Link href="/es/blog/salle-de-sport-privee-le-mans">el gimnasio de la casa</Link>
        . Estas son las sesiones que proponemos, antes y durante un torneo.
      </p>

      <h2>Lo que exige el voleibol</h2>
      <ul>
        <li>
          <strong>El salto</strong>: piernas fuertes y rápidas para el ataque y el bloqueo.
        </li>
        <li>
          <strong>Aterrizajes controlados</strong>: las rodillas y los tobillos absorben cada
          salto.
        </li>
        <li>
          <strong>Hombros sólidos</strong>: el remate y el saque exigen mucho al manguito de los
          rotadores.
        </li>
        <li>
          <strong>Un tronco firme</strong> que transmite la fuerza de las piernas al brazo.
        </li>
      </ul>

      <h2>La sesión de salto (45 minutos)</h2>
      <ul>
        <li>
          <strong>Box jumps</strong>: 4 × 5, cajón de 40 a 50 cm, bajando caminando. Se busca
          la calidad de cada salto, no la fatiga.
        </li>
        <li>
          <strong>Back squat</strong>: 4 × 5, pesado y rápido en la subida.
        </li>
        <li>
          <strong>Hip thrust</strong> con barra: 3 × 8.
        </li>
        <li>
          <strong>Zancadas caminando</strong> con mancuernas: 3 × 8 por pierna.
        </li>
        <li>
          <strong>Elevación de gemelos de pie</strong>: 3 × 15.
        </li>
      </ul>

      <h2>La sesión preventiva de «hombros» (20 minutos)</h2>
      <p>Para hacer antes de los entrenamientos o los días de torneo, con carga ligera:</p>
      <ul>
        <li>
          <strong>Rotaciones externas con banda elástica</strong>, codo pegado al cuerpo:
          3 × 15.
        </li>
        <li>
          <strong>Face pull</strong> con cuerda, polea alta: 3 × 15.
        </li>
        <li>
          <strong>Jalón al pecho</strong> en polea, barra larga: 3 × 12.
        </li>
        <li>
          <strong>Flexiones</strong>: 3 × 10, escápulas activas.
        </li>
        <li>
          <strong>Thrusters con balón medicinal</strong>: 3 × 10, para coordinar piernas y
          brazos.
        </li>
      </ul>

      <h2>En equipo: el circuito de voleibol</h2>
      <p>
        Para 6 a 12 jugadores, por parejas: 40 segundos por estación, 20 segundos para rotar,
        dos vueltas. Box jumps, thrusters con balón medicinal, remo, face pull, zancadas,
        plancha, comba y rotaciones con banda elástica. El entrenador marca el ritmo; el
        gimnasio tiene sitio para todos.
      </p>

      <h2>Durante el torneo</h2>
      <ul>
        <li>
          <strong>Por la mañana</strong>: activación de 15 minutos, elíptica, rotaciones de
          hombros con banda elástica y unos saltos en el sitio.
        </li>
        <li>
          <strong>Por la noche</strong>: nada de musculación pesada;{" "}
          <Link href="/es/blog/recuperation-apres-effort-le-mans">rutina de recuperación</Link>
          , comida de equipo en la gran mesa y una buena noche de sueño.
        </li>
        <li>
          <strong>Las camisetas</strong> pasan por la lavadora y la secadora para el día
          siguiente.
        </li>
      </ul>

      <h2>Información práctica para un club</h2>
      <ul>
        <li>
          9 habitaciones con baño con ducha, hasta 20 personas: todo el equipo y su cuerpo
          técnico.
        </li>
        <li>
          Los jóvenes de 10 a 17 años se alojan bajo la responsabilidad de sus responsables
          adultos; en el gimnasio, los menores entrenan con un adulto.
        </li>
        <li>
          Antarès tiene conexión directa con el tranvía T1 desde la estación, a 15 minutos a pie
          de la casa.
        </li>
        <li>Pago posible mediante factura a nombre del club.</li>
      </ul>
      <p>
        Más información en{" "}
        <Link href="/es/blog/equipe-sportive-le-mans">nuestro artículo para equipos deportivos</Link>
        .
      </p>
      <ExerciseGuide locale="es" ids={["box-jump", "back-squat", "hip-thrust", "walking-lunge", "calf-raise", "band-external-rotation", "face-pull", "lat-pulldown", "push-up", "medicine-ball-thruster"]} />
    </>
  );
}
