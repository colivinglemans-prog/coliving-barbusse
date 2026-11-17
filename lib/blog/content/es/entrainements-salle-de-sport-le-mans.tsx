import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Está en la casa unos días y el gimnasio está al fondo del jardín. Aquí tiene sesiones
        listas para seguir, solo o en grupo, de 20 a 60 minutos, según su objetivo: fuerza,
        ganancia muscular, cardio, pérdida de peso o una simple vuelta al entrenamiento. Todas
        utilizan el material de{" "}
        <Link href="/es/blog/salle-de-sport-privee-le-mans">nuestro gimnasio privado</Link>.
      </p>

      <h2>Antes de empezar</h2>
      <ul>
        <li>
          <strong>Las cargas no son fijas</strong>: se expresan en esfuerzo percibido.
          «Difícil» quiere decir que le quedan dos repeticiones en reserva al final de la
          serie; «máximo», ninguna.
        </li>
        <li>
          <strong>Calentamiento común a todas las sesiones</strong> (8 a 10 minutos): 5 minutos
          de remo o de elíptica a ritmo suave, y después 2 rondas de 10 rotaciones de hombros
          con la pica, 10 sentadillas con el peso corporal, 10 zancadas, 10 flexiones y 20
          segundos de plancha.
        </li>
        <li>
          <strong>Sin supervisión</strong>: el gimnasio se usa bajo su responsabilidad. Suba
          las cargas de forma progresiva, pida que le asistan en la banca y, si tiene dudas
          sobre su salud, consulte a un médico antes de empezar. Los menores entrenan con un
          adulto.
        </li>
        <li>
          <strong>El suelo está hecho para soltar una barra cargada con bumpers</strong>
          (losetas de caucho de 20 mm); el hierro y las mancuernas se dejan con cuidado.
        </li>
      </ul>

      <h2>Sesiones individuales</h2>

      <h3>Fuerza (60 minutos)</h3>
      <ul>
        <li>
          <strong>Back squat</strong> en la jaula: 5 series de 5, difícil, 2 a 3 minutos de
          descanso.
        </li>
        <li>
          <strong>Press de banca</strong> en el banco, dentro de la jaula con los topes de
          seguridad: 5 × 5.
        </li>
        <li>
          <strong>Dominadas</strong> en la barra de la jaula: 4 series al máximo menos una
          repetición (con banda elástica como ayuda si hace falta).
        </li>
        <li>
          <strong>Remo horizontal en polea baja</strong>, maneral de agarre neutro: 3 × 10.
        </li>
        <li>Terminar con 3 × 30 segundos de plancha.</li>
      </ul>

      <h3>Ganancia muscular, tren superior (50 minutos)</h3>
      <ul>
        <li>Press de banca inclinado: 4 × 8 a 10.</li>
        <li>Jalón al pecho en polea alta, barra larga: 4 × 10 a 12.</li>
        <li>Press militar con barra, de pie: 3 × 8.</li>
        <li>Fondos: 3 series al máximo menos dos.</li>
        <li>Extensiones de tríceps en polea, cuerda o barra recta corta: 3 × 12 a 15.</li>
        <li>Remo a una mano en polea baja, maneral simple: 3 × 10 por brazo.</li>
        <li>Curl de bíceps en polea baja, barra recta corta o cuerda: 3 × 12.</li>
      </ul>

      <h3>Ganancia muscular, tren inferior (50 minutos)</h3>
      <ul>
        <li>Sentadilla frontal o back squat: 4 × 8.</li>
        <li>Peso muerto rumano con barra: 4 × 10.</li>
        <li>Zancadas caminando con mancuernas: 3 × 10 por pierna.</li>
        <li>Step-up al cajón (30 a 40 cm): 3 × 10 por pierna.</li>
        <li>Elevación de gemelos de pie, barra en la espalda: 4 × 15.</li>
      </ul>

      <h3>Cardio en el remo (35 minutos)</h3>
      <ul>
        <li>
          <strong>8 × 500 m</strong> en el Concept2, a un ritmo exigente y constante, 1 min 30
          de descanso entre cada uno. Anote su tiempo medio: es su referencia para la próxima
          vez.
        </li>
        <li>
          Variante de resistencia: <strong>30 minutos de elíptica</strong> a una intensidad que
          todavía le permita hablar.
        </li>
      </ul>

      <h3>Quemagrasas (AMRAP de 20 minutos)</h3>
      <p>Tantas rondas como sea posible en 20 minutos, a un ritmo que pueda mantener:</p>
      <ul>
        <li>10 thrusters con balón medicinal (6 kg)</li>
        <li>10 box jumps (o step-ups) al cajón</li>
        <li>50 saltos de comba</li>
        <li>200 m de remo</li>
      </ul>

      <h3>Vuelta al entrenamiento para el viajero de negocios (30 minutos)</h3>
      <p>
        Para quien sale de una jornada de reuniones o de obra y no tiene ni la energía ni las
        ganas de una sesión intensa: 10 minutos de elíptica, y después 3 rondas de 12 goblet
        squats con un bumper de 5 o 10 kg, 12 remos en polea baja, 10 flexiones y 30 segundos
        de plancha. Terminar con 5 minutos de estiramientos en la sala zen.
      </p>

      <h3>Movilidad (20 minutos)</h3>
      <p>
        Para los días de descanso o las espaldas entumecidas por la carretera: pasos de
        hombros con la pica, sentadilla profunda mantenida agarrándose a la jaula, aperturas
        de cadera en la esterilla, rotaciones de hombros con banda elástica y, por último,
        estiramientos. El detalle está en{" "}
        <Link href="/es/blog/recuperation-apres-effort-le-mans">
          nuestro artículo sobre la recuperación
        </Link>
        .
      </p>

      <h2>Sesiones en grupo</h2>

      <h3>En pareja: «yo trabajo, tú recuperas» (40 minutos)</h3>
      <p>
        Solo trabaja uno de los dos cada vez, el otro recupera; se cambia en cada serie. 5
        rondas de:
      </p>
      <ul>
        <li>250 m de remo (mientras tanto, el compañero hace plancha);</li>
        <li>8 pesos muertos con barra, con una carga común;</li>
        <li>10 thrusters con balón medicinal.</li>
      </ul>

      <h3>Circuito por estaciones para 6 a 10 personas (45 minutos)</h3>
      <p>
        Cada persona empieza en una estación; 40 segundos de esfuerzo, 20 segundos para
        cambiar. Dos o tres vueltas según el nivel.
      </p>
      <ol>
        <li>Remo</li>
        <li>Bicicleta elíptica</li>
        <li>Thrusters con balón medicinal</li>
        <li>Box jumps o step-ups</li>
        <li>Comba</li>
        <li>Jalón en polea alta</li>
        <li>Dominadas o fondos (con banda elástica si hace falta)</li>
        <li>Goblet squats con un bumper</li>
        <li>Plancha en la esterilla</li>
        <li>Flexiones</li>
      </ol>
      <p>
        Si son más de 10, hagan dos grupos: uno en el gimnasio y otro corriendo en el parque
        del Gué de Maulny, a 5 minutos a pie, y luego se intercambian.
      </p>

      <h3>Relevo de equipo en el remo</h3>
      <p>
        El reto que reúne a todo el mundo: <strong>5000 m por equipo</strong>, en relevos de
        250 m, lo más rápido posible. Se apunta el tiempo en una hoja y se repite el último
        día de la estancia para ver quién ha progresado.
      </p>

      <h3>Activación muscular de seminario (20 minutos, todos los niveles)</h3>
      <p>
        Antes de la primera reunión, para un equipo que no necesariamente entrena: 5 minutos
        de remo o de elíptica por turnos, después 2 rondas de 10 sentadillas, 10 flexiones
        apoyadas en el cajón, 10 remos con banda elástica y 20 segundos de plancha, y para
        terminar 5 minutos de estiramientos. Nadie acaba agotado, todo el mundo llega
        despierto.
      </p>

      <h2>Una semana tipo</h2>
      <ul>
        <li>
          <strong>Fin de semana de 2 noches</strong>: una sesión de fuerza o un circuito la
          primera tarde, y un rodaje y movilidad a la mañana siguiente.
        </li>
        <li>
          <strong>Estancia de una semana</strong>: fuerza el lunes, cardio en el remo el
          martes, tren superior el miércoles, movilidad el jueves, tren inferior el viernes,
          AMRAP o relevo de equipo el sábado, descanso el domingo.
        </li>
        <li>
          <strong>Estancia larga, por trabajo</strong>: tres sesiones por semana (fuerza, tren
          superior, tren inferior) y una sesión de cardio bastan para progresar.
        </li>
      </ul>

      <h2>Y según su deporte</h2>
      <p>
        Para sesiones adaptadas a una disciplina, lea nuestros artículos de preparación física:{" "}
        <Link href="/es/blog/preparation-physique-course-automobile-le-mans">automovilismo</Link>,{" "}
        <Link href="/es/blog/preparation-physique-karting-le-mans">karting</Link>,{" "}
        <Link href="/es/blog/preparation-physique-cyclisme-le-mans">ciclismo</Link>,{" "}
        <Link href="/es/blog/preparation-physique-roller-le-mans">patinaje</Link>,{" "}
        <Link href="/es/blog/preparation-physique-course-a-pied-le-mans">running</Link>,{" "}
        <Link href="/es/blog/preparation-physique-volley-ball-le-mans">voleibol</Link>,{" "}
        <Link href="/es/blog/preparation-physique-handball-le-mans">balonmano</Link> y{" "}
        <Link href="/es/blog/preparation-physique-equitation-le-mans">equitación</Link>.
      </p>
      <ExerciseGuide locale="es" ids={["back-squat", "front-squat", "goblet-squat", "bench-press", "incline-bench-press", "overhead-press", "romanian-deadlift", "deadlift", "pull-up", "dips", "push-up", "seated-cable-row", "single-arm-cable-row", "lat-pulldown", "triceps-pushdown", "cable-curl", "walking-lunge", "step-up", "calf-raise", "medicine-ball-thruster", "box-jump", "jump-rope", "rowing", "plank"]} />
    </>
  );
}
