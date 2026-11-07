# Journal — Coliving Barbusse

Historique sorti de `CLAUDE.md` le 2026-11-07 : récits datés, justifications longues de
décisions passées, chiffres d'enquêtes ponctuelles, débogages résolus. Organisé sous les
mêmes titres de section que `CLAUDE.md`, dans l'ordre d'origine. **Chaque passage décrit
l'état au moment où il a été écrit** : la référence au présent est `CLAUDE.md`, qui renvoie
ici par `(historique : docs/journal.md § <section>)`.

Les factures, numéros de réservation et montants cités sont ceux qui figuraient déjà dans
`CLAUDE.md` (dépôt public) : n'ajouter ici ni secret, ni donnée personnelle de voyageur.

## Conventions

### Couleurs : tokens pour la marque, rampe brute pour l'information

Le rose Airbnb passe par les **tokens** du thème (`text-primary`, `bg-primary`,
`hover:text-primary-dark`, `border-border`, `bg-light-bg`) et non plus par `text-rose-500`, qui
en était une approximation (`#f43f5e` contre `#ff385c`) recopiée à sept endroits.

**Ce qui reste en Tailwind brut y reste, et ce n'est pas un oubli** : dans `StatsCards`,
`OccupancyGauge` et `RevenueProjection`, la couleur **est** l'information — émeraude / ambre /
rose disent un seuil d'occupation, rose et ambre séparent le réalisé du confirmé. Les sept
tokens sémantiques ne savent pas dire ça, et les y forcer effacerait une donnée. Les écrans
factures, taxe de séjour et fiscalité n'ont pas été normalisés : ils relèvent du lot suivant.

  Mécanique dans `@sejour/socle/lib/auth` — voir sa CLAUDE.md, section « Lot 1 ».
  **Un jeton illisible vaut `viewer`, jamais `admin`** : le `catch` de `getTokenRole`
  retombait sur `"admin"`, ce qui faisait d'un jeton invalide un passe-droit.

- **Deploy** : un `git push` sur `main` déploie la prod via l'intégration GitHub de Vercel (constaté le 2026-11-04, en moins d'une minute). `npx vercel --prod` reste possible en secours.

## Calendrier public de réservation

`components/public/ReservationCalendar.tsx` n'est plus qu'une enveloppe : le calendrier vit
dans **`@sejour/socle/components/ReservationCalendar`** depuis le Lot 5. Les deux sites en
avaient chacun leur copie, à 80 % identiques — mêmes huit états de case, même table de styles
chaîne par chaîne, même `fetchAvailability(force)`, même refetch au retour d'onglet gardé à
30 s, même modale Beds24 ; celle d'Albiez portait en en-tête « porté de celui du Mans ».

**Trois corrections arrivent avec le socle, et elles sont réelles :**

| Correction | Ce qu'il y avait | Conséquence |
|---|---|---|
| `sandbox` 3-D Secure sur l'iframe de paiement | un simple `allow="payment"` | La redirection vers la page 3-D Secure de la banque (`allow-top-navigation-by-user-activation`) était à la merci du navigateur. On n'apprend un refus au dernier écran que par le voyageur. |
| Plafonnement adultes / ados | aucun (`max={20}` et `max={17}` indépendants) | On pouvait composer **37 voyageurs** pour une maison de 20, et ne l'apprendre que sur la page de paiement. |
| `setAvail((prev) => …)` fonctionnel | `{...availCache}` capturé dans la closure | Deux réponses qui se croisent — changement de mois pendant un refetch de retour d'onglet — se fondaient sur la même photo d'avant, et la seconde écrasait la première. |

Deux détails d'affichage changent aussi, au bénéfice de la version d'Albiez : le bouton
« Effacer » est une pastille bordée et non un lien souligné, et il apparaît **aussi** quand
seule l'arrivée est choisie. Les deux chevrons de mois disaient « Photo précédente » à un
lecteur d'écran — ils empruntaient les libellés de la galerie ; `calendar.previousMonth` /
`calendar.nextMonth` ont été ajoutés dans les cinq dictionnaires, avec `calendar.close`.

⚠️ **Le moteur de sélection est sorti du composant** vers `@sejour/socle/lib/stay-selection`
(`isValidCheckIn`, `isValidCheckOut`, `cellState`, `selectionAfterClick`). C'est le chemin qui
produit le chiffre d'affaires direct : tant qu'il vivait dans un composant client, il n'était
vérifiable qu'à la souris. Il se teste maintenant sur une vraie réponse Beds24, sans
navigateur.

## Cloisonnement du dashboard

**La fuite fermée le 2026-09-11.** `/api/dashboard/bookings` n'avait aucun contrôle de rôle et
renvoyait l'objet Beds24 intégral. Mesuré en `viewer` sur
`?arrivalFrom=2025-01-01&arrivalTo=2026-06-30` : **73 clés et 37 `NUKI_PIN` avant, 15 clés et
0 après**. Les 37 PIN venaient de `data/bookings-archive.json` — 37 de ses 42 lignes en
portent un — et **pas** de l'API : Beds24 ne renvoie `infoItems` que si on les demande.

**Deux corrections, pas une.**

1. À la source : la fusion de l'archive dépouille les réservations archivées de leurs
   `infoItems` et `invoiceItems` quand l'appelant ne les a pas demandés — symétrie avec l'API,
   où ce qu'on n'a pas demandé n'est pas là. C'était dans `getBookings()` jusqu'au Lot 2,
   c'est maintenant dans `withArchive()` ([lib/bookings-archive.ts](lib/bookings-archive.ts)),
   appelé par `getBookingsWithArchive()` ([lib/bookings.ts](lib/bookings.ts)).
2. À la sortie : le DTO en liste blanche, qui protège aussi des champs que Beds24 ajoutera.

