# Pricing — Beds24, Beyond et moteur en simulation

> Référence détaillée du pricing (politique Beds24, relevés, moteur, page `/dashboard/pricing`) — complément de [CLAUDE.md](../CLAUDE.md), qui en résume les règles critiques. À lire avant de modifier ou d'expliquer le code de ce sujet.

## Pricing multi-canal (Beds24)

Politique tarifaire (juin 2026). Configurée **dans l'interface Beds24** (markup canal, mode de synchro,
Offers, fees) — pas dans le code. Le site n'affiche aucun prix en dur, il renvoie vers la booking page
Beds24.

**Principe (toutes commissions « incluses », payées par l'hôte — Airbnb 15,5% · Booking 17% ·
Abritel/VRBO 15%)** :
- **Le direct doit TOUJOURS être moins cher qu'Airbnb** (les voyageurs comparent depuis Airbnb).
  Garanti par : direct = grille canal × **0,93** (remise directe −7%) à toute durée/occupation. Net hôte
  direct 0,916 > Airbnb 0,845 → le direct est aussi plus rentable.
- **Markup par canal** (connexion canal) : Airbnb +0% (référence), Direct −7%, Booking/Abritel/VRBO/
  HomeToGo **+15%** (premium). Le prix de base vient de **Beyond Pricing** (≈522 base / 260 plancher /
  ~1576 pic 24h).
- **HomeToGo** (1re résa le 2026-10-17, n° 94822169) : multiplicateur réel **×1,2**. Le canal était en
  « Per Day Pricing » avec `Guests Included = 18` → un groupe de 16 payait le prix 9 pers. ; corrigé en
  **« Per Occupancy Pricing »**, Guests Included 9, Extra Person 0, remises natives à 0 (sinon double
  remise). Le linge n'était pas transmis. C'est **l'hôte qui encaisse** (carte vers Stripe, comme
  Abritel) et la taxe de séjour n'est pas collectée. Annulation **Custom 60/0** ; contrat de location
  publié en `public/conditions-location-hometogo.pdf` (« Rental Agreement PDF URL » du canal),
  source hors git dans `..\contrats\conditions-location-hometogo.md` (rendu `md2print.js` + Chrome
  headless). ⚠️ Médiateur de la consommation à nommer (obligatoire en B2C).
- **Mode « Occupancy Prices »** sur chaque canal (= interrupteur clé) : fait propager **à la fois** le
  tarif par occupation **et** les paliers durée vers Airbnb/Booking/VRBO. En « Per Day Prices », les
  canaux restent figés (1 prix/date).
- **Occupation** : `Price For = up to 9` + Extra Person **+10€/pers/nuit** (linéaire jusqu'à 20).
  Plafonds : Airbnb **16**, Booking 30, VRBO/Abritel 99, Direct 20.
- **Paliers durée** : via **Offers/rates avec min-stay** (PAS l'onglet « Discounts » qui est
  direct-only) → poussés à tous les canaux. Grille 4-6n −8% / 7j −10% / 28j −30% (Airbnb accepte les
  paliers perso). La remise directe −7% = discount **« referrer » direct-only** (non poussé) qui se
  cumule par-dessus.
- **Frais harmonisés** (identiques tous canaux, centralisés Beds24) : ménage **280 €**, linge
  **15 €/voyageur**. La remise directe ne doit **pas** s'appliquer à la ligne taxe (utiliser le type
  Upsell « obligatory % », pas « obligatory % tax »).
