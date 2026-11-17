import Image from "next/image";
import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Al fondo del jardín, en un anexo independiente de la casa, le espera un auténtico
        gimnasio de musculación y cross-training: jaula de sentadillas, barra olímpica, 185 kg
        de carga, polea, remo Concept2 y bicicleta elíptica. Está reservado a su grupo durante
        toda la estancia. Esto es lo que contiene, lo que se puede hacer en él y para quién
        cambia la estancia.
      </p>

      <h2>Un gimnasio aparte, reservado a su grupo</h2>
      <p>
        El gimnasio no es un rincón del garaje con dos mancuernas: es una sala dedicada,
        separada de la casa, con el <strong>suelo cubierto de losetas amortiguadoras de caucho
        de 20 mm</strong>, las mismas que en los boxes de cross-training. Se puede{" "}
        <strong>soltar una barra cargada con discos bumper</strong> después de un peso muerto o
        de un dos tiempos, sin dañar el suelo ni despertar a la casa. Como la casa se alquila
        entera, el gimnasio no se comparte con nadie más que con su grupo.
      </p>

      <h2>El equipamiento, zona por zona</h2>

      <h3>La fuerza: jaula, barra y bumpers</h3>
      <ul>
        <li>
          <strong>Una jaula de sentadillas</strong> con barra de dominadas, barras de fondos y
          soportes regulables: sentadilla, press de banca, press militar, dominadas y fondos,
          con total seguridad.
        </li>
        <li>
          <strong>Una barra olímpica de 20 kg</strong> (2,20 m), con una funda de protección
          para la sentadilla y dos cierres.
        </li>
        <li>
          <strong>165 kg de discos bumper</strong>, de 2,5 a 25 kg: <strong>hasta 185 kg en
          la barra</strong>. Suficiente para trabajar pesado en sentadilla y peso muerto.
        </li>
        <li>
          <strong>Un banco de musculación regulable</strong> (plano, inclinado) y un{" "}
          <strong>cinturón de halterofilia</strong>.
        </li>
      </ul>

      <figure className="my-8">
        <Image
          src="/images/blog/salle-de-sport/cage-powergym.jpg"
          alt="La jaula de sentadillas del gimnasio: barra de dominadas, barras de fondos, soportes y polea alta y baja"
          width={772}
          height={772}
          sizes="(max-width: 768px) 100vw, 512px"
          className="mx-auto w-full max-w-md rounded-xl bg-white"
        />
        <figcaption className="mt-2 text-center text-sm text-secondary">
          La jaula del gimnasio, con su polea alta y baja (foto: Powergym).
        </figcaption>
      </figure>

      <figure className="my-8">
        <Image
          src="/images/blog/entrainement-salle-de-sport.jpg"
          alt="El gimnasio: la jaula, el banco de musculación, los discos bumper ordenados y el cinturón de halterofilia"
          width={1920}
          height={1280}
          sizes="(max-width: 768px) 100vw, 768px"
          className="w-full rounded-xl"
        />
        <figcaption className="mt-2 text-center text-sm text-secondary">
          El banco, los bumpers ordenados y el cinturón, junto a la jaula.
        </figcaption>
      </figure>

      <h3>La polea y las mancuernas</h3>
      <ul>
        <li>
          <strong>Una polea alta y baja</strong> montada en la jaula, con cinco manerales: un
          maneral de remo de agarre neutro, una cuerda de tríceps, una barra larga para los
          dorsales, un maneral simple para trabajar un brazo cada vez y una barra recta corta.
          Jalón al pecho, remo horizontal, extensiones, curls, rotaciones de hombro.
        </li>
        <li>
          <strong>60 kg de discos de hierro</strong> (de 1 a 10 kg) para cargar la polea o las
          mancuernas, kilo a kilo.
        </li>
      </ul>

      <h3>El cardio</h3>
      <ul>
        <li>
          <strong>Un remo Concept2</strong>, la referencia de los gimnasios y los clubes de
          remo: intervalos, resistencia, retos cronometrados.
        </li>
        <li>
          <strong>Una bicicleta elíptica NordicTrack</strong>, sin impacto para las
          articulaciones.
        </li>
        <li>
          <strong>Una comba</strong>.
        </li>
      </ul>

      <h3>El cross-training, el peso corporal y la movilidad</h3>
      <ul>
        <li>
          <strong>Un balón medicinal de 6 kg</strong> y un <strong>cajón de salto de
          madera</strong> regulable de 20 a 50 cm.
        </li>
        <li>
          <strong>Bandas elásticas</strong>, una <strong>pica de movilidad</strong> y{" "}
          <strong>esterillas</strong> para el calentamiento, el core y los estiramientos.
        </li>
      </ul>

      <h2>Qué se puede hacer</h2>
      <figure className="my-8">
        <Image
          src="/images/blog/salle-de-sport/cage-exercices-powergym.jpg"
          alt="Ejemplos de ejercicios en la jaula: sentadilla, dominadas, jalón al pecho, fondos, remo en polea baja"
          width={772}
          height={772}
          sizes="(max-width: 768px) 100vw, 640px"
          className="mx-auto w-full max-w-xl rounded-xl bg-white"
        />
        <figcaption className="mt-2 text-center text-sm text-secondary">
          Sentadilla, dominadas, fondos, remos: lo que permite la misma jaula (foto: Powergym).
        </figcaption>
      </figure>

      <ul>
        <li>
          <strong>Ganar fuerza</strong>: sentadilla, peso muerto, press de banca, dominadas
          lastradas, con cargas serias.
        </li>
        <li>
          <strong>Ganar músculo</strong>: barra, polea y mancuernas para trabajar cada grupo
          muscular, de la espalda a los tríceps.
        </li>
        <li>
          <strong>Mejorar el cardio</strong>: intervalos en el remo, resistencia en la
          elíptica, comba.
        </li>
        <li>
          <strong>Quemar calorías</strong>: circuitos y AMRAP que combinan balón medicinal, box
          jump, comba y remo.
        </li>
        <li>
          <strong>Preparar una competición</strong>: fortalecimiento específico para su
          deporte, prevención de lesiones, activación la mañana de la prueba.
        </li>
        <li>
          <strong>Recuperar</strong>: vuelta a la calma en la elíptica, movilidad y
          estiramientos, y después la sala zen.
        </li>
      </ul>
      <p>
        Hemos reunido sesiones listas para seguir, solo o en grupo, en{" "}
        <Link href="/es/blog/entrainements-salle-de-sport-le-mans">
          nuestro artículo sobre los entrenamientos
        </Link>
        , y una rutina para después del esfuerzo en{" "}
        <Link href="/es/blog/recuperation-apres-effort-le-mans">
          nuestro artículo sobre la recuperación
        </Link>
        .
      </p>

      <h2>Para quién</h2>
      <ul>
        <li>
          <strong>Los equipos deportivos</strong> en torneo o en concentración: la preparación
          física se hace en casa, entre dos partidos. Vea{" "}
          <Link href="/es/blog/equipe-sportive-le-mans">nuestro artículo sobre los equipos deportivos</Link>
          .
        </li>
        <li>
          <strong>Los pilotos y sus equipos</strong>, que vienen por el circuito: cuello, core,
          cardio y una activación muscular la mañana de la carrera.
        </li>
        <li>
          <strong>Los seminarios</strong>: una sesión colectiva de 20 minutos antes de la
          primera reunión despierta más que un tercer café.
        </li>
        <li>
          <strong>Los equipos desplazados</strong> a Le Mans durante varias semanas, que no
          quieren dejar de entrenar.
        </li>
        <li>
          <strong>Las familias con adolescentes</strong> deportistas, acompañados de un adulto.
        </li>
      </ul>

      <h2>La preparación física, deporte por deporte</h2>
      <p>Un artículo por disciplina, con sesiones adaptadas a este gimnasio:</p>
      <ul>
        <li>
          <Link href="/es/blog/preparation-physique-course-automobile-le-mans">
            Automovilismo
          </Link>{" "}
          y{" "}
          <Link href="/es/blog/preparation-physique-karting-le-mans">karting</Link>;
        </li>
        <li>
          <Link href="/es/blog/preparation-physique-cyclisme-le-mans">ciclismo</Link>,{" "}
          <Link href="/es/blog/preparation-physique-roller-le-mans">patinaje</Link> y{" "}
          <Link href="/es/blog/preparation-physique-course-a-pied-le-mans">running</Link>;
        </li>
        <li>
          <Link href="/es/blog/preparation-physique-volley-ball-le-mans">voleibol</Link>,{" "}
          <Link href="/es/blog/preparation-physique-handball-le-mans">balonmano</Link> e{" "}
          <Link href="/es/blog/preparation-physique-equitation-le-mans">equitación</Link>.
        </li>
      </ul>

      <h2>Con el resto de la casa</h2>
      <ul>
        <li>
          <strong>Una sala zen con esterillas de yoga</strong> para estirar con calma.
        </li>
        <li>
          <strong>El parque del Gué de Maulny</strong> (10 ha) a 5 minutos a pie, para correr.
        </li>
        <li>
          <strong>Un baño con ducha por habitación</strong>: 9 habitaciones, 9 duchas, sin colas
          después del entrenamiento.
        </li>
        <li>
          <strong>Una lavadora y una secadora</strong> para la ropa de deporte.
        </li>
        <li>
          <strong>Una cocina equipada</strong> y una gran mesa de 16 a 20 plazas para las
          comidas de equipo.
        </li>
      </ul>

      <h2>Bueno saberlo</h2>
      <ul>
        <li>
          <strong>Sin supervisión</strong>: el gimnasio se usa bajo la responsabilidad de cada
          uno. Caliente bien, elija cargas que domine, pida que le asistan en las series
          pesadas de banca y ordene el material después de la sesión.
        </li>
        <li>
          <strong>Los menores</strong> entrenan acompañados de un adulto (padre, madre o
          responsable del club).
        </li>
        <li>
          <strong>Se sueltan los bumpers, no el hierro</strong>: las losetas están hechas para
          una barra cargada con bumpers; los discos de hierro y las mancuernas se dejan con
          cuidado.
        </li>
      </ul>

      <h2>Reserve la casa y su gimnasio</h2>
      <p>
        El gimnasio está incluido en el alquiler de la casa, como la sala zen y el jardín.
        Consulte nuestra <Link href="/es#disponibilite">disponibilidad en tiempo real</Link>{" "}
        y reserve directamente, sin comisión.
      </p>
      <ExerciseGuide locale="es" ids={["back-squat", "deadlift", "bench-press", "pull-up", "seated-cable-row", "rowing", "medicine-ball-thruster", "box-jump"]} />
    </>
  );
}
