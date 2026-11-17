import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        En el patinaje de velocidad, todo sale de las caderas: un empuje lateral, una posición
        flexionada mantenida durante horas y una espalda que tiene que aguantar. Ya hemos
        recibido a equipos de patinaje que venían por el circuito; así puede usar{" "}
        <Link href="/es/blog/salle-de-sport-privee-le-mans">el gimnasio de la casa</Link>{" "}
        para prepararse, en particular para las 24 Horas Rollers.
      </p>

      <h2>Lo que exige el patinaje</h2>
      <ul>
        <li>
          <strong>Glúteos y aductores potentes</strong> para el empuje lateral.
        </li>
        <li>
          <strong>Muslos resistentes</strong>, en posición flexionada durante todo un relevo.
        </li>
        <li>
          <strong>Una zona lumbar sólida</strong>, inclinada hacia delante.
        </li>
        <li>
          <strong>Tobillos estables</strong> y un buen equilibrio sobre una pierna.
        </li>
      </ul>

      <h2>La sesión del patinador (50 minutos)</h2>
      <ul>
        <li>
          <strong>Back squat</strong>: 4 × 6, o sentadilla frontal para mantener el tronco
          recto.
        </li>
        <li>
          <strong>Zancadas laterales</strong> con mancuernas: 3 × 8 por lado, el gesto más
          parecido al empuje.
        </li>
        <li>
          <strong>Step-up al cajón</strong>: 3 × 8 por pierna.
        </li>
        <li>
          <strong>Peso muerto rumano</strong>: 3 × 8.
        </li>
        <li>
          <strong>Plancha Copenhague</strong> en el banco, para los aductores: 3 × 20 s por
          lado.
        </li>
        <li>
          <strong>Box jumps laterales</strong> sobre un cajón bajo (20 cm): 3 × 6 por lado,
          aterrizaje suave.
        </li>
        <li>
          <strong>Equilibrio</strong>: mantenerse sobre una pierna, rodilla flexionada en
          posición de patinaje, 3 × 30 s por pierna, con los ojos cerrados para los más
          seguros.
        </li>
      </ul>

      <h2>Resistencia sin patinar</h2>
      <p>
        La elíptica reproduce un empuje pierna a pierna sin impacto: 30 minutos de
        resistencia, o intervalos de 2 minutos exigentes por 1 minuto suave. El remo Concept2
        mantiene el cardio trabajando la espalda y los brazos.
      </p>

      <h2>Las 24 Horas Rollers, en equipo</h2>
      <p>
        En julio, el circuito Bugatti acoge las{" "}
        <Link href="/es/blog/24-heures-rollers-le-mans">24 Horas Rollers</Link>. Un equipo de
        relevos alojado en la casa, a 4,7 km del circuito, puede:
      </p>
      <ul>
        <li>
          activarse por la mañana con 10 minutos de elíptica y unas zancadas laterales;
        </li>
        <li>
          volver a dormir entre dos relevos en una habitación totalmente a oscuras, con su
          propia ducha;
        </li>
        <li>
          recuperar después de la carrera con{" "}
          <Link href="/es/blog/recuperation-apres-effort-le-mans">nuestra rutina para después del esfuerzo</Link>
          : caderas, aductores, zona lumbar.
        </li>
      </ul>

      <h2>Información práctica</h2>
      <ul>
        <li>9 habitaciones con baño con ducha, hasta 20 personas.</li>
        <li>Lavadora y secadora para la ropa.</li>
        <li>Cocina equipada y gran mesa para las comidas de equipo.</li>
        <li>
          Sin supervisión: cada uno entrena bajo su responsabilidad, los menores con un
          adulto.
        </li>
      </ul>
      <p>
        Vea también{" "}
        <Link href="/es/blog/entrainements-salle-de-sport-le-mans">
          nuestras sesiones, individuales o en grupo
        </Link>
        .
      </p>
      <ExerciseGuide locale="es" ids={["back-squat", "front-squat", "lateral-lunge", "step-up", "romanian-deadlift", "copenhagen-plank", "box-jump"]} />
    </>
  );
}