- **Taxe de séjour** : barème Le Mans = 2,75% (2,5%×1,10) **plafonné 4,40 €/pers/nuit**. ⚠️ Beds24 **ne
  sait pas appliquer le plafond** → ne PAS mettre 2,75% sur le direct (sur-collecterait au-dessus du
  plafond aux prix élevés + rendrait le direct plus cher qu'Airbnb qui plafonne). Garder un **forfait bas
  (~2,00-2,20 €/adulte/nuit)** : au prix fort on collecte moins que le dû et on absorbe la différence
  (assumé, garde le direct < Airbnb). Airbnb/Booking gèrent leur taxe plafonnée nativement. Le dashboard
  `/taxe-sejour` calcule le montant LÉGAL exact pour la déclaration (≠ montant collecté).

**Migration Airbnb → Beds24 (frais & remises actuellement configurés nativement sur Airbnb)** : ménage,
linge, frais voyageur supplémentaire ET réductions durée étaient réglés dans l'extranet Airbnb. Tout doit
migrer vers Beds24 (source unique). Propagation vers Airbnb :
- **Ménage** : poussé auto (champ cleaning fee). **Linge** : Airbnb le **fusionne dans le ménage** (pas de
  champ linge séparé). **Frais voyageur supp.** + **réductions durée** : poussés via mode Occupancy Prices.
- ⚠️ **Piège double-comptage** : ne jamais laisser un frais/remise actif **à la fois** sur Airbnb et dans
  Beds24. Ordre sûr : régler dans Beds24 → vérifier l'affichage Airbnb (devis test) → retirer le natif Airbnb.
- ⚠️ Prérequis : connexion Airbnb en **sync type « Prices & Availability »** (sinon les frais ne se poussent pas).
- Airbnb ne garde nativement que : collecte taxe de séjour (auto) + contenus (photos/description).

**Côté site** : badge « −7% en réservation directe » dans le calendrier public (clé i18n
`calendar.directDiscount`, 5 langues). **Détail complet (plan + config Beds24 + résultats vérifiés)** : [docs/refonte-pricing.md](refonte-pricing.md).

## Historique des prix et évaluation de Beyond (depuis le 2026-11-07)

Beds24 écrase chaque prix que Beyond lui pousse sans en garder trace. `lib/pricing/snapshot.ts`
relève chaque jour le calendrier (prix `price1`, séjour minimum, `numAvail`) sur **365 jours** —
la limite d'un appel Beds24, et aussi la fenêtre de réservation : au-delà, `numAvail` vaut 0
partout. Stockage Upstash, clé `pricing:snapshot:barbusse:{YYYY-MM-DD}`, sans TTL (~8 Ko/jour).
Première photo : **2026-11-07**. Une nuit qui passe de vendable à non vendable entre deux photos
est une vente (ou un blocage) ; son prix la veille est le prix affiché au moment de la vente.

`lib/pricing/weekly-report.ts` (pur, sans I/O) construit le rapport du lundi : prix modifiés par
distance à la nuit, nuits vendues et leur prix affiché, remplissage 30/90/180 j contre la semaine
précédente et l'an dernier à la même date (`bookedAt`), tarification des événements de
`LE_MANS_EVENTS` (× médiane du mois hors événement), réservations reçues. Les prix sont des
**nuits de base ≤ 9 pers., avant markup canal et frais** : ils se comparent entre eux, pas au
montant payé.

**Moteur de prix maison, en simulation** (depuis le 2026-11-07, décision Beyond le 2027-01-15) :
`lib/pricing/engine.ts` (pur, aucune écriture possible vers Beds24) applique la grille de
`lib/pricing/engine-config.ts` — fêtes et grands événements à prix fixe avec plancher, base ×
mois × jour, +5 % sur les événements mineurs, paliers d'anticipation, remise sur les trous plus
courts que le séjour minimum, plancher/plafond. Le cron `pricing-snapshot` calcule ses prix le même
jour que la photo et les stocke (`pricing:shadow:barbusse:{date}`) : on compare à ce qu'il **aurait
affiché ce jour-là**, même si la grille change ensuite. `lib/pricing/engine-comparison.ts` ajoute au
rapport du lundi la part des nuits ordinaires à ±10 % de Beyond (seuil de bascule : 80 %), l'écart
médian, les grands événements côte à côte et le prix moteur des nuits vendues dans la semaine.

**Page `/dashboard/pricing`** (admin, **interne** : bandeau « Simulation », aucun chiffre du moteur
dans `/dashboard/stats`). Verdict et tendance des lundis, courbe des nuits à venir (Beyond plein,
moteur tirets, bande ±10 %, vendues/bloquées, événements en bandeau, tap → détail de la nuit avec
raisons du moteur et prix vu par canal), cartes, grands événements avec leur **J-60**, évolution d'un
prix photo après photo, réservations de la semaine. Données : `GET /api/dashboard/pricing`
(`lib/pricing/dashboard-payload.ts`, pur) et `GET /api/dashboard/pricing/history?from&to`
(14 nuits max, réduit côté serveur). Les majorations par canal de `lib/pricing/channel-prices.ts` sont
une **copie datée** de Beds24, pas une source. La notification ntfy du lundi ouvre la page (`click`).
- ⚠️ **Ne jamais ajouter ces chemins à `allowedPaths`** de `proxy.ts` : la liste blanche les ferme au
  `viewer`, et `denyNonAdmin` garde les deux routes. Réservations projetées en liste blanche
  (`PricingBookingItem`), réponse `Cache-Control: private, no-store`.
- La page de connexion respecte désormais `?retour=` posé par le proxy (chemins `/dashboard/…`
  seulement) : avant, toute connexion menait au calendrier.
- **v1.1** :
  - navigation par fenêtres de 90 j (ou 365 j) ;
  - **réalisé de l'an dernier** en losanges violets, majorable de 0 à +20 % (affichage seulement,
    le moteur ne s'en sert pas). La nuit est comparée à J − 364 (même jour de semaine) ; un
    événement est comparé à son **édition précédente** par préfixe de clé
    (`lib/pricing/realized.ts`), car les dates bougent d'une année à l'autre ;
  - l'estimation du réalisé (brut − 280 − 15 €/pers., ÷ majoration **actuelle** du canal, − 10 €/pers.
    au-delà de 9) est un **ordre de grandeur**. HomeToGo et l'agence y comptent comme du direct,
    faute de canal brut dans `Booking` ;
  - les événements sont en ambre et portent leur nom, la bande ±10 % est un voile ardoise ;
  - le rapport sépare les **micro-ajustements** de Beyond (moins de 3 % **et** moins de 15 €, sa
    « visibilité ») des modifications réelles, et les médianes ne portent que sur ces dernières.
- **Semaine des essais 2027** (`test-24h-2027`, 31/05 → 06/06, `confirmed: false`) : le moteur la
  tarifie à 1 560 € de plancher, soit la parité avec l'option agence (1 430 € nets ÷ 0,916 en direct),
  choix de l'exploitant. `extendBefore: -1` fait commencer l'événement la nuit du premier jour.