`nuki-code` et `invoices/prefill`, toutes deux admin-only), `findBookingByStripeIds` (matching

## Beds24 API (v2)

**Pourquoi un quatrième plutôt qu'élargir l'écriture.** `/bookings/messages` exige la variante
`-personal` des scopes, en lecture **comme** en écriture — mesuré le 2026-09-22 : le jeton
d'écriture, qui porte `read:bookings` + `write:bookings` mais pas `-personal`, reçoit
`401 Token not valid` sur `GET` comme sur `POST /bookings/messages`, là où le jeton de lecture
(qui a `read:bookings-personal`) lit le fil sans problème. Poser `write:bookings-personal` sur
le jeton des consignes de ménage lui aurait donné le droit d'écrire au voyageur pour rien.
Cette voie n'a **aucun repli** : un envoi qui dégrade silencieusement vers une autre voie
écrirait sous un autre privilège, ou échouerait en laissant croire que le message est parti.

**Pourquoi la page publique a le sien.** `/api/availability` est le point d'entrée le plus
exposé du site, et il ne consulte que l'inventaire. Le servir avec le jeton du dashboard
revenait à poser `read:bookings-personal` et `read:bookings-financial` là où arrive un visiteur
anonyme. Sur 401, le repli va vers le jeton de **lecture** — jamais vers l'écriture.

**Plus aucun long life token.** `BEDS24_API_TOKEN` a été retiré le 2026-09-11. Un long life ne
porte que des scopes read (limitation plateforme), ce qui force de toute façon un second jeton
pour l'écriture ; et sa durée de vie ne se laisse pas établir — celui d'avant, créé le 24/04,
affichait encore 90 jours restants 140 jours plus tard, alors que la documentation annonce
90 jours fermes. Un refresh token meurt après 30 jours sans usage, mais l'échéance glisse à
chaque échange, et le cron keepalive entretient les trois plutôt que de parier sur le trafic.

### Le transport et les types viennent du socle

[lib/beds24.ts](lib/beds24.ts) ne fait plus d'HTTP. L'échange des jetons, le cache d'access
tokens (marge de 60 s), les replis, l'écriture de note — y compris la subtilité du « 200 avec
`success: false` » — et la réexpansion des tranches de calendrier vivent dans
`createBeds24Client` (`@sejour/socle/lib/beds24-client`). Ne restent ici que les **noms des
variables d'environnement**, la traduction vers `Booking`, et les lectures propres à ce bien :
sold-out du blog, rapprochement Stripe, liste des propriétés.

Les replis sont **deux champs distincts, pas un drapeau** : `whenMissing` (variable non
définie) et `whenRefused` (jeton refusé, échange impossible ou 401). La voie publique a les
deux vers la **lecture** ; la voie de lecture n'en a aucun — sans elle, il n'y a rien à servir.

⚠️ **`expandSpans` itère en UTC**, et corrige un décalage d'un jour que portaient
`getDailyPrices()` et `getMinStay()` : elles faisaient `new Date(jour + "T00:00:00")` puis
`toISOString()`, soit minuit **local** relu en UTC. En production c'est sans effet — Vercel
tourne en UTC — mais en développement depuis Paris, le prix du 1er juillet était étiqueté
30 juin, ce qui décalait la projection « pricing dynamique » de tout le dashboard et du fiscal.

### `Booking` canonique, et `Beds24Booking` pour ce qui parle à l'API

Le type canonique est **`Booking`** (`@sejour/socle/lib/booking`), et c'est le modèle d'Albiez
qui l'emporte : l'archive ne porte plus la forme `Beds24Booking`, les deux sources se
traduisent vers un type commun. Champs requis : `ref`, `channel` (déjà normalisé), `arrival`,
`departure`, `nights`, `gross`, `net`, `commission`, `source` (`"live"` | `"archive"`).

Tout le reste est **optionnel**, et l'identité du voyageur (`firstName`, `email`, `phone`,
`country`…) l'est pour une raison précise : Albiez ne porte pas `read:bookings-personal`. Un
calcul du socle qui en dépendrait pousserait ce site à réclamer un scope dont il n'a pas
besoin.

Les types de transport (`Beds24Booking`, `Beds24InfoItem`, `Beds24InvoiceItem`,
`Beds24Property`) sont montés au socle eux aussi (`@sejour/socle/lib/beds24-types`) et
réexportés par [lib/types.ts](lib/types.ts) sous leurs noms d'origine. Ce n'est pas une
contradiction : c'est la distinction entre le modèle du domaine et le format de transport. Ce
qui a besoin d'`invoiceItems` ou d'`infoItems` — factures, taxe de séjour, commissions
fiscales, code Nuki, notifications d'arrivée — travaille sur la forme brute et doit continuer.

### Historique archivé (propriété "à la chambre" supprimée)

