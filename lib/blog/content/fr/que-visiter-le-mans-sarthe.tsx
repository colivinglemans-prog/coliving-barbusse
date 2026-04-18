import Link from "next/link";

export default function Article() {
  return (
    <>
      <p className="lead">
        Le Mans, c'est bien plus qu'un circuit automobile. Entre patrimoine médiéval classé,
        gastronomie sarthoise et nature préservée, la ville et sa région sont une destination
        idéale pour un week-end ou des vacances en famille. Voici les incontournables à ne pas
        manquer.
      </p>

      <h2>La Cité Plantagenêt, joyau médiéval du Mans</h2>
      <p>
        Classée parmi les plus beaux ensembles médiévaux d'Europe, la Cité Plantagenêt est le
        cœur historique du Mans. Ses ruelles pavées, maisons à colombages et remparts gallo-romains
        ont servi de décor à de nombreux films (Cyrano de Bergerac, Les Trois Mousquetaires, Le
        Bossu…).
      </p>
      <ul>
        <li>
          <strong>Cathédrale Saint-Julien</strong> : l'une des plus grandes de France, chef-d'œuvre
          gothique. Accès gratuit.
        </li>
        <li>
          <strong>Remparts romains</strong> : 3ᵉ siècle, parmi les mieux conservés du monde
          romain.
        </li>
        <li>
          <strong>Nuit des Chimères</strong> (juillet-août) : mise en lumière spectaculaire de la
          cité, gratuite et magique.
        </li>
      </ul>

      <h2>Le musée des 24 Heures du Mans</h2>
      <p>
        À côté du Circuit Bugatti, le musée retrace un siècle d'histoire de la course avec plus
        de 140 véhicules mythiques : Bentley, Ford GT40, Porsche 917, Peugeot 905, Audi R18…
        Incontournable pour les passionnés, intéressant même pour les néophytes.
      </p>

      <h2>L'Abbaye de l'Épau</h2>
      <p>
        Monument cistercien du 13ᵉ siècle à quelques kilomètres du centre, l'Abbaye de l'Épau
        accueille chaque année au printemps le prestigieux <strong>Festival de l'Épau</strong>{" "}
        dédié à la musique classique. Le parc est magnifique, idéal pour une balade en famille.
      </p>

      <h2>Visiter la Sarthe en famille</h2>
      <h3>Zoo de la Flèche</h3>
      <p>
        À 40 minutes du Mans, l'un des plus beaux zoos de France. Ours polaires, tigres,
        girafes, pandas roux, plus de 1 500 animaux dans un cadre naturel exceptionnel. Prévoyez
        la journée complète.
      </p>

      <h3>Le Village Préféré des Français : Asnières-sur-Vègre</h3>
      <p>
        À 30 minutes, un village médiéval classé, avec son pont roman, ses manoirs et ses
        fresques murales du 13ᵉ siècle. Promenade dépaysante garantie.
      </p>

      <h3>Le Lude et Poncé-sur-le-Loir</h3>
      <p>
        La vallée du Loir offre des châteaux remarquables et des villages pittoresques. Parfait
        pour une journée à vélo ou en voiture.
      </p>

      <h2>La gastronomie sarthoise</h2>
      <ul>
        <li>
          <strong>Rillettes du Mans</strong> : charcuterie emblématique, à déguster sur du pain
          de campagne avec un verre de Jasnières.
        </li>
        <li>
          <strong>Poulet de Loué</strong> : label rouge, reconnaissable à ses pattes jaunes.
        </li>
        <li>
          <strong>Marmite sarthoise</strong> : lapin, poulet, lard et champignons mijotés au
          Jasnières.
        </li>
        <li>
          <strong>Vins de la Sarthe</strong> : Jasnières et Coteaux du Loir, des blancs fins et
          minéraux souvent méconnus.
        </li>
      </ul>

      <h2>Où se loger au Mans pour un séjour famille ?</h2>
      <p>
        Pour un séjour en famille, la location d'une maison entière offre bien plus de liberté
        qu'un hôtel : cuisine pour cuisiner les produits du marché, espace pour les enfants,
        intimité pour chacun.
      </p>
      <p>
        Notre coliving de <strong>9 suites avec salles de bain privatives</strong> est idéal
        pour les familles élargies, réunions de famille ou séjours multi-générations. Salle de
        sport, espace zen et jardin pour occuper petits et grands.
      </p>

      <h2>Événements à ne pas manquer au Mans</h2>
      <ul>
        <li><strong>24 Heures Moto</strong> — avril</li>
        <li><strong>Grand Prix de France MotoGP</strong> — mai</li>
        <li><strong>Festival de l'Épau</strong> — mai-juin</li>
        <li><strong>24 Heures du Mans</strong> — juin</li>
        <li><strong>Nuit des Chimères</strong> — juillet et août</li>
        <li><strong>Le Mans Classic</strong> — juillet (années paires)</li>
        <li><strong>24 Heures Camions</strong> — octobre</li>
        <li><strong>Marathon du Mans</strong> — octobre</li>
      </ul>

      <h2>Préparer votre séjour</h2>
      <p>
        Que vous veniez pour les courses, le patrimoine ou la gastronomie, notre maison vous
        accueille à 10 minutes de la gare TGV Le Mans et au cœur de toutes les attractions.
        Consultez <Link href="/fr#disponibilite">nos disponibilités</Link> ou découvrez{" "}
        <Link href="/fr/chambres">les 9 chambres</Link>.
      </p>
    </>
  );
}
