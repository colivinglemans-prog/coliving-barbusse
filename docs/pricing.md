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

## Envoi des prix vers Beds24 : sortie de Beyond (depuis le 2026-11-14)

Plan complet : `C:\Users\alexa\.claude\plans\piped-wibbling-dove.md` (7 agents, deux relectures Fable).
Bascule visée le **01/12/2026**, sous condition : phase 0 validée et 7 jours d'envoi à blanc. Beyond
est **mis en pause**, pas résilié ; résiliation après le 31/01/2027.

### La porte unique

`lib/pricing/push.ts` est **le seul module qui écrit** dans Beds24, appelé par le seul cron
`/api/cron/pricing-push` (cron-job.org, **05:10 UTC**, après le relevé de 05:00). Déroulé :
1. verrou Redis ;
2. relecture **fraîche** du calendrier (`getCalendarDays(..., { fresh: true })`) ;
3. moteur et prix forcés (`buildTargets`) ;
4. plan (`lib/pricing/push-plan.ts`, pur) ;
5. envoi (`writeCalendar` → `updateCalendar` du socle v3.22.0) ;
6. relecture de contrôle ;
7. journal (`barbusse:pricing:push-last`, et `barbusse:pricing:push-journal:<horodatage>` sans TTL).

- **Voie `tarifs`** (`BEDS24_PRICING_REFRESH_TOKEN`, `read:inventory` et `write:inventory`) : aucun
  repli, aucune autre voie ne se replie vers elle. `writeCalendar` n'est importé que par `push.ts`
  (test `tests/pricing/push-import.test.ts`).
- **Seuls `price1` et `minStay` partent** : jamais `numAvail`, `override` ni prix liés. Le socle les
  refuse avant l'envoi.
- **Les nuits vendues ou bloquées sont écrites aussi** : `price1` ne touche pas une réservation, et
  une annulation rouvre ainsi la nuit au bon prix au lieu d'un prix périmé.
- **Horizon de 395 jours** (365 + 30), pour qu'une nuit entre dans la fenêtre de réservation déjà au
  bon prix. Une lecture Beds24 s'arrête à 365 jours : `readCalendar` lit en deux tranches, avant et
  après l'envoi. Une nuit non rendue compte comme vendable pour le moteur.

### Interrupteur à deux clés (fail closed)

| Clé | Où | Effet |
|---|---|---|
| `PRICING_PUSH_MODE` | variable Vercel | `off` (défaut, ou valeur inconnue) : rien ; `dry` : calcul et journal sans écrire ; `live` : écriture |
| `barbusse:pricing:halt` | Redis, bouton « Couper l'envoi » de la page Pricing | posé = aucune écriture, même en `live` ; Redis illisible = posé |

`?dry=1` sur la route force un calcul à blanc ponctuel (jamais plus permissif). **Un écart à la
relecture pose le halt et alerte, sans renvoi** : un renvoi automatique ferait une guerre d'écritures
si Beyond écrivait encore. On lève le halt depuis le dashboard après avoir compris.

### Garde-fous (`lib/pricing/guards.ts`, indépendants de la grille)

- **Bornes absolues** : 250 à 3 500 € effectifs, séjour minimum de 1 à 7 nuits. Une seule valeur
  dehors et **tout l'envoi est rejeté**.
- **Planchers des grands événements 2027** (prix effectifs), déclarés ici et pas seulement dans la
  grille :

  | Événement | Plancher |
  |---|---|
  | 24H Moto | 600 € |
  | MotoGP | 650 € |
  | Essais, avec les nuits d'approche du 7-8/06 | 1 560 € |
  | 24 Heures | 2 220 € |
  | Classic Heritage | 1 050 € |

  Ils restent actifs même avec les paramètres de bascule relevés.
- **Quarantaine** : une date qui varie de plus de `PRICING_MAX_CHANGE` (0,25 par défaut) garde son prix
  et part dans une alerte. Une date sans prix actuel en est exemptée.
- **Plafond de dates** : au-delà de `PRICING_MAX_DATES` (60 par défaut, 395 au plus), l'envoi est
  rejeté.
