import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Barra olímpica, discos bumper, suelo amortiguador, remo Concept2, balón medicinal, cajón
        y barra de dominadas: todo lo necesario para un WOD está en{" "}
        <Link href="/es/blog/salle-de-sport-privee-le-mans">el gimnasio de la casa</Link>
        . Si practica cross-training (o CrossFit en su box habitual), no perderá el ritmo
        durante su estancia en Le Mans. Aquí tiene el material y seis WOD pensados para este
        gimnasio, solo o en equipo.
      </p>

      <h2>El material de un box, en casa</h2>
      <ul>
        <li>
          <strong>Halterofilia</strong>: barra olímpica de 20 kg, 165 kg de bumpers (185 kg con
          la barra), cierres, cinturón.
        </li>
        <li>
          <strong>Un suelo de losetas de caucho de 20 mm</strong>: se suelta la barra por
          encima de la cabeza o después de un peso muerto, como en un box.
        </li>
        <li>
          <strong>Gimnásticos</strong>: barra de dominadas y barras de fondos en la jaula.
        </li>
        <li>
          <strong>Monoestructurales</strong>: remo Concept2, comba, bicicleta elíptica.
        </li>
        <li>
          <strong>Funcionales</strong>: balón medicinal de 6 kg, cajón de madera regulable de 20
          a 50 cm, mancuernas cargadas con discos de hierro, polea.
        </li>
      </ul>
      <p>
        Lo que no hay: ni anillas, ni kettlebells, ni cuerda para trepar, ni assault bike. Los
        WOD de abajo no los necesitan.
      </p>

      <h2>Seis WOD para este gimnasio</h2>

      <h3>1. «Barbusse» — For time, individual</h3>
      <p>21-15-9 repeticiones de:</p>
      <ul>
        <li>Thrusters con barra (carga moderada)</li>
        <li>Dominadas</li>
      </ul>
      <p>Después, 500 m de remo. Tiempo límite: 15 minutos.</p>

      <h3>2. AMRAP de 20 minutos</h3>
      <ul>
        <li>250 m de remo</li>
        <li>15 thrusters con balón medicinal</li>
        <li>10 box jumps (50 cm, o step-ups)</li>
        <li>5 dominadas</li>
      </ul>

      <h3>3. EMOM de 16 minutos</h3>
      <ul>
        <li>Minuto impar: 3 power cleans (cargadas de potencia), pesadas pero limpias.</li>
        <li>Minuto par: 12 calorías en el remo.</li>
      </ul>

      <h3>4. Fuerza y después metcon</h3>
      <ul>
        <li>
          <strong>Fuerza</strong>: back squat 5-5-3-3-1, subiendo hasta una carga pesada del
          día.
        </li>
        <li>
          <strong>Metcon</strong>: 3 rondas de 400 m de remo, 15 fondos y 50 saltos de comba.
        </li>
      </ul>

      <h3>5. En pareja, «you go, I go»</h3>
      <p>
        10 rondas compartidas: el compañero A rema 250 m mientras B sostiene la barra en la
        posición alta del peso muerto; luego se cambian. Después, 50 thrusters con balón
        medicinal repartidos como se quiera.
      </p>

      <h3>6. Team WOD, de 4 a 8 personas</h3>
      <p>
        Una sola barra, un solo remo, un solo cajón: el equipo se reparte 2000 m de remo, 100
        thrusters con balón medicinal, 80 box jumps, 60 pesos muertos y 40 dominadas, en el
        orden que quiera, con una sola persona por estación cada vez. El cronómetro se para
        cuando todo está hecho. Los demás animan.
      </p>

      <h2>Las buenas prácticas</h2>
      <ul>
        <li>
          <strong>Calentamiento</strong>: 5 minutos de remo, movilidad con la pica y, después,
          la barra vacía para los movimientos de halterofilia.
        </li>
        <li>
          <strong>Cargas adaptadas</strong>: en cross-training, la técnica va antes que el
          cronómetro. Nadie le supervisa: reduzca la carga o las repeticiones si hace falta.
        </li>
        <li>
          <strong>Solo los bumpers</strong> para soltar la barra; el hierro y las mancuernas se
          dejan en el suelo con cuidado.
        </li>
        <li>
          <strong>Los menores</strong> entrenan con un adulto.
        </li>
        <li>
          <strong>Recoger</strong> barras, discos y cajón después de la sesión.
        </li>
      </ul>

      <h2>Después del WOD</h2>
      <p>
        Ducha en la propia habitación, comida en la gran mesa y unos minutos de estiramientos
        en la sala zen. Vea{" "}
        <Link href="/es/blog/recuperation-apres-effort-le-mans">nuestra rutina de recuperación</Link>{" "}
        y, para sesiones más clásicas,{" "}
        <Link href="/es/blog/entrainements-salle-de-sport-le-mans">
          nuestros entrenamientos individuales o en grupo
        </Link>
        .
      </p>

      <h2>Información práctica</h2>
      <ul>
        <li>
          La casa se alquila entera: 9 habitaciones con baño con ducha, hasta 20 personas.
          Ideal para un fin de semana de box entre amigos o una concentración de club.
        </li>
        <li>El gimnasio está reservado a su grupo durante toda la estancia.</li>
        <li>
          Estación de TGV a 15 minutos a pie, a unos 55 minutos de París.
        </li>
      </ul>
      <ExerciseGuide locale="es" ids={["thruster", "pull-up", "rowing", "medicine-ball-thruster", "box-jump", "power-clean", "back-squat", "dips", "jump-rope", "deadlift"]} />
    </>
  );
}