- **Corrections dans l'archive** (la propriété n'existe plus dans Beds24, on corrige le fichier) :
  `81056833` prix 182 → 160 € (remise manuelle de −22 € non répercutée dans `price`, paiement encaissé
  160 €) ; lignes de facture périmées retirées sur `80768054`, `82274645`, `80467451` (réservations
  modifiées dont l'ancien jeu de lignes cohabitait avec le nouveau). Après quoi `price = Σ lignes
  (+ commission Airbnb)` tient sur 59 lignes vendues sur 59.

- **Merge** : [lib/bookings-archive.ts](lib/bookings-archive.ts) (`ARCHIVED_PROPERTY_IDS`, `withArchive()`) sur le mécanisme générique `createArchive`
  (`@sejour/socle/lib/archive`) : dédup par `id`, **le live gagne**, on n'injecte que les résas
  archivées absentes du live et matchant les mêmes filtres (dates + statuts).
  Tant que la propriété existe, ses résas live écrasent les archivées (zéro doublon) ; une fois supprimée,
  l'archive prend le relais **sans changement de code**. Tous les consommateurs en héritent (stats classe
  310268 en `type:"room"`, fiscal garde `310268` dans `propertyIds` de `data/fiscal/2026.json`).

- ⚠️ **Le merge n'est plus dans `getBookings()`.** Il y était enfoui jusqu'au Lot 2, et un
  client d'API qui ajoute en silence des lignes que l'API n'a pas renvoyées rend fausse
  d'avance toute mesure de ce qu'il produit — c'est exactement ce qui a laissé 37 `NUKI_PIN`
  d'origine archivée traverser une route qu'on croyait ne servir que du live. Le placement
  d'Albiez, qui expose sa fusion à ses appelants, est le bon.

- **Ré-exécuter le backup** si de nouvelles résas 310268 apparaissent avant la suppression définitive.

## Dashboard stats (`/dashboard/stats`)

> **L'accueil du dashboard est le calendrier.** `/dashboard` est une redirection vers
> `/dashboard/calendar` ; les statistiques ont pris leur propre chemin, `/dashboard/stats`.
> C'est l'écran qu'on ouvre tous les jours qui accueille, pas celui qu'on montre à un banquier
> une fois par mois. Une redirection et non le calendrier rendu sur `/dashboard` : les chemins
> ouverts à `viewer` se lisent **par préfixe**, et `/dashboard` dans `allowedPaths` ouvrirait du
> même coup factures, fiscal et taxe de séjour.

> **Lot 3 — ce qui est parti dans `@sejour/socle`** : la ventilation du revenu dans le temps
> (`spreadRevenue`), le thème Recharts (`lib/chart-theme`) et la barre de navigation
> (`components/DashboardNav`). Ce qui reste ici est la **composition** : quels graphes,
> quelles cartes, dans quel ordre — c'est un choix par site, et le socle ne l'impose pas.
> Détail des modules : `CLAUDE.md` du socle, section « Lot 3 ».

> **Lots C + D (socle `v3.0.0`, 2026-09-13)** : la page des statistiques est le composant
> `@sejour/socle/components/StatsDashboard` (titre, sous-titre, accent `#FF385C`) et la route
> `app/api/dashboard/stats/route.ts` ne fait plus que fournir les séjours vendus, `unitsTotal = 1`
> (**l'unité est la nuit de maison** ; une nuit de chambre de l'époque pèse 1/9, posé par `toBooking`),
> l'événement du circuit comme repère et les avertissements à `computeDashboardStats`. « Tendance
> actuelle », « Pricing dynamique », fenêtres glissantes, triplets maison/chambre, camembert et huit
> composants ont disparu. Paramètres : `?period=currentYear|previousYear|rolling12m|all&mode=…`.
> L'accent des graphes est `#334155`, pas le rose du site : `#FF385C` est la couleur du canal Airbnb.
> Le fiscal ne lit les prix Beds24 que si `?projected=true` (`fiscalDeps(simulate)`).
> Détail et critère chiffré : `CLAUDE.md` et `docs/PROTOCOLE-TEST.md` du socle, sections « Lots C + D ».

> **Lot B de la convergence des stats (socle `v2.0.0`, 2026-09-13)** : le tri par statut se fait
> **une fois**, par `soldBookings()` en tête de route — `new` compte comme vendu (statut de
> rangement d'une résa OTA déjà confirmée), `request`, `inquiry`, `black`, `cancelled` jamais.
> Le brut se définit **une seule fois**, dans `toBooking` (`lib/beds24.ts`) : `price` moins la
> taxe de séjour lue dans les lignes de facture, commission par `commissionOf`, `units` = 1 pour
> la maison entière et 1/9 pour une chambre de l'époque (unité : la nuit de maison, depuis les Lots C+D). `getStays` demande toujours les lignes de facture, ce n'est plus un
> paramètre. La route porte sa garde `denyNonAdmin`. Mesuré : `period=fiscal` 77 246,92 →
> **76 024,50 €** (−404,72 d'`inquiry`, −817,70 de taxe), et **le même 76 024,50 €** sur la page
> fiscale — c'est l'invariant `INV-FISCAL-1` du protocole du socle. « Tendance actuelle » et
> « Pricing dynamique » disparaissent au Lot C, avec la charge utile unique.

- **La date de référence est celle de Paris, jamais `toISOString()`.** La route composait cinq
  dates par `toISOString()`, et deux étaient fausses depuis un fuseau à l'est de Greenwich :
  `new Date(annee, 0, 1).toISOString()` rendait le 31 décembre de l'année précédente (d'où un
  jour de trop dans `daysRemaining`), et la ventilation par nuit avançait un objet `Date` avec
  `setDate()` — heure locale — pour le relire avec `toISOString()` — UTC : la nuit du passage à
  l'heure d'été était comptée deux fois et la dernière du séjour perdue, **459,16 € basculant
  de mars à avril**. Sans effet sur Vercel, qui tourne en UTC ; faux en développement. La
  charge utile de `/api/dashboard/stats` est désormais **identique octet pour octet quel que
  soit le fuseau du serveur**, et c'est ce qu'on vérifie après y avoir touché.

- **StatsCards** (9 cartes, indicateurs standard du secteur). Les métriques par nuitée sont affichées **maison entière uniquement** (`SplitMetric.house`) ; l'API calcule toujours `global`/`house`/`room` (utilisés ailleurs, ex. tri `topBookings`).
  - **Revenus totaux** = CA brut (Σ `b.gross`, le `price` de Beds24 après traduction).
  - **Occupation moyenne** = taux calendaire **réalisé (YTD)** : nuits vendues ÷ nuits disponibles sur la partie *écoulée* de la période (`[from, min(to, today)]`, 9 chambres × jours). Corrige l'ancien biais qui excluait du dénominateur les mois sans réservation (taux gonflé) sans pour autant compter les mois futurs invendus. Helper `occupiedRoomNightsInWindow`.
  - **TJM** = revenu ÷ nuits *vendues* (prix moyen d'une nuit occupée).
  - **RevPAR** = TJM × taux d'occupation = revenu ÷ nuits *disponibles* (intègre les nuits vides, toujours ≤ TJM).
  - **Résas directes** = % des résas en direct (0 commission) ; sous-titre = part du CA correspondante.
  - **Occ. 90 j (à venir)** = occupancy on the books : occupation des 90 prochains jours déjà réservée. **Fetch dédié** `[today-30, today+90]` indépendant de la période sélectionnée, exclut `cancelled`/`black`.
- **RevenueProjection annuelle** :
  - Bloc "garanti" : réalisé + confirmé = total, avec barre progress
  - 3 scénarios : Minimum garanti / Tendance actuelle (TJM moyen) / Pricing dynamique (prix BeyondPricing × taux occupation)
  - Pricing dynamique via `getDailyPrices` (Beds24 `/inventory/rooms/calendar?includePrices`)
- **RevenueChart** : Recharts `ComposedChart` par mois — barres réalisé/prévu (axe gauche) + **ligne RevPAR mensuel** (axe droit violet). Grille, ticks, infobulle et légende viennent de `@sejour/socle/lib/chart-theme` (`CHART_GRID`, `CHART_AXIS`, `CHART_TOOLTIP_STYLE`, `CHART_LEGEND`, `chartAxisIn`) : la trentaine de props était recopiée d'un graphe à l'autre et divergeait déjà (rampe `gray` ici, `slate` chez Albiez). Les valeurs retenues sont celles d'Albiez. RevPAR mensuel = (réalisé + réservé) ÷ jours du mois (`MonthRevenue.revpar`).
- **BookingsTable** (2 tableaux) :
  - Réservations récentes : triées par **date de réservation** (`bookedAt`, l'horodatage `bookingTime` de Beds24) avec colonne "Réservée"
  - Meilleures réservations (TJM) : triées par TJM avec colonne **Événement** (badge indigo via `findEventForStay`)
  - Colonne "Type" supprimée (toujours maison)
- **ChannelPieChart** : revenus par canal (Airbnb, Booking, Abritel, Direct)
- **OccupancyGauge** : jauge circulaire de taux d'occupation

## Dashboard calendrier (`/dashboard/calendar`)

> **Lot 3 — le moteur monte, l'enveloppe reste.** `placeSegments` / `Segment` / `laneCount` /
> `roundedEnds` / `periodTooltip` / `PERIOD_PALETTE` vivent dans
> `@sejour/socle/lib/calendar-lanes`. L'algorithme de placement en lanes était écrit **deux
> fois en ligne** dans ce fichier — une fois pour les réservations, une fois pour les
> événements — puis regroupé par semaine par un troisième `useMemo` qui recalculait les mêmes
> bornes pour retrouver, par recherche linéaire, le segment qu'il venait de produire.
> `BookingCalendar.tsx` passe de **1 114 à 946 lignes**.
>
> **L'enveloppe n'est pas partagée, et c'est délibéré.** Les deux calendriers divergent sur ce
> qu'ils peignent (barres d'événements du circuit et rayures « non confirmé » ici, bandeaux de
> saison de station là-bas), sur leur popup (identité voyageur, partage, événement ici ; net,
> commission et surcollecte de taxe là-bas) et sur son ancrage (feuille modale mobile ici,
> carte absolue là-bas). Un composant à slots capable des deux serait plus difficile à lire que
> les deux composants qu'il remplacerait.
>
> **Le squelette des semaines est partagé depuis le socle `v3.7.0` (2026-10-02)** :
> `WEEK_GRID.row` / `.columnRule` / `.barsBlock`. Chaque semaine a son cadre permanent, avec un
> vide de 6 px entre deux cadres. Le cas qui l'a motivé : la semaine du 5 au 11 octobre 2026,
> où deux événements du circuit repoussaient la réservation contre les numéros 12 à 18.

- ⚠️ **Correction de rendu** : un séjour qui **part le 1er du mois suivant** s'affichait comme
  une pilule d'un seul jour posée sur sa date d'arrivée — la borne de fin se comparait à
  `new Date(year, mo, daysInMonth + 1)`, c'est-à-dire au 1er du mois suivant, et le jour retenu
  devenait « 1 ». Il court désormais jusqu'au bord droit du mois, sans arrondi, comme tout
  séjour qui continue. Aucune réservation de la fenêtre courante n'était concernée (0 sur 55).

  - ⚠️ **La pastille du jour se calculait par `toISOString()`** — donc en UTC. Entre minuit et
    2 h du matin à Paris l'été, elle se posait sur la veille. `formatDate` du socle compose la
    chaîne depuis `getFullYear` / `getMonth` / `getDate`.

  - **Un événement n'est pas une réservation, et ne se dessine pas comme elle.** Les deux étaient des pilules pleines à texte blanc, de hauteurs voisines (20 px contre 24), et l'indigo saturé pesait autant que le `#003580` de Booking juste en dessous. Pas d'aplat, texte coloré, trait fin : trois différences cumulées valent mieux qu'un écart de teinte, la lecture tenant alors aussi en niveaux de gris et pour un daltonien.

  - Le filet remplace l'arrondi comme signal de continuation : il **se retire de 3 px du côté où l'événement s'arrête vraiment** et file jusqu'au bord de la semaine quand il continue. C'est aussi ce qui sépare deux événements qui s'enchaînent (« Classic » puis « 24h Rollers » début juillet).
  - **Pas de demi-cellules pour un événement**, contrairement aux réservations : un événement occupe des journées entières, là où une résa libère la maison le matin de son départ. Un événement d'un seul jour — « Marathon », une réunion hippique — se réduirait d'ailleurs à rien si on lui retirait une demi-case de chaque côté.

- **Vacances scolaires et fêtes** : une rangée de filets **au-dessus des événements**. L'ordre se lit du plus large au plus précis en descendant — les bandes durent des semaines, les événements des jours, les séjours des nuits.
  - **Trois couleurs, et la zone B à part** : ambre pour les vacances de la **zone B (Le Mans)**, émeraude pour les zones A / C, rose pour les fêtes. C'est l'information utile au **ménage** : quand les écoles du Mans ferment, la personne qui vient nettoyer a ses propres enfants à la maison. Les vacances des deux autres zones remplissent le logement sans rien changer à sa disponibilité ; celles de la zone B, si. Les fêtes gardent le rose sans se poser la question — Noël et le Jour de l'An concernent les trois zones.
  - **Le test de zone lit `band.zones`, jamais `band.sources`.** Après l'absorption d'un week-end de bascule, `sources` contient la zone *sortante*, absente du libellé. Cas réel : février 2025, « Hiver A+C » a la zone B dans ses `sources` — lire `sources` aurait peint la bande en ambre et annoncé au ménage des vacances du Mans qui n'existaient pas.
  - **Pas de placement en lanes** : `bandesPeriodes` ne produit jamais deux bandes qui se chevauchent, une seule ligne suffit. C'est l'inverse des événements du circuit, qui peuvent être simultanés (« Le Mans Classic » et « 24h Rollers » début juillet) et réclament des lanes.
  - **Demi-cellules, comme les séjours** — et contrairement aux événements : une composition de zones prend effet à la moitié de son premier jour et cesse à la moitié du jour où elle change, d'où une fin portée au *lendemain* du dernier jour de la composition.
  - **L'émeraude est une divergence assumée avec Albiez**, où les vacances sont en indigo. Ici l'indigo est déjà la couleur du badge « Événement » dans les stats et la popup : la convention dépasse le calendrier, c'est aux vacances de céder. Les fêtes gardent le rose des deux tableaux de bord.
- **Filets de colonnes** : une couche hors flux (`absolute inset-0 grid grid-cols-7`) et non des bordures de cases. Une case ne couvre que la ligne des numéros : le trait s'arrêtait avant les barres et on ne pouvait pas aligner la fin d'un séjour sur son jour. Ce ne peut pas être des éléments de grille étendus sur `grid-row: 1 / -1` — le placement automatique refuse les cellules occupées et repousserait les sept cases en deuxième ligne. Placée *avant* les barres dans le DOM, la couche passe au-dessus des fonds de cases et en dessous des séjours, donc ne coupe aucune pilule. Hiérarchie : `gray-300` pour l'en-tête des jours, `gray-200` pour la grille.
- **Légende** : l'entrée « Événement circuit » s'affiche quel que soit le rôle. Les filets sont apparus dans la grille, ils doivent être nommés même en vue viewer, où les couleurs de canal sont masquées.
- **Réservations non confirmées** (`UNCONFIRMED_STATUSES` = `new`, `request`, `inquiry`) : **absentes de la vue viewer**, et en **ardoise rayée** (`#94a3b8` + hachures 45°) avec un marqueur `?` en vue admin, au lieu de la couleur du canal. Le planning du ménage doit dire les nuits vendues, pas les nuits peut-être vendues — quelqu'un qui se déplace pour une réservation qui n'a jamais existé s'est déplacé pour rien. Les rayures parce que la couleur seule ne suffit pas : le canal « Autre » est déjà en gris et la vue viewer peint tout en `#FF385C`. La popup explique le statut quand il n'est pas `confirmed`.

- **Options commerciales** (`HELD_STATUSES` = `black`) : **même sort que les non confirmées** — absentes de la vue viewer, ardoise rayée en admin — mais étiquetées **« OPTION »** au lieu de « ? ». Beds24 appelle `black` un blocage ; l'usage ici est commercial. L'option Spartner Travel du 31 mai au 14 juin 2027 est une affaire à 21 718 € sur les 24 Heures, saisie à la main pour tenir les dates pendant la négociation : ni une nuit vendue, ni une demande de renseignement.

- **Toggle admin/viewer** : bouton prévisualiser la vue viewer (comme /heating). `isAdmin` et `showChannels` sont des **dépendances du `useMemo` des barres** : ils décident quelles réservations entrent dans la liste et de quelle couleur. Ils manquaient, et basculer en « Vue viewer » gardait donc les barres du rendu précédent — les couleurs de canal restaient affichées.

### Vacances scolaires (`@sejour/socle/lib/periodes`)

Le module et sa donnée **ont quitté ce dépôt** : ils vivent dans `@sejour/socle`, qui remplace
la copie manuelle entretenue jusqu'ici entre Albiez et Le Mans. La regénération se lance
désormais depuis le socle (`node scripts/build-vacances.mjs [année_de_début]`). Ce qui suit
décrit ce que le calendrier du dashboard en fait ici.

- **Import direct dans le composant**, comme `LE_MANS_EVENTS` — pas via l'API. Albiez, lui,
  filtre au mois côté serveur. Ici le calendrier est déjà un composant client qui embarque
  ses données d'événements ; ajouter 15 Ko de JSON à un bundle de dashboard privé ne
  justifiait pas une route et trois props de plus.

**Une seule bande à la fois.** Peindre une barre par ligne de données donnait quatre barres
empilées la semaine de Noël (« Noël », « Noël A », « Noël B », « Noël C ») pour une seule
information : tout le monde est en vacances. `bandesPeriodes` parcourt le mois jour par jour,
fusionne les zones d'une même période dans le libellé, et ne coupe que là où la composition
change — c'est ce découpage qui porte l'information, le nombre de zones en vacances mesurant
la pression sur la demande.

**`zones` n'est pas `sources`.** `zones` porte les lettres des zones qui composent le libellé
affiché ; `sources` porte les périodes pour l'infobulle, zone sortante d'une bascule absorbée
comprise. Pour savoir si une zone donnée est en vacances sur la bande telle qu'elle
s'affiche — le test de la zone B ci-dessus — c'est `zones` qu'il faut lire.

**Le week-end de bascule ne produit pas de bande.** Les vacances durent seize jours du samedi
au dimanche et les zones démarrent de sept en sept : deux zones qui se relaient se chevauchent
*toujours* exactement deux jours, le dernier week-end de l'une étant le premier de l'autre. Ce
chevauchement ne dit pas que trois zones partent ensemble, il dit que l'une rentre quand
l'autre part — et il fabriquait une bande de deux jours coincée entre les deux vraies
(« PRINTEMPS A+B+C » les 18-19 avril 2026, entre « A+B » et « B+C »). `fusionnerBascules` la
donne à la bande suivante, qui démarre au samedi de bascule. Sur 2025-2028 cela retire cinq
bandes, toutes samedi→dimanche. Le test est **étroit à dessein** — au plus deux jours, deux
voisines contiguës de même type, une composition sur-ensemble *strict* des deux — pour qu'un
« ASCENSION A+B+C » d'un seul jour, dont le ministère ne publie que la date de début
(`finNonPubliee`), y survive. Les périodes absorbées restent dans `sources` : le libellé
simplifie, l'infobulle dit toute la vérité, zone sortante comprise.

### Notes internes (ménage, infos)

- API : `POST /api/dashboard/bookings/[id]/notes` (admin only via JWT) → `updateBookingNotes()` dans [lib/beds24.ts](lib/beds24.ts) utilise le **refresh token** (`BEDS24_REFRESH_TOKEN`) car les long life tokens Beds24 ne supportent pas `write:bookings`.

### Envoi des messages arrivée / départ depuis le calendrier

**Les « Mail & Actions » de Beds24 ne sont pas dans l'API.** La spec complète
([api.beds24.com/v2/apiV2.yaml](https://api.beds24.com/v2/apiV2.yaml)) ne liste que
`authentication/*`, `bookings`, `bookings/messages`, `bookings/invoices`, `inventory/*`,
`accounts`, `properties*`, `channels/*`, `organizations/users`. Impossible de lire l'id d'une
auto-action, son statut (`sent` / `waiting until due` / `expired`) ou de déclencher son
« Send Now ». Le `actions` de `POST /bookings` (`notifyGuest`, `notifyHost`…) est autre chose.
**Ne pas repartir en quête de cet endpoint : il n'existe pas.**

**D'où la reconnaissance par le texte.** L'état des boutons se relit dans
`GET /bookings/messages?bookingId=…`, pas dans un registre local. C'est la seule source qui
voie aussi les envois des auto-actions restées actives — vérifié sur la réservation 90939710 :
« Before arrival - Send Nuki PIN » due à 17:52 → message id 167207957 à 15:52 UTC. Un registre
maison les ignorerait et le bouton resterait vert après un envoi automatique.

`detectGuestMessageKind()` dans [lib/guest-messages.ts](lib/guest-messages.ts) compare le texte
normalisé (minuscules, sans diacritiques — les auto-actions envoient « Le depart approche »
sans accent) à deux jeux d'empreintes par famille : l'en-tête de bienvenue des gabarits Beds24
(« Bienvenue au Coliving », « Welcome to Coliving ») et le libellé du code des nôtres
(« Votre code d'accès à la porte » et ses 4 traductions). Seuls les messages `source: "host"`
comptent, et le fil arrivant du plus récent au plus ancien, le premier vu est le dernier envoi.

⚠️ **Ne jamais reprendre l'URL du guide comme empreinte.** C'était le premier choix — une
seule ligne couvrait les 5 langues. Mesuré contre le fil réel : la réservation 92941610 porte
un message écrit à la main (« You can check on our arrival guide… » + le lien) qui passait
pour un envoi d'arrivée. Or l'arrivée, c'est le PIN, pas le lien : le bouton se serait grisé
sans que le code soit parti. Beds24 n'a de gabarit d'arrivée qu'en **FR et EN** à ce jour ; en
ajouter un dans une autre langue oblige à poser son en-tête dans `SIGNATURES`.

**Cohabitation assumée** : les auto-actions « Before arrival - Send Nuki PIN » et
« Before checkout » restent actives côté Beds24. Les boutons servent à **avancer** un envoi,
pas à le remplacer. Si un gabarit est modifié dans Beds24, vérifier que son empreinte tient
encore dans `SIGNATURES` — sinon le bouton redevient cliquable et le voyageur reçoit deux fois.

## Événements Le Mans (`lib/events.ts`)

**Deux champs sont apparus au Lot 5, et l'un remplace une jointure fragile :**

| Champ | Ce qu'il remplace | Pourquoi |
|---|---|---|
| `key` | la jointure par **nom** de `getEventByName` | Un nom est de l'affichage : il se corrige, il finira par se traduire, il n'a rien à faire en clé étrangère. Sept réunions hippiques portaient d'ailleurs le même nom, donc la même « clé ». Les cinq articles à événement ont migré (`24h-mans-2027`, `24h-moto-2027`, `classic-2027`, `mondial-karting-2026`, `24h-camions-2026`). |
| `confirmed` | le suffixe « (à confirmer) » **dans le nom** | Il fallait le reconnaître par sous-chaîne pour afficher le « ? » du calendrier. C'est désormais un champ, et c'est lui qui autorise l'émission du JSON-LD `Event`. Les deux dernières projections sont passées à `true` le 2026-10-01, et **toutes deux étaient fausses** : `24h-moto-2027` projeté au 16-19 avril, officiel au **8-11 avril** (ACO, 29/09) ; `motogp-2027` projeté au 7-9 mai sur la foi des revendeurs, officiel au **14-16 mai** (Dorna, 25/09). Une projection ne sert qu'à se souvenir de vérifier. |

**Trois champs de plus depuis le socle v3.2.0**, optionnels et renseignés seulement sur les
entrées reliées à un article : `organizer` (l'organisateur **véritable** — `ACO`, une
constante du fichier, ou Peter Auto pour le Classic — jamais nous), `performer` (le plateau :
FIA WEC, FIM EWC, FIA ETRC, FIA Karting) et `tickets` (la billetterie officielle et son prix
d'entrée, jamais notre maison ; à retirer si l'épreuve est complète, le nœud affirme
`InStock`). Ce sont les champs `organizer`, `performer` et `offers` du nœud `Event` que la
Search Console réclamait le 2026-09-13. Sans billetterie ouverte (24h du Mans 2027, Classic
2027), `tickets` reste absent et Google garde son avertissement « offers manquant » — on ne
déclare pas une vente qui n'existe pas.

`tickets.validFrom` (jour d'ouverture de la billetterie, `YYYY-MM-DD`) est à renseigner avec
chaque `tickets` : la Search Console le réclamait le 2026-09-25 (« validFrom manquant dans
offers »). Il se lit dans le communiqué d'ouverture de l'organisateur (newsroom.lemans.org),
jamais deviné. **Vérifier l'année de la source d'un tarif** : les 12 € du Mondial Karting KZ
2026 venaient d'un article lemans.org de 2015, alors que l'édition 2026 était en accès
gratuit — `tickets` a été retiré de l'entrée.

La **commune** n'est pas portée par les entrées : tout le catalogue se passe au Mans, et elle
est fournie une fois pour toutes à `eventJsonLd` par la page d'article.

Les fonctions, désormais dans le socle et appelées avec le catalogue en premier argument :

- `findEventForStay(catalog, arrival, departure, { marginDays })` — rend **l'événement**, plus
  seulement son nom. Marge de 2 jours par défaut, et entre plusieurs candidats c'est celui dont
  les dates **exactes** recouvrent le plus de nuits qui gagne. Utilisé par les stats et par la
  popup du calendrier de tableau de bord, qui prennent son `.name`.
  - ⚠️ **Les deux helpers de date locaux étaient déjà partis dans `@sejour/socle/lib/dates`.**
    Le `addDays` d'ici composait minuit en heure locale, avançait en heure locale, puis relisait
    le résultat par `toISOString()` — en UTC. Depuis Paris, la fenêtre étendue d'un événement
    reculait d'un jour, et un séjour rattrapé de justesse changeait d'étiquette selon le fuseau
    de la machine : « SWS Karting Finals 2026 » sur Vercel, aucun événement en développement,
    pour la même réservation (id 85565041).
- `findEventOnDay(catalog, day)` — l'événement qui couvre ce jour, sans marge.
- `findEventByKey(catalog, key)` — remplace `getEventByName`.
- `stayWindow(event, { before, after })` — remplace `stayWindowForEvent`, dont les marges
  étaient figées à −1 / +1. Les défauts donnent exactement l'ancien résultat.
- `eventJsonLd(event, place, article?)` — **nouveau ici** : le nœud `Event` de schema.org, que
  ce site n'émettait pas alors qu'il avait la donnée sous la main. Rend `null` tant que les
  dates ne sont pas officielles : on ne déclare pas une date supposée à Google, qui
  l'afficherait comme un fait dans un résultat enrichi. Le test est dans le socle, avec le
  champ qui le commande, pour qu'aucun appelant ne l'oublie. Depuis v3.2.0, la page lui passe
  aussi `{ description: loc.description, imageUrl }` — la description de l'article dans la
  langue de la page et sa couverture en URL absolue : le socle ne connaît pas l'i18n.

### Délier une réservation d'un événement

Le rattachement est une **heuristique de dates**, et elle se trompe : une semaine de chantier
qui mord sur le week-end des 24 Heures se retrouve étiquetée « 24h Mans », ce qui fausse le
repère des statistiques autant que la lecture du calendrier. La popup du calendrier porte donc
une **croix à côté du nom de l'événement** ; elle écrit un démenti, et le démenti gagne
toujours sur l'heuristique.

- **Ce qui est stocké est le couple `<id de réservation>:<clé d'événement>`**, jamais le seul
  identifiant : la croix dit « cette réservation n'a rien à voir avec *cet* événement », et
  c'est tout ce qu'elle dit. Délier ne fait **pas** repêcher le candidat suivant — une
  réservation déliée n'a plus d'événement, jusqu'à ce que le catalogue bouge.
- **Redis (`event-links:unlinked`, un `SET`) et non Beds24.** La note interne est le seul champ
  qu'on sache écrire chez Beds24, et elle est lue par la personne du ménage : y cacher un
  marqueur technique la salirait. Surtout, **42 lignes de l'historique n'existent plus dans
  Beds24** et doivent pouvoir être déliées comme les autres. Variables `KV_REST_API_URL` /
  `KV_REST_API_TOKEN`, celles du chauffage et des crons.
- **Échec ouvert à la lecture, franc à l'écriture.** Redis injoignable ⇒ aucun déliement lu,
  donc l'étiquetage d'origine : on préfère une étiquette de trop à un calendrier qui ne
  s'affiche pas. À l'écriture, la route rend **503** plutôt que d'annoncer un enregistrement
  qui n'a pas eu lieu.
- **Une seule fonction tranche** : `eventForStay(bookingId, arrival, departure, unlinked)`
  dans [lib/events.ts](lib/events.ts). La route des stats l'appelle pour son `markerOf` ; la
  popup appelle `findEventForStay` **sans** le filtre, pour afficher l'événement démenti barré
  et offrir « Rétablir » — un clic malheureux se rattrape sur place.
  `POST` / `DELETE /api/dashboard/bookings/[id]/event-link` sont **admin only** — délier change
  des nombres que le `viewer` ne voit pas. Les deux verbes sont idempotents (`sadd` / `srem`).
- `eventLinkRef(bookingId, eventKey)` vit dans [lib/events.ts](lib/events.ts) et non dans
  [lib/event-links.ts](lib/event-links.ts) : le calendrier est un composant client, lui faire
  importer le module de stockage embarquerait le client Upstash dans le bundle du navigateur.

## Blog : CTA de réservation sur les articles d'événement

Il existe parce que le contenu seul ne convertissait pas : le seul chemin vers la
réservation était un lien texte noyé dans le dernier paragraphe, puis retour sur la home,
re-scroll jusqu'au calendrier et ressaisie des dates.

> **Lot 5 — le comportement est monté dans `@sejour/socle/components/EventBookingCTA`.** Ne
> restent ici que l'identifiant Beds24, la route `/api/availability`, le séjour minimum par
> défaut et les libellés dans cinq langues. Le composant prend maintenant **l'événement** et
> calcule lui-même sa fenêtre de séjour.
>
> ⚠️ À ne pas confondre avec l'`EventBanner` d'Albiez, monté au socle lui aussi : la bannière
> est un composant **serveur** qui répond à « quand est la prochaine édition » ; ce CTA est
> **client** et interroge la disponibilité en direct pour répondre à « la maison est-elle
> libre ». Les deux coexistent sur une même page et ne doivent pas être fusionnés.

- Un événement dont les dates ne sont pas officielles (`confirmed: false`) garde son CTA —
  la maison est libre ou ne l'est pas, la question ne dépend pas de la FIM — mais **n'émet
  aucun nœud JSON-LD `Event`**, et depuis le socle v3.3.0 le bloc **dit que les dates sont
  prévisionnelles** (`COPY[locale].provisionalDates`, une phrase qui se tient seule, y compris
  dans l'état complet où aucune date n'est affichée). Aucun article n'est dans ce cas depuis
  le 2026-10-01 : les 24 Heures Moto 2027 et le MotoGP 2027 ont leurs dates officielles, et
  l'article MotoGP a reçu son `event` — il en était privé tant que deux dates rivales
  circulaient. La phrase est formulée sans nommer l'organisateur pour servir tout futur cas.

## Factures PDF (LMNP)

### Le réglementaire vient du socle (Lot 4)

**⚠️ La clé du compteur a changé.** `invoice:counter:{année}` est devenue
`invoice:counter:barbusse:{année}`, pour qu'une seconde entité branchée sur le même Upstash
ne partage pas la série. `invoice:counter:2026` valait **13** au moment de la bascule : le
socle **reprend** cette valeur au premier numéro attribué (`legacyKey`), et la série continue
à `2026-014`. Sans cette reprise, elle serait repartie à `2026-001` et aurait réémis treize
numéros déjà utilisés. Le paramètre `legacyKey` de `lib/invoice-number.ts` pourra être retiré
une fois 2026 close.

**Le prestataire de paiement se nomme dans `lib/stripe.ts`.** `StripePaymentDetail` porte
désormais un champ `method` (« Carte bancaire via Stripe »), que le socle exige sans le
deviner. `beds24StripeToPayload` et `stripeToPayload` s'appellent maintenant
`beds24PaymentToPayload` et `paymentToPayload`.

**Les clés du barème de taxe de séjour ont été renommées** dans la réponse de
`/api/dashboard/taxe-sejour` : `city` → `collectivite`, `ratePercent` → `tauxPourcent`,
`capPerPersonNight` → `plafondParPersonneNuit`, `departmentalRegionalRate` →
`tauxDepartemental`. Aucune valeur ne change, et aucun composant ne lisait ces clés.

### Réservation payée sur une plateforme (socle v3.5.1+)

numéro de la plateforme (`apiReference`). Avant, toute réservation
Beds24 arrivait « à payer » et la facture réclamait un virement à un voyageur qui avait payé.

### Taxe de séjour sur la facture (socle v3.6.0)

  montant − taxe**, puis TVA 0 %, puis « Taxe de séjour », puis Total TTC (inchangé). Avant,
  la taxe était fondue dans « Location saisonnière » et comptée en HT.

## Dashboard Fiscalité LMNP / LMP (`/dashboard/fiscal`)

> **Depuis le Lot B (socle `v2.0.0`, 2026-09-13), la page lit le `Booking`, plus les lignes de
> facture.** Le CA « reconstitué depuis les `invoiceItems` » rendait un **net** pour Airbnb — les
> lignes sont le versement hôte, la commission n'y figure jamais — et un brut pour les autres :
> 3 884,19 € d'écart avec la page de statistiques sur le même jeu. `lib/fiscal.ts` fournit
> `fetchStays: getStays(...).then(soldBookings)`, le module du socle lit `gross` et `commission`.
> Commissions 2026 : 0 → **9 541,59 €** (7 649,57 réalisées + 1 892,02 à venir, même prorata de
> nuits que le CA). **Le défaut est contractuel** (réalisé + confirmé) ; la simulation d'année
> pleine — mot pour mot la « Tendance actuelle » bannie des stats — ne s'obtient que par
> `?projected=true`, et l'écran ne l'expose pas. Effet à connaître : le conseil « micro-social si
> recettes < 77 700 € » se compare désormais au contractuel (77 368,85 € au 2026-09-13) et
> basculera à mesure que le carnet se remplit. Le bien manuel « Dahlias » n'entre dans aucun
> invariant. Dette : Abritel n'apparaît pas sur `/dashboard/taxe-sejour` (la route ne garde que
> Direct, Airbnb, Booking.com) ; la réponse fiscale ne porte pas le mode projeté.

> **Socle `v3.8.1` (2026-11-07) — le taux d'occupation est désormais réalisé.** `occupancyRatio`
> = nuits réalisées ÷ jours observés (1er janvier → aujourd'hui, bornes incluses) ; le carnet à
> venir n'y entre plus, la nuit du 31/12 d'un séjour à cheval est comptée. Effet mesuré en local
> le 2026-11-07 sur 2026 : **38,7 % → 35,4 %**, CA réalisé, à venir, commissions et BIC
> inchangés. Exercice futur (`?year=2027`) : plus rien n'est « réalisé » — ce qui l'était à tort
> (1 360,67 €, les nuits de janvier d'un séjour arrivé le 31/12) passe en « à venir », taux 0,
> total et BIC identiques ; `commissionsProjected` = commissions connues. `ecartDeCollecte`,
> corrigé dans la même version, est ré-exporté par `lib/taxe-sejour.ts` mais **utilisé nulle
> part** ici : aucun effet sur `/dashboard/taxe-sejour`.

### Extraction CA brut depuis Beds24 (important)

Le CA à déclarer fiscalement en LMNP est le **brut** (avant déduction des commissions Airbnb/Booking). Beds24 retourne un champ `price` dont la sémantique varie (net ou brut) selon la config, donc le moteur fiscal reconstruit le CA depuis les `invoiceItems` :

- **Inclus dans le CA** : toutes les lignes positives ET négatives (remises) qui ne sont **ni taxe**, **ni commission**, **ni info**
- **Exclu du CA** :
  - Taxes de séjour / additionnelles (regex `\btax(es?)?\b` — collectées/reversées par plateforme)
  - Commissions (`Host Fee`, `commission`, `service fee`, `channel fee`, `platform fee`) — traitées séparément comme charge
  - Lignes informatives (`Expected Payout`, `Total`, `Balance`, `Grand Total`)
- **Fallback** : `b.price` si `invoiceItems` absent (résa directe ancienne sans détail)

Exemple résa Airbnb (83154502) : Base 2 550 + Linen 160 + Cleaning 350 = **3 060 € CA**, Host Fee **−569,16 € commission**, taxes 43,82 € exclues.

Exemple résa Direct (85615323) : Σ(daily rates) + Ménage 250 + Draps 140 **− Réduction RD −677,02 €** (incluse car remise commerciale non-commission, non-taxe).

### Configuration par année (`data/fiscal/YYYY.json`)

```json
{
  "annee": 2026,
  "biens": [
    {
      "id": "barbusse",
      "nom": "Coliving Barbusse",
      "source": "beds24",
      "propertyIds": [303771, 310268],
      "classeMeubleTourisme": false,
      "amortissementAnnuel": 25800,
      "amortissementsReportes": 38007,       // Stock ARD début exercice
      "chargesDeductibles": {
        "interetsEmprunt": 4400,
        "taxeFonciere": 1400,
        "assurance": 4600,                   // PNO + assurance prêt
        "cfe": 400,
        "fraisComptable": 800,
        "entretien": 2000,
        "chargesCopro": 0,
        "autres": 0                          // NE PAS y mettre les commissions (auto depuis Beds24)
      }
    },
    {
      "id": "dahlias",
      "nom": "Appartement Dahlias (vendu)",
      "source": "manuel",
      "caHT": 1344.35,
      "vendu": true,
      ...
    }
  ],
  "constantes": {
    "seuilSSIMeubleTourisme": 23000,
    "tauxPrelevementsSociaux": 0.172,
    "tauxSSIEstime": 0.40
  }
}
```

## Cron Jobs (via cron-job.org)

### Keepalive Beds24 (refresh token)

4 h, hors cache — c'est l'échange qui repousse l'échéance, pas la lecture d'un access token
encore valide gardé en mémoire. Aucun des quatre ne s'entretient seul de façon fiable :

- **écriture** : ne sert qu'aux consignes de ménage, bien trop rare.
- **lecture** : le dashboard n'est ouvert que par intermittence, et le cache de 60 s des
  réponses espace encore les échanges.
- **publique** : on pourrait la croire entretenue par le trafic, mais une saison creuse ne
  prévient pas.
- **messagerie** : deux boutons cliqués de loin en loin. Sa mort ne se voit qu'au moment
  précis où l'on veut écrire au voyageur — c'est-à-dire trop tard.

Les quatre sont tentés même si le premier échoue — un jeton mort ne doit pas en entraîner un
second — et chaque échec déclenche une alerte ntfy (`sendBeds24Alert`) nommant les scopes
exacts à régénérer pour cette voie-là.

lecture prend le relais : le tunnel continue de fonctionner, en ayant reperdu la séparation des
privilèges, sans que rien ne le signale à l'écran. Seul le keepalive rend cette dégradation
visible. C'est sa vraie raison d'être, plus encore que l'expiration.
