import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        El balonmano encadena sprints, duelos, cambios de dirección y lanzamientos en
        suspensión: un deporte de contacto que exige mucho a las rodillas y al hombro del brazo
        de lanzamiento. En agosto de 2026, un equipo femenino de balonmano pasó un fin de
        semana de torneo en la casa, 19 personas con su cuerpo técnico. Así puede usar{" "}
        <Link href="/es/blog/salle-de-sport-privee-le-mans">el gimnasio de la casa</Link>{" "}
        para preparar un partido o una concentración.
      </p>

      <h2>Lo que exige el balonmano</h2>
      <ul>
        <li>
          <strong>Explosividad</strong>: arrancadas, saltos, apoyos.
        </li>
        <li>
          <strong>Rodillas protegidas</strong>: los aterrizajes y los cambios de dirección son
          el primer riesgo de lesión.
        </li>
        <li>
          <strong>Un hombro de lanzador sólido</strong>, sobre todo en la parte posterior del
          hombro.
        </li>
        <li>
          <strong>Un tronco fuerte</strong> para los duelos.
        </li>
      </ul>

      <h2>La sesión de fuerza y explosividad (50 minutos)</h2>
      <ul>
        <li>
          <strong>Box jumps</strong>: 4 × 4, aterrizaje silencioso, rodillas alineadas con los
          pies.
        </li>
        <li>
          <strong>Back squat</strong>: 4 × 5.
        </li>
        <li>
          <strong>Peso muerto rumano</strong>: 3 × 8, para los isquiotibiales, que protegen la
          rodilla.
        </li>
        <li>
          <strong>Zancadas caminando</strong> con mancuernas: 3 × 8 por pierna.
        </li>
        <li>
          <strong>Press de banca</strong>: 3 × 6.
        </li>
        <li>
          <strong>Dominadas</strong>: 3 series al máximo menos una.
        </li>
        <li>
          <strong>Thrusters con balón medicinal</strong>: 3 × 10, empuje explosivo.
        </li>
      </ul>

      <h2>La prevención, antes de cada sesión (15 minutos)</h2>
      <ul>
        <li>
          <strong>Hombro</strong>: rotaciones externas con banda elástica 3 × 15, face pull con
          cuerda 3 × 15.
        </li>
        <li>
          <strong>Rodillas</strong>: aterrizajes a una pierna desde el cajón bajo (20 cm),
          3 × 5 por pierna, manteniendo el aterrizaje 2 segundos, rodilla alineada.
        </li>
        <li>
          <strong>Aductores</strong>: plancha Copenhague, 2 × 20 s por lado.
        </li>
        <li>
          <strong>Core</strong>: plancha lateral, 2 × 30 s por lado.
        </li>
      </ul>

      <h2>El circuito de equipo</h2>
      <p>
        Para un equipo de 14 a 16 jugadoras o jugadores: dos grupos. El primero hace el
        circuito por estaciones en el gimnasio (remo, box jumps, thrusters con balón
        medicinal, polea, dominadas, plancha, comba, zancadas) y el segundo sale a correr al
        parque del Gué de Maulny, a 5 minutos a pie. Se intercambian a los 20 minutos.
      </p>

      <h2>El fin de semana de torneo</h2>
      <ul>
        <li>
          <strong>La mañana del partido</strong>: 15 minutos de activación (elíptica,
          prevención de hombro y rodillas) y salida hacia el pabellón.
        </li>
        <li>
          <strong>Entre dos partidos</strong>: comida de equipo en la gran mesa de 16 a 20
          plazas, camisetas a la lavadora.
        </li>
        <li>
          <strong>Por la noche</strong>:{" "}
          <Link href="/es/blog/recuperation-apres-effort-le-mans">rutina de recuperación</Link>{" "}
          y una buena noche de sueño, cada uno en su habitación.
        </li>
      </ul>

      <h2>Información práctica para un club</h2>
      <ul>
        <li>
          Antarès, donde también se juegan partidos de balonmano, tiene conexión directa con el
          tranvía T1 desde la estación, a 15 minutos a pie de la casa.
        </li>
        <li>
          9 habitaciones con baño con ducha, hasta 20 personas; los jóvenes de 10 a 17 años
          bajo la responsabilidad de sus responsables, los menores en el gimnasio con un
          adulto.
        </li>
        <li>Pago posible mediante factura a nombre del club.</li>
      </ul>
      <p>
        Más información en{" "}
        <Link href="/es/blog/equipe-sportive-le-mans">nuestro artículo para equipos deportivos</Link>
        .
      </p>
      <ExerciseGuide locale="es" ids={["box-jump", "back-squat", "romanian-deadlift", "walking-lunge", "bench-press", "pull-up", "medicine-ball-thruster", "band-external-rotation", "face-pull", "copenhagen-plank", "side-plank"]} />
    </>
  );
}
