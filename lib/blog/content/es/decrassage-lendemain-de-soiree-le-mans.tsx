import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Una boda en la región, un cumpleaños en un restaurante, una noche en la ciudad o la
        victoria celebrada después de la carrera: a la mañana siguiente, las piernas pesan y la
        cabeza también. En lugar de quedarse en el sofá, una sesión regenerativa suave ayuda a
        ponerse de nuevo en marcha. Así puede hacerla en la casa, con{" "}
        <Link href="/es/blog/salle-de-sport-privee-le-mans">el gimnasio</Link>, la sala zen y
        el parque cercano.
      </p>

      <h2>Lo que hace la sesión regenerativa, y lo que no hace</h2>
      <ul>
        <li>
          <strong>Vuelve a poner el cuerpo en movimiento</strong>: la circulación se reactiva,
          los músculos entumecidos por el baile o por una noche corta se relajan, y a menudo uno
          se siente mejor después que antes.
        </li>
        <li>
          <strong>No elimina el alcohol más rápido</strong>: solo el tiempo lo hace. Una noche
          de fiesta no se «suda».
        </li>
        <li>
          <strong>No sustituye ni al agua, ni al sueño, ni a un buen desayuno</strong>.
        </li>
      </ul>

      <h2>Antes de empezar</h2>
      <ul>
        <li>
          <strong>Si ha bebido hace poco, nada de sesión</strong>: el equilibrio y los reflejos
          no se han recuperado. Ese día, nada de cargas pesadas, nada de box jumps, nada de
          barra por encima de la cabeza.
        </li>
        <li>
          <strong>Beba primero</strong> un vaso grande de agua y tenga una botella a mano
          durante la sesión.
        </li>
        <li>
          <strong>Coma un poco</strong>: pan, un plátano, algo sencillo. La cocina está
          equipada, y la cafetera de grano también.
        </li>
        <li>
          Mareos, náuseas, corazón acelerado: se para y se descansa. La sesión regenerativa
          tiene que seguir siendo agradable.
        </li>
      </ul>

      <h2>La sesión regenerativa (30 minutos)</h2>
      <ul>
        <li>
          <strong>10 a 15 minutos de cardio muy suave</strong> en la bicicleta elíptica o en el
          remo Concept2. Tiene que poder hablar sin esfuerzo. Si el remo resulta demasiado
          duro, basta con la elíptica.
        </li>
        <li>
          <strong>Movilidad, 10 minutos</strong>: pasos de hombros con la pica, gato-vaca a
          cuatro patas, sentadilla profunda mantenida agarrándose a la jaula, zancada baja 30
          segundos por lado.
        </li>
        <li>
          <strong>Un poco de fortalecimiento ligero</strong> si vuelven las ganas: 2 rondas de
          10 goblet squats con un bumper de 5 kg, 10 remos en polea baja y 20 segundos de
          plancha.
        </li>
        <li>
          <strong>Estiramientos en la sala zen</strong>, sobre las esterillas de yoga,
          respirando despacio: 5 minutos.
        </li>
      </ul>

      <h2>O fuera: un paseo por el parque</h2>
      <p>
        El <strong>parque del Gué de Maulny</strong> (10 ha) está a 5 minutos a pie. Un paseo
        de 20 a 30 minutos al aire libre, en grupo, suele sentar tan bien como el gimnasio, y
        nadie tiene que cambiarse. Los que estén en mejor forma pueden trotar una vuelta.
      </p>

      <h2>En grupo: la sesión regenerativa colectiva</h2>
      <p>
        Después de una boda o de un fin de semana entre amigos, se puede hacer la sesión
        juntos: un grupo en el gimnasio (elíptica y remo por turnos, movilidad en las
        esterillas) y el otro de paseo por el parque, y luego se intercambian. Todos terminan
        alrededor de la gran mesa de la cocina, 16 plazas sentadas, 20 con las mesitas de la
        galería acristalada, para un brunch.
      </p>

      <h2>El resto de la mañana</h2>
      <ul>
        <li>
          <strong>Una ducha</strong> en el propio baño: 9 habitaciones, 9 duchas, sin esperas
          ni siquiera siendo 20.
        </li>
        <li>
          <strong>Una siesta</strong> si hace falta: las persianas de las habitaciones las
          dejan totalmente a oscuras, incluso en pleno día.
        </li>
        <li>
          <strong>La salida</strong> es antes de las 11:00; es posible una salida tardía bajo
          petición, con suplemento y según disponibilidad. Práctico al día siguiente de una
          boda.
        </li>
      </ul>

      <h2>Bueno saberlo</h2>
      <ul>
        <li>
          La casa recibe a familias y grupos, pero <strong>no es una sala de fiestas</strong>:
          nada de fiestas ni celebraciones ruidosas en el lugar. La fiesta se hace en la ciudad
          o en el salón de celebraciones; la noche y el día siguiente, en la casa.
        </li>
        <li>
          El gimnasio se usa sin supervisión, bajo la responsabilidad de cada uno; los menores,
          con un adulto.
        </li>
        <li>
          Para una sesión más completa los días siguientes, vea{" "}
          <Link href="/es/blog/entrainements-salle-de-sport-le-mans">
            nuestras sesiones individuales o en grupo
          </Link>{" "}
          y{" "}
          <Link href="/es/blog/recuperation-apres-effort-le-mans">
            nuestra rutina de recuperación
          </Link>
          .
        </li>
      </ul>
      <ExerciseGuide locale="es" ids={["rowing", "goblet-squat", "seated-cable-row", "plank"]} />
    </>
  );
}
