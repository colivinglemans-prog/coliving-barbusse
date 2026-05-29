import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Con la vuelta de la buena estación, nuestro jardín está listo para recibirle. Un espacio
        exterior privado de 90 m², totalmente cerrado y seguro, en pleno corazón de Le Mans: el
        lugar ideal para disfrutar de las largas tardes de verano en familia, entre amigos o en
        grupo.
      </p>

      <h2>Un jardín cerrado y totalmente seguro</h2>
      <p>
        El jardín está <strong>totalmente cerrado</strong>: un auténtico refugio, al abrigo de
        miradas y del tráfico. Es tranquilizador para las familias con niños pequeños, que pueden
        jugar fuera con total seguridad, y perfecto para los grupos que quieren un espacio privado
        solo para ellos. Orientado al <strong>sur pleno</strong>, disfruta del sol todo el día.
      </p>

      <h2>Un exterior pensado para reunirse</h2>
      <p>
        El jardín se ha acondicionado para acoger cómodamente a un grupo grande — igual que el
        interior de la casa, que aloja hasta 18 personas en sus 9 suites:
      </p>
      <ul>
        <li>
          <strong>Mobiliario de jardín para 8 personas</strong>: sofás y sillones para los
          aperitivos al sol y los momentos de relax.
        </li>
        <li>
          <strong>Grandes mesas para comer fuera hasta 20 personas</strong>: perfectas para las
          comidas de equipo, las cenas en familia o las barbacoas entre amigos.
        </li>
        <li>
          <strong>90 m² en total</strong>: 25 m² de plantas y una amplia zona con grava muy
          práctica.
        </li>
      </ul>

      <h2>Ideal para todo tipo de estancias</h2>
      <ul>
        <li>
          <strong>Familias</strong>: un espacio cerrado y seguro donde los niños juegan
          libremente mientras los padres se relajan.
        </li>
        <li>
          <strong>Grupos de amigos</strong>: aperitivos al sol, largas mesas y veladas agradables
          sin molestar al vecindario.
        </li>
        <li>
          <strong>Clubes y eventos del circuito</strong> (24 Horas, Le Mans Classic, MotoGP): el
          lugar para reunirse entre aficionados tras una jornada de carrera.
        </li>
        <li>
          <strong>Seminarios y estancias de empresa</strong>: un agradable entorno exterior para
          las pausas y las comidas de equipo.
        </li>
      </ul>

      <h2>A dos pasos del centro y del circuito</h2>
      <p>
        La casa está idealmente situada: a 10 minutos a pie de la estación de Le Mans (tranvía T1
        directo al circuito), a 20 minutos del Circuito Bugatti y muy cerca de la Cité
        Plantagenêt. Tras un día de visitas o de carrera, nada mejor que volver a casa para
        disfrutar del jardín.
      </p>

      <h2>Reserve su estancia</h2>
      <p>
        Disfrute del jardín y de toda la casa en su próxima estancia en Le Mans. Consulte nuestra{" "}
        <Link href="/es#disponibilite">disponibilidad en tiempo real</Link> y reserve
        directamente, sin comisión.
      </p>
    </>
  );
}
