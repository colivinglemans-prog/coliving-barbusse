import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Un kart no tiene ni dirección asistida ni suspensión: el piloto absorbe las
        vibraciones, las fuerzas laterales en el cuello y las costillas, y sujeta un volante
        duro en cada curva. En mayo de 2026, un equipo de karting llegado de Singapur se alojó
        en nuestra casa para las SWS Karting Finals. Así puede usar{" "}
        <Link href="/es/blog/salle-de-sport-privee-le-mans">el gimnasio de la casa</Link>{" "}
        para prepararse para una carrera en el circuito internacional de karting de Le Mans.
      </p>

      <h2>Lo que exige el karting</h2>
      <ul>
        <li>
          <strong>El cuello</strong>, que sostiene el casco en cada curva.
        </li>
        <li>
          <strong>Los antebrazos y el agarre</strong>, en un volante sin asistencia.
        </li>
        <li>
          <strong>El tronco y las costillas</strong>, encajados contra el baquet.
        </li>
        <li>
          <strong>El cardio</strong>: el ritmo cardiaco sube rápido durante una manga.
        </li>
      </ul>

      <h2>La sesión del piloto (45 minutos)</h2>
      <ul>
        <li>
          <strong>Cuello</strong>: isometría contra la mano en las cuatro direcciones, 4 × 15 s;
          después, tumbado en el banco con la cabeza fuera del borde, flexiones lentas solo con
          el peso de la cabeza, 2 × 12 por dirección.
        </li>
        <li>
          <strong>Agarre</strong>: colgarse de la barra de dominadas, 3 × 30 s; paseo del
          granjero con dos mancuernas, 3 × 30 m.
        </li>
        <li>
          <strong>Dominadas</strong>: 3 series al máximo menos una, con banda elástica como
          ayuda si hace falta.
        </li>
        <li>
          <strong>Remo horizontal</strong> en polea baja, maneral de agarre neutro: 3 × 12, y
          después remo a una mano, maneral simple, 2 × 10 por brazo para equilibrar los dos
          lados.
        </li>
        <li>
          <strong>Core</strong>: Pallof press 3 × 10 por lado, plancha lateral 3 × 30 s por
          lado.
        </li>
        <li>
          <strong>Cardio</strong>: remo Concept2, 6 × 2 minutos exigentes, 1 minuto suave.
        </li>
      </ul>

      <h2>La mañana de la carrera</h2>
      <p>
        De 10 a 15 minutos: elíptica progresiva, rotaciones de cuello y hombros, muñecas, unos
        segundos colgado de la barra, core ligero. El objetivo es llegar al circuito
        despierto, no cansado.
      </p>

      <h2>Los pilotos jóvenes</h2>
      <p>
        Muchos pilotos de karting son menores. En el gimnasio, entrenan{" "}
        <strong>acompañados de un adulto</strong> —padre o madre, mecánico o entrenador—, con
        ejercicios con el peso corporal, con banda elástica, en el remo y con cargas ligeras.
        El trabajo de cuello se hace sin carga.
      </p>

      <h2>Después de las mangas</h2>
      <p>
        Ducha en la propia habitación, comida de equipo y unos minutos de estiramientos de
        cuello, antebrazos y espalda en la sala zen. El detalle está en{" "}
        <Link href="/es/blog/recuperation-apres-effort-le-mans">nuestra rutina de recuperación</Link>
        .
      </p>

      <h2>Información práctica para un equipo de karting</h2>
      <ul>
        <li>
          El circuito internacional de karting acoge las{" "}
          <Link href="/es/blog/sws-karting-finals-le-mans">SWS Karting Finals</Link>, el{" "}
          <Link href="/es/blog/championnat-monde-karting-kz-le-mans">
            Campeonato del Mundo KZ
          </Link>{" "}
          y otras pruebas internacionales.
        </li>
        <li>
          Los karts, el remolque y las herramientas se quedan en el paddock: en la calle no hay
          sitio para ellos.
        </li>
        <li>
          9 habitaciones con baño con ducha, hasta 20 personas: pilotos, padres y mecánicos
          bajo el mismo techo.
        </li>
      </ul>
      <p>
        Para los pilotos de automovilismo, vea{" "}
        <Link href="/es/blog/preparation-physique-course-automobile-le-mans">
          nuestro artículo sobre el automovilismo
        </Link>
        .
      </p>
      <ExerciseGuide locale="es" ids={["neck-isometrics", "farmer-walk", "pull-up", "seated-cable-row", "single-arm-cable-row", "pallof-press", "side-plank", "rowing"]} />
    </>
  );
}
