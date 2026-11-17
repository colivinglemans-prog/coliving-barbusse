import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Un jinete no carga peso, pero mantiene una postura durante horas, absorbe cada tranco
        con la pelvis y da las ayudas con unas piernas independientes del tren superior.
        Recibimos a jinetes que vienen a los concursos de la región: así puede usar{" "}
        <Link href="/es/blog/salle-de-sport-privee-le-mans">el gimnasio de la casa</Link>{" "}
        para montar mejor y cuidar la espalda.
      </p>

      <h2>Lo que exige la equitación</h2>
      <ul>
        <li>
          <strong>Un tronco estable</strong>: el core permite seguir el movimiento del caballo
          sin ponerse rígido ni venirse abajo.
        </li>
        <li>
          <strong>Aductores y glúteos</strong> que mantienen la posición, tanto en doma como en
          equilibrio sobre el salto.
        </li>
        <li>
          <strong>Una pelvis móvil</strong> que absorbe los aires.
        </li>
        <li>
          <strong>Una parte alta de la espalda tonificada</strong> para mantenerse erguido, con
          los hombros abajo.
        </li>
        <li>
          <strong>Simetría</strong>: cada jinete tiene un lado más fuerte.
        </li>
      </ul>

      <h2>La sesión del jinete (40 minutos)</h2>
      <ul>
        <li>
          <strong>Goblet squat</strong> con un bumper de 5 o 10 kg: 3 × 10, tronco recto.
        </li>
        <li>
          <strong>Plancha Copenhague</strong> en el banco: 3 × 20 s por lado, para los
          aductores.
        </li>
        <li>
          <strong>Hip thrust</strong> con barra: 3 × 10.
        </li>
        <li>
          <strong>Pallof press</strong> en polea, maneral simple: 3 × 10 por lado, sin que el
          tronco gire.
        </li>
        <li>
          <strong>Remo horizontal</strong> en polea baja: 3 × 12, escápulas juntas.
        </li>
        <li>
          <strong>Dead bug</strong> en la esterilla: 3 × 10, para disociar brazos y piernas.
        </li>
        <li>
          <strong>Zancadas caminando</strong>: 2 × 8 por pierna, vigilando el lado más débil.
        </li>
      </ul>

      <h2>El cardio, útil en el concurso completo</h2>
      <p>
        Un recorrido de cross o una larga jornada de concurso también cansan al jinete. De 20
        a 30 minutos de elíptica o de remo Concept2 dos veces por semana bastan para no
        terminar el recorrido sin aliento.
      </p>

      <h2>El día del concurso</h2>
      <ul>
        <li>
          <strong>Por la mañana</strong>: 10 minutos de movilidad de pelvis y caderas en la
          esterilla (basculaciones de pelvis, aperturas de cadera, gato-vaca), antes de salir
          hacia las cuadras.
        </li>
        <li>
          <strong>Por la noche</strong>: estiramientos de aductores, flexores de cadera y zona
          lumbar en la sala zen; vea{" "}
          <Link href="/es/blog/recuperation-apres-effort-le-mans">nuestra rutina de recuperación</Link>
          .
        </li>
      </ul>

      <h2>Información práctica para jinetes</h2>
      <ul>
        <li>
          El <strong>Pôle européen du cheval</strong> (Yvré-l'Évêque) está a unos veinte
          minutos en coche, igual que el hipódromo de Les Hunaudières. Vea{" "}
          <Link href="/es/blog/concours-equestre-pole-europeen-du-cheval">
            nuestro artículo sobre los concursos hípicos
          </Link>
          .
        </li>
        <li>
          Los caballos, los remolques y los camiones se quedan en el recinto del concurso: la
          casa no tiene ni cuadra ni sitio para un camión.
        </li>
        <li>
          Lavadora y secadora para la ropa, un baño con ducha por habitación, hasta 20
          personas: jinetes, entrenadores y familias.
        </li>
        <li>
          Los jóvenes jinetes de 10 a 17 años se alojan bajo la responsabilidad de sus
          responsables; en el gimnasio, los menores entrenan con un adulto.
        </li>
      </ul>
      <ExerciseGuide locale="es" ids={["goblet-squat", "copenhagen-plank", "hip-thrust", "pallof-press", "seated-cable-row", "dead-bug", "walking-lunge"]} />
    </>
  );
}
