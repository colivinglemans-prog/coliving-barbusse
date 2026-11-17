import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Un partido, una carrera, una jornada de concentración o un relevo nocturno: lo que hace
        en las horas siguientes cuenta tanto como el propio esfuerzo, sobre todo cuando le
        espera otra prueba al día siguiente. Aquí tiene una rutina de recuperación para seguir
        en la casa, con el gimnasio, la sala zen y el resto de la casa.
      </p>

      <h2>En la media hora siguiente: bajar pulsaciones</h2>
      <ul>
        <li>
          <strong>10 minutos de vuelta a la calma</strong> en la bicicleta elíptica o en el remo
          Concept2, a un ritmo muy suave, en el que se pueda hablar sin esfuerzo. Se ayuda al
          cuerpo a bajar de revoluciones en lugar de desplomarse en el sofá.
        </li>
        <li>
          <strong>Beber</strong> y comer un primer tentempié: la cocina está equipada, basta con
          haber previsto la compra.
        </li>
        <li>
          <strong>Una ducha</strong>: cada habitación tiene su propio baño con ducha, no hay
          colas ni siquiera siendo 20.
        </li>
      </ul>

      <h2>La rutina de movilidad (20 minutos)</h2>
      <p>
        Para hacer en la sala zen, sobre las esterillas de yoga, o en el gimnasio sobre las
        esterillas:
      </p>
      <ul>
        <li>
          <strong>Hombros</strong>: pasos de hombros con la pica, de delante hacia atrás,
          2 × 10; después rotaciones externas con banda elástica, 2 × 15, sin carga pesada.
        </li>
        <li>
          <strong>Espalda</strong>: gato-vaca a cuatro patas, 10 veces despacio; después
          colgarse de la barra de dominadas, 2 × 20 segundos, con los pies en el suelo si hace
          falta, para descomprimir.
        </li>
        <li>
          <strong>Caderas</strong>: sentadilla profunda mantenida 1 minuto agarrándose a la
          jaula, zancada baja 45 segundos por lado, postura de la paloma 1 minuto por lado.
        </li>
        <li>
          <strong>Piernas</strong>: isquiotibiales con banda elástica, tumbado boca arriba, 45
          segundos por pierna; gemelos contra la pared, 45 segundos por pierna.
        </li>
        <li>
          <strong>Cuello</strong> (después de una carrera o de un trayecto largo): inclinaciones
          y rotaciones lentas, 5 por lado.
        </li>
      </ul>

      <h2>La comida de equipo</h2>
      <p>
        Después del esfuerzo hacen falta hidratos de carbono para reponer las reservas y
        proteínas para los músculos. La gran mesa de la cocina tiene{" "}
        <strong>16 plazas sentadas, 20</strong> si se acercan las mesitas de la galería
        acristalada: todo el equipo come junto, a la hora que le conviene, lo que cocina uno
        mismo. La cocina tiene dos hornos, dos placas, ollas grandes y vajilla para 20.
      </p>

      <h2>El sueño, la verdadera palanca</h2>
      <ul>
        <li>
          <strong>Una habitación por persona o por pareja</strong>, cada una con su puerta y su
          llave: nadie se despierta cuando vuelve el último.
        </li>
        <li>
          <strong>Persianas que dejan la habitación totalmente a oscuras</strong>, incluso en
          pleno día: imprescindible para los equipos de noche y los pilotos que duermen entre
          dos relevos. Vea también{" "}
          <Link href="/es/blog/equipe-de-nuit-le-mans">nuestro artículo sobre los equipos de noche</Link>
          .
        </li>
        <li>
          <strong>Una casa en un barrio residencial tranquilo</strong>.
        </li>
      </ul>

      <h2>A la mañana siguiente</h2>
      <ul>
        <li>
          <strong>Rodaje regenerativo</strong>: 20 minutos de carrera muy lenta en el parque del
          Gué de Maulny, a 5 minutos a pie, o 20 minutos de elíptica si las piernas pesan.
        </li>
        <li>
          <strong>Movilidad</strong>: la misma rutina que la noche anterior, en versión corta.
        </li>
        <li>
          <strong>Nada de sesiones pesadas</strong> al día siguiente de una competición: la
          fuerza se retoma dos días después.
        </li>
      </ul>

      <h2>Ropa limpia para el día siguiente</h2>
      <p>
        Un torneo de dos días son dos juegos de equipaciones. La casa tiene{" "}
        <strong>lavadora y secadora</strong>: las camisetas del sábado están listas para el
        domingo.
      </p>

      <h2>Información práctica</h2>
      <ul>
        <li>
          El gimnasio, la sala zen y el jardín están incluidos en el alquiler de la casa
          entera. El detalle del material está en{" "}
          <Link href="/es/blog/salle-de-sport-privee-le-mans">
            nuestro artículo sobre el gimnasio
          </Link>
          .
        </li>
        <li>
          Estos consejos no sustituyen a los de su fisioterapeuta o su médico en caso de dolor
          o de lesión.
        </li>
        <li>
          Para entrenar durante la estancia, vea{" "}
          <Link href="/es/blog/entrainements-salle-de-sport-le-mans">
            nuestras sesiones, individuales o en grupo
          </Link>
          .
        </li>
      </ul>
      <ExerciseGuide locale="es" ids={["rowing", "band-external-rotation"]} />
    </>
  );
}