- **Pour la bascule** : relever les deux paramètres (`PRICING_MAX_DATES=395`, `PRICING_MAX_CHANGE=10`)
  le temps du premier envoi, puis les remettre.
- **On ne desserre jamais un garde-fou pour faire passer un envoi.**

### Remise de durée : compensée par le moteur

Les remises de durée Beds24 sont des **règles de prix liées à `price1`**, sans champ de dates (lues
par l'API le 2026-11-14) :

| Règle | Durée | Facteur |
|---|---|---|
| 2 | dès 4 nuits | ×0,92 |
| 3 | dès 7 nuits | ×0,90 |
| 4 | dès 28 nuits | ×0,70 |

On ne peut pas en exclure les événements. La grille et les prix forcés raisonnent donc en **prix
effectif**, et l'envoi écrit `price1 = effectif ÷ remise garantie` dès que le séjour minimum la rend
certaine (`price1For` : ÷ 0,92 à partir de 4 nuits). C'est ce qui avait coûté environ 1 000 € sur les
24 Heures 2027.

### Prix forcés (`lib/pricing/overrides.ts`)

Liste versionnée, sans interface en v1. Grands événements 2027 **figés au milieu entre le moteur et
Beyond** (décision du 2026-11-14), sans paliers d'anticipation :

| Événement | Prix effectif |
|---|---|
| 24H Moto | 940 € |
| MotoGP | 1 400 € |
| Essais et 7-8/06 | 1 560 € |
| 24 Heures (déjà vendues, en cas d'annulation) | 2 800 € |
| Classic Heritage | 1 860 € |

**À recalculer sur le relevé de la veille de la bascule** et à montrer à l'exploitant avant le `live`.

### Grille (corrections du 2026-11-14)

- 24 Heures : 2 800 € (plancher 2 220 €) ; leurs nuits d'approche (`extendBefore`) ont leur propre
  plancher, `leadInFloor` 1 560 €.
- **Plus de paliers d'anticipation sur les grands événements**.
- Fêtes resserrées : du 23 au 26/12 et du 30/12 au 01/01.

### Alertes ntfy (`sendPricingAlert`, préfixe « [Prix] »)

| Cas | Priorité | Quand |
|---|---|---|
| Envoi rejeté | 4 | dès le premier passage |
| Dates en quarantaine | 3 | dès le premier passage, une ligne par date |
| Écart relu | 4 | immédiate, le halt est posé |
| Erreur de la route | 4 | après 2 passages en erreur |

Le battement de cœur `pricing-push` (retard toléré de 26 h) fait partie de `EXPECTED_CRONS` : **le
job cron-job.org doit exister dès que ce code est en production**, sinon la surveillance le signale
en retard. Le keepalive entretient la voie `tarifs` dès que la variable existe.

### Premier envoi à blanc (2026-11-14, en local, sur le vrai calendrier)

- **Paramètres normaux** : rejeté, comme voulu (299 dates à modifier, au-delà de 60, et 65 en
  quarantaine).
- **Paramètres de bascule** : 394 dates écrites, **aucune violation** de borne ni de plancher.
- **Écart notable à relire en phase 2** : sur les deux semaines qui viennent, Beyond est au plancher
  de 280 € quand le moteur affiche entre 335 et 467 €. Le moteur brade beaucoup moins à l'approche des
  dates.

### Après la relecture Fable du code (2026-11-14)

- **Lecture en tranches de 365 jours** (`readCalendar`) avant et après l'envoi : un appel Beds24 rend
  365 jours au plus, et sans cela les 30 dernières nuits auraient été réécrites chaque jour, puis
  relues « ? » (faux écart, donc coupe-circuit dès le premier envoi réel).
- **Une nuit non lue compte comme vendable** pour le moteur : la compter fermée fabriquait un faux
  trou (×0,85, séjour minimum de 1 nuit) en bord d'horizon.
- **Exemptés de la quarantaine** :
  - les **prix forcés** (validés par l'exploitant, déjà bornés) ;
  - une **hausse qui remonte une nuit d'événement sous son plancher** (cas des 7-8/06 à 570 €),
    plafonnée à 1,25 fois le plancher : au-delà, la quarantaine s'applique.
- **Panne pendant l'envoi** : un journal d'intention est écrit avant l'envoi. Toute erreur ensuite
  pose le coupe-circuit et alerte immédiatement.
- **Le journal garde toutes les écritures** (`lines`), y compris les 394 de la bascule ;
  `push-last` n'en garde qu'un échantillon de 20.
- **`dailyChanges`** : nombre de nuits dont la **cible** a changé depuis la veille (cibles gardées
  14 jours). C'est la mesure du régime quotidien pendant l'envoi à blanc, celle qui valide le
  plafond de 60. L'écart avec les prix Beyond reste énorme tant que Beyond écrit.
- `?dry=1` ne remplace plus le dernier passage affiché au dashboard. Un passage `locked` n'envoie pas
  de faux rétablissement. **Rappel** si le coupe-circuit reste posé plus de 48 h.
- **Nuits d'approche** (`extendBefore`) : prix et plancher de `leadInFloor`, séjour minimum de
  2 nuits. Sans paliers, elles valaient sinon le prix de la course.
- **Socle** : une réponse Beds24 vide ou sans `success: true` explicite lève une erreur.
- Test `tests/pricing/event-floors.test.ts` : tout grand événement de l'horizon a un plancher. Il
  échouera exprès quand les événements 2028 entreront dans l'horizon (mi-2027) ; il faudra alors
  ajouter leurs planchers.
- **Non traité** : la lecture somme les rooms alors que l'écriture vise `ROOM_ID`. C'est sans effet,
  avec une seule room. Le décalage d'un jour sur `minStay` reste à vérifier en phase 0, par
  l'aller-retour réel.

### Alertes pour affiner le pricing (`lib/pricing/insights.ts`)

Calculées chaque matin par le relevé `pricing-snapshot` (photo du jour, différence avec la veille).
Envoyées sur ntfy sous le préfixe « [Prix] », **jamais répétées** tant que le constat dure
(`reportAlerts`, un identifiant stable par constat) :

| Constat | Priorité | Seuil | Ce qu'il suggère |
|---|---|---|---|
| Vente précoce | 3 | nuit ordinaire vendue à ≥ 120 j, ou nuit de grand événement à ≥ 90 j | prix sans doute bas : regarder les nuits voisines et l'édition suivante |
| Nuits orphelines | 3 | trou plus court que le séjour minimum, entre deux séjours | baisser le séjour minimum, vérifier le prix |
| Grand événement à J-60 | 3 | pendant 7 jours à partir de J-60, s'il reste des nuits libres | trancher : baisser si le prix dépasse 1,5 fois le réalisé |
| Creux à venir | 2 | moins de 20 % réservé sur 30 jours **et** aucune vente depuis 14 jours | comparer à l'occupation du voisinage (Beyond) avant de baisser ; une alerte par semaine au plus |

Premier passage réel (2026-11-14, en simulation) : il a repéré la vente des 24 Heures 2027 à J-207,
au prix affiché de 2 720 €, le cas exact qui a motivé cette alerte.

### Contrôles après publication

- **Portes** (`tests/deploy/site.ts`, en CI après chaque déploiement) :
  - `/api/dashboard/pricing`, `/pricing/history` et `/pricing/halt` (GET et POST) : 401 en anonyme,
    403 pour le viewer ;
  - `/dashboard/pricing` : 307 ;
  - tous les crons, dont `pricing-push` : 401 sans le secret.
- **Fonctionnels** (`tests/deploy/pricing.test.ts`), **en local après chaque déploiement**, car la CI
  n'a pas `CRON_SECRET` :
  - relevé à blanc sur 365 jours ;
  - envoi à blanc sans rejet de borne ni de plancher, et sans écart ;
  - rapport du lundi calculé ;
  - Bearer faux refusé.

  Lancer avec `CRON_SECRET` exporté depuis `.env.local` :
  ```
  npm run test:deploy -- tests/deploy/pricing.test.ts
  ```
