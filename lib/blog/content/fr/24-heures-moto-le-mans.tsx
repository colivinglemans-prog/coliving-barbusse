import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Les 24 Heures Moto du Mans lancent la saison des grands événements au Circuit Bugatti.
        Plus intimiste que les 24h auto mais tout aussi intense, la course attire chaque année
        près de 100 000 spectateurs. Voici comment organiser votre séjour.
      </p>

      <h2>Quand ont lieu les 24 Heures Moto 2026 ?</h2>
      <p>
        L'édition 2026 se tient le week-end du <strong>18 et 19 avril 2026</strong>. Les essais
        commencent le jeudi, les qualifications le vendredi, et le départ de la course est donné
        le samedi à 15h. Le vrai défi : tenir éveillé toute la nuit pour voir le lever de
        soleil sur la piste dimanche matin.
      </p>

      <h2>Différences avec les 24h auto</h2>
      <ul>
        <li>
          <strong>Affluence plus raisonnable</strong> : ~100 000 spectateurs contre 300 000 en
          juin. Moins de bouchons, hébergements plus accessibles.
        </li>
        <li>
          <strong>Tarifs plus doux</strong> : les prix restent élevés mais 30-40 % en-dessous
          de ceux des 24h auto.
        </li>
        <li>
          <strong>Météo plus fraîche</strong> : prévoir un bon coupe-vent et des couches
          chaudes pour la nuit sur le circuit.
        </li>
        <li>
          <strong>Ambiance motards</strong> : l'esprit "clan" est très fort, le paddock est
          accessible et la parade du vendredi soir en ville est un incontournable.
        </li>
      </ul>

      <h2>Où dormir pendant les 24h Moto ?</h2>
      <h3>Camping officiel</h3>
      <p>
        Très prisé par les motards qui viennent avec leur machine. Ambiance festive, mais
        bruyante et humide en avril. Réservation recommandée dès janvier.
      </p>

      <h3>Location de maison ou Airbnb</h3>
      <p>
        Le meilleur choix pour un groupe d'amis. Vous avez une cuisine pour ne pas dépendre
        des restaurants bondés, et un vrai lit pour récupérer entre deux sessions sur le
        circuit.
      </p>

      <h3>Hôtels</h3>
      <p>
        Disponibilités plus faciles qu'en juin, mais à réserver avant mars pour avoir le
        choix. Privilégier Le Mans ville plutôt qu'Arnage (trop congestionné).
      </p>

      <h2>Notre maison : idéale pour groupes de motards</h2>
      <p>
        Si vous venez à plusieurs, notre maison de <strong>9 suites privatives</strong> au Mans
        offre tout ce qu'il faut :
      </p>
      <ul>
        <li>Stationnement gratuit dans la rue résidentielle calme</li>
        <li>15-20 min du Circuit Bugatti hors événement (45-60 min les jours de course)</li>
        <li>10 min à pied de la gare TGV + tram T1 direct vers le circuit (~30 min porte-à-porte, idéal pour éviter les bouchons)</li>
        <li>Cuisine équipée pour dîner ensemble après la course</li>
        <li>Salle de sport pour évacuer les courbatures</li>
        <li>Arrivée autonome dès 17h avec serrure connectée</li>
      </ul>

      <h2>Conseils pratiques</h2>
      <ol>
        <li>
          <strong>Arrivez jeudi ou vendredi</strong> pour profiter des qualifs et des
          animations en ville.
        </li>
        <li>
          <strong>Prévoyez bouchons d'oreilles</strong>, lunettes de soleil et protection
          contre la pluie (avril = météo imprévisible).
        </li>
        <li>
          <strong>Partez tôt pour le circuit</strong> le samedi matin (avant 10h), ou prenez
          le <strong>tramway T1</strong> depuis la gare du Mans (~20 min jusqu'à l'entrée
          Est du circuit) pour éviter les bouchons et le stress parking.
        </li>
        <li>
          <strong>Gardez une journée tourisme</strong> : Cité Plantagenêt, cathédrale
          Saint-Julien, musée des 24h du Mans.
        </li>
      </ol>

      <h2>Réserver votre séjour</h2>
      <p>
        Consultez les <Link href="/#disponibilite">dates disponibles</Link> pour les 24 Heures
        Moto 2026. Notre maison accueille jusqu'à 18 personnes, idéal pour les clubs et
        groupes d'amis motards.
      </p>
    </>
  );
}
