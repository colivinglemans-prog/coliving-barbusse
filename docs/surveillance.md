# Surveillance — contrôles post-déploiement, préparation d'arrivée, battement de cœur

> Référence détaillée — complément de [CLAUDE.md](../CLAUDE.md), qui en résume les règles critiques.
> À lire avant de modifier `tests/deploy/**`, `.github/workflows/{surveillance,post-deploy}.yml`,
> `lib/readiness/**`, `app/api/cron/arrival-readiness`, `app/api/health/heartbeat`,
> `lib/heartbeat.ts` ou `lib/alert-memory.ts`. Plan d'origine :
> `C:\Users\alexa\.claude\plans\keen-splashing-crescent.md` (2026-11-07).

## Contrôles post-déploiement et surveillance

Le moteur est dans le socle (`@sejour/socle/testing/deploy`, v3.9.0+) ; ce dépôt ne déclare que
ses **attendus**, importés de son propre code, jamais recopiés.

**Fichiers**
- `tests/deploy/site.ts` — `satisfies DeploySite`. Importe `PROPERTY_ID` / `ROOM_ID` /
  `availabilityPath` (`lib/beds24-property.ts`), `PROPERTY_INFO`, `CANCELLATION_POLICY`,
  `PAYMENT_POLICY` (`lib/property-info.ts`), `reviewsSummary()` (`lib/reviews.ts`), `LOCALES`,
  `BLOG_POSTS` (éditions `supersededBy`, comparées par segments entiers depuis le socle v3.10.1).
  Les `cronRoutes` sont **lues dans `app/api/cron/`** : un cron ajouté est contrôlé (401 sans
  Bearer) dès son premier déploiement.
- `tests/deploy/deploy.test.ts` — `defineDeploySuite(site)`.
- `vitest.deploy.config.ts` — `TZ=Europe/Paris`, inclut `tests/deploy/**` ; `vitest.config.ts`
  l'exclut (`npm test` reste sans réseau).
- `.github/workflows/surveillance.yml` — `vital` toutes les heures à :15, `full` chaque jour à
  04:40 UTC sur **son propre** `cron` (un retard de GitHub ne fait pas sauter le `full`) ;
  `max_green_age_hours: 26` au `full` ; `workflow_dispatch` (niveau, URL). `concurrency:
  surveillance`.
- `.github/workflows/post-deploy.yml` — sur `deployment_status` en `success`, `full`. En
  **production**, contre `https://www.coliving-barbusse.fr` (et non l'URL `…vercel.app` du
  déploiement, qui sauterait les contrôles réservés au domaine) et dans le groupe
  `surveillance` (même issue d'alerte) ; une preview est contrôlée sans alerte.
- Les deux appellent `colivinglemans-prog/sejour-socle/.github/workflows/deploy-checks.yml`
  **par SHA** (v3.21.0 : « rétabli » en priorité 1), `permissions: {}` au niveau du workflow, secrets passés un par un.
  `environment:` est interdit par GitHub sur un job qui appelle un workflow réutilisable : les
  secrets sont des secrets de **dépôt**.

**Commandes**
```bash
DEPLOY_LEVEL=vital npm run test:deploy                 # ~4 s, production
DEPLOY_LEVEL=full npm run test:deploy                  # ~8 s
DEPLOY_BASE_URL=https://<preview> npm run test:deploy  # une preview (les contrôles « prod seulement » sautent)
DEPLOY_ONLY=llms.,indexing.robots npm run test:deploy  # un sous-ensemble (préfixe avec un point final)
```
`DEPLOY_BASE_URL` et non `BASE_URL` : vitest pose lui-même `BASE_URL="/"`.

Lecture seule : aucun POST hors login (mauvais mot de passe), webhook sans secret et
`invoices/generate` en anonyme/viewer (refusé avant validation). Aucune route de pilotage du
chauffage ou du ballon n'est appelée.

**Secrets GitHub attendus** (Settings → Secrets → Actions) : `BEDS24_MONITOR_TOKEN` (refresh
token Beds24 `read:inventory` seul, propre à la surveillance ; sans lui `calendar.matchesBeds24`
saute), `DEPLOY_VIEWER_PASSWORD` (compte viewer **dédié** ; sans lui `security.viewer` saute),
`VERCEL_AUTOMATION_BYPASS_SECRET` (les previews **sont** protégées : sans lui, `post-deploy` sur
une preview reçoit 302), `NTFY_TOPIC`. Anti-extinction des `schedule` (60 jours sans activité) :
cron-job.org lance `workflow_dispatch` chaque jour avec un jeton GitHub à grain fin, **à
renouveler avant son expiration**.

**Portes du viewer** : toute route dont la garde accepte le viewer doit être dans `allowedPaths`
de `proxy.ts` (règle du 2026-11-07) ; `doors` de `site.ts` le vérifie route par route
(`bookings`, `calendar`, `heating`, `water-heater`, `event-links` à 200 pour le viewer).

**Pages hors du crible des fuites** : `/guide-arrivee` publie le Wi-Fi en clair (décision du
2026-11-07) ; le mot de passe est dans `mustNeverAppear` pour qu'il n'apparaisse **nulle part
ailleurs** (accueil, chambres, séminaires, blog, `llms.txt`).

**KO attendus en `full`, jusqu'à la réécriture des textes par la session « réservation IA »**
- `llms.forbidden` — « gratuite jusqu'à 14 jours » / « acompte de 10 % » dans `llms.txt` et les
  5 dictionnaires ;
- `llms.policies` — les nombres de la politique Ferme (avec leur unité : « 30 jours », « 50 % »,
  « 48 h ») absents de `llms.txt` ;
- `llms.coverage` — `llms.txt` ne référence ni `/en`, `/it`, `/de`, `/es` ni `/fr/chambres`.

L'issue `surveillance-ko` reste donc ouverte jusqu'à ce correctif (une notification à
l'ouverture, pas à chaque passage) ; le `vital` horaire doit être vert.

**`heartbeat` activé** dans `site.ts` le 2026-11-07, une fois le job cron-job.org
`arrival-readiness` créé : chaque passage de la surveillance appelle la route, ce qui réévalue
aussi l'alerte ntfy des crons en retard. **En attente** : `channel` et `referer` restent hors de
`viewerForbiddenFields` : le DTO du socle (`toBookingListItem`) les sert encore au viewer.

## Préparation d'arrivée (`/api/cron/arrival-readiness`)

Contrôle **en lecture seule** de la serrure, des radiateurs et du ballon avant chaque arrivée ;
prévient par ntfy, ne répare rien. Le moteur (passages, évaluation, anti-répétition, format) est
`@sejour/socle/lib/arrival-readiness` ; les réglages et les sondes propres à la maison sont dans
`lib/readiness/` (`config.ts`, `heating-probe.ts`, `water-heater-probe.ts`, `run.ts`).

| Passage | Heure (Paris) | Sondes |
|---|---|---|
| `eve` | J-1 19h | serrure (dont pile, code du séjour), radiateurs en ligne, ballon en ligne |
| `noon` | J 12h30 | + mode attendu (éco) ; relevé des températures de référence |
| `preheat` | J 15h30 | mode attendu (confort, **éco en rotation**) ; +1 °C depuis 12h30 **ou** ≥ 14 °C |
| `final` | J 16h30 | ≥ consigne du mode attendu − 3 °C ; eau ≥ 50 °C **ou** ≥ 60 % du ballon |
| `late` | arrivée annoncée − 1 h | serrure, eau |
| `noShow` | J+1 9h | entrée avec le code depuis 14 h (journal Nuki), **une seule alerte** |
| `daily` | 9h | pile : < 25 % → priorité 3, < 10 % → 4 |

- **Arrivée prouvée par le code clavier seul** : pas de clé physique, aucune raison d'ouvrir de
  l'intérieur. Une ouverture par un code manuel non protégé rend « inconnu », jamais « absent ».
  Le journal Nuki se lit par pages de **50** lignes, quel que soit `limit`.
- **Ignorés** : radiateurs `unpaired` (aucun aujourd'hui), verrouillés ou exclus, mode été, et
  **toute température de pièce à partir de 17 h**. L'eau est mesurée au passage `late` : c'est sa
  raison d'être.
- **Silence de 22 h à 8 h**, sauf `eve` et `late`. Hors ligne seulement après 2 lectures ratées.
- **Gravité** des défauts bloquants selon le passage : 3 (J-1, 12h30, 9h), 4 (15h30,
  non-arrivée), 5 (16h30, tardif).
- **Redis** : `barbusse:readiness:state:<arrival:id|equipment>` (anti-répétition par séjour),
  `…:memory` (lectures ratées), `…:baseline:<id>` (températures de 12h30), `…:last-run`.
- **`?dryRun=1` ou `?dry=1`** (les deux noms valent partout où un mode à blanc existe, `lib/cron-params.ts`, depuis le 2026-11-16 ; un `?dry=1` faisait ici un vrai passage) : calcule et rend l'aperçu de la notification sans rien écrire ni envoyer
  (`run.ts` n'appelle jamais `send` en `dryRun`, et la route lui passe une fonction qui lève).
  `&at=<ISO>` simule l'instant (refusé hors `dryRun`). Les sondes lisent toujours l'état
  **actuel** des appareils.
- Le corps ntfy porte le prénom seul, jamais de PIN (`scrubCodes`) ni de nom de famille ; la
  réponse HTTP hors `dryRun` ne porte que les identifiants des constats.
- **Cron** à **:35**, jour et nuit (cron-job.org) : chaque passage nominal tombe une fois dans sa
  fenêtre de ± 30 min ; le passage `late` d'une arrivée à 23 h est à 22 h, les heures de silence
  sont gérées par la route.

**Crons sans mode à blanc** (`NO_DRY_MODE`, `lib/cron-params.ts`) : `?dry=1` y est **ignoré** et
lance un vrai passage — `beds24-keepalive`, `checkin-notifications`, `heating-automation`,
`heating-health`, `heating-reset`, `messages-voyageurs`, `water-heater-automation`,
`water-heater-health`. Ne pas les appeler « pour voir ».

## Battement de cœur des crons (`/api/health/heartbeat`)

Tous les crons de `app/api/cron` appellent `beat(name, "ok" | "error")` (`lib/heartbeat.ts`,
`recordHeartbeat` du socle) en fin de passage réel — jamais en `dry`/`dryRun` — sauf
`pricing-review-reminder`, exempté avec son motif (`HEARTBEAT_EXEMPT`). Un test
(`tests/readiness/heartbeat-coverage.test.ts`) échoue si une route n'a ni battement ni
exemption. Un passage sauté par décision (coupe-circuit `…_ENABLED=false`, mode été, rien en
`live`) bat `ok`. Redis `barbusse:heartbeat:<nom>` et `…:ok` (TTL 30 j).

Retards acceptés (dernier passage **réussi**, cadence réelle relevée le 2026-11-15 plus un
passage manqué) :

| Cadence | Crons | Retard |
|---|---|---|
| 10 min | `messages-voyageurs`, `checkin-notifications`, `camera-watch`, `cleaning-watch` | 30 min |
| 15 min | `heating-automation`, `water-heater-automation` | 45 min |
| 30 min | `heating-health` | 90 min |
| 1 h | `nuki-sync`, `arrival-readiness` | 150 min |
| 2 h | `water-heater-health` | 5 h |
| 4 h | `heating-reset` | 10 h |
| quotidien | `pricing-push`, `pricing-snapshot`, `indexing` | 26 h |
| hebdomadaire | `beds24-keepalive`, `events-watch`, `beds24-backup`, `pricing-report` | 8 jours |

**Délai de grâce au démarrage** (`overdueWithGrace`, 2026-11-16) : le socle compte une clé absente
comme un retard ; un cron ajouté à la liste sortirait donc « en retard » dès le déploiement. La
route note la première fois qu'elle voit chaque cron (`barbusse:heartbeat:<nom>:watched-since`,
sans expiration) et ne déclare pas en retard un cron **qui n'a jamais battu** tant que cette date
a moins que sa tolérance. Une clé `…:ok` expirée (cron mort depuis 30 jours) ne rouvre pas de
délai : la première vue est ancienne.

`GET /api/health/heartbeat` est **publique** (hors `matcher` de `proxy.ts`) : 200
`{ ok: true, overdue: 0 }` ou 503 `{ ok: false, overdue: N }`, **jamais un nom** (« la synchro de
la serrure est en retard » renseignerait un cambrioleur). Les noms partent par ntfy
(`sendCronAlert`) une fois par changement d'état (`barbusse:alert:heartbeat`). L'appeler écrit
donc dans Redis : ne pas la viser en local avec les variables de production.

## Règle commune des alertes (2026-11-10)

L'hôte recevait trop d'alertes ntfy — dont une « serrure hors ligne » alors que Nuki était déjà
revenu — et risquait de ne plus les lire. Toute alerte de **problème** suit désormais la même
règle, dans [lib/alert-memory.ts](../lib/alert-memory.ts) (`reportAlerts`, `reportCronRun`, sur
`nextAlertState` du socle v3.21.0, option `confirmAfter`) :

1. **Deux passages KO de suite** avant d'alerter. Un relevé raté isolé ne produit rien, ni
   alerte ni rétablissement.
2. **Jamais répétée à gravité égale** ; elle repart si un nouvel élément tombe ou si la gravité
   monte (un PIN manquant à J-3, puis le jour même).
3. **Rétablissement en priorité 1** (sans son), seulement si une alerte était partie.
4. **Redis injoignable** : la confirmation est levée (`confirmAfter: 1`) et l'alerte repart à
   chaque passage — sans quoi le compteur ne survivrait jamais.
5. **Envoi raté** (ntfy en panne) : l'état est remis tel qu'avant le passage et l'erreur remonte ;
   le passage suivant renvoie l'alerte (une alerte jamais répétée ne doit pas se perdre).
6. **Mode été** : les crons du chauffage le traitent comme un passage réussi (compteurs d'erreur
   remis à zéro).

| Alerte | État Redis (`barbusse:alert:…`) | Particularités |
|---|---|---|
| Serrure hors ligne / clavier non appairé | `nuki-lock` | Évaluée au **cron horaire seulement**, jamais au passage lancé par le webhook Beds24 (nos propres écritures le déclenchent). Priorité 4. La pile faible n'est plus signalée par la synchro : le passage `daily` de 9 h de la préparation d'arrivée la signale. |
| Codes du clavier (planificateur, échecs d'écriture, confirmation) | `nuki-codes` | Identifiant = type + réservation (+ étape) ; priorité 3 / 4 / 5 selon la proximité de l'arrivée. Évaluée aussi quand `NUKI_SYNC_MODE` n'est pas `live` (rien n'est écrit). |
| Code dans Beds24 mais absent du clavier, arrivée au plus tard demain et séjour pas fini | `nuki-codes-urgent` | **Exception à la règle des deux passages** (2026-11-16) : `confirmAfter: 1`, priorité 5 (4 de 22 h à 8 h pour une arrivée demain ; gravité stockée toujours 5, pas d'escalade à minuit), évaluée aussi au passage lancé par le webhook. Le PIN est écrit dans Beds24 avant la pose : une auto-action a pu l'envoyer. Sortie de `nuki-codes` pour ne pas repartir au passage suivant. |
| Erreur de la synchro (`catch`) | `error:nuki-sync` | Deux passages de suite (`reportCronRun`). |
| Synchro des codes à blanc (`NUKI_SYNC_MODE` ≠ `live`) | `nuki-sync-mode` | 2026-11-20. Priorité 4 au 2e passage horaire (aucun code n'est plus posé ni retiré), « rétabli » en priorité 1 au retour en `live`. Évaluée avant la synchro, pas en `?dry=1`. |
| Radiateurs hors ligne | `heating-health` | Ignorés pendant une coupure soupçonnée ou signalée. Un seul radiateur en défaut : priorité 3 si la maison est vide, 4 si des voyageurs sont là ou arrivent d'ici demain (ou si plusieurs sont en défaut). |
| Radiateurs qui refusent leur mode | `heating-automation` | Deux passages de suite ; un radiateur vu hors ligne au même passage n'y compte pas (c'est `heating-health` qui le signale). |
| Coupure de courant | (`barbusse:heating:power-cut`, `lib/power-cut.ts`) | Soupçonnée au 1er passage, signalée en priorité 5 au 2e (15 min) si au moins 3 des **mêmes** radiateurs manquent encore (une chute toute neuve repart en soupçon) ; « courant revenu » en priorité 1. |
| Ballon thermodynamique | `water-heater-health` | Remplace `barbusse:water-heater:health-pending` (expire seule). |
| Erreur d'un cron (`catch`) | `error:<cron>` | `heating-health`, `heating-automation`, `heating-reset`, `water-heater-health`, `water-heater-automation`, `nuki-sync`, `cleaning-watch`, `pricing-snapshot`, `pricing-push`. Identifiant fixe : un message d'erreur qui change ne relance pas l'alerte. `heating-reset` compte en erreur un passage où **tous** les radiateurs ont refusé (502). |
| Journal de la serrure illisible (check-in) | `checkin-keypad` | Priorité 3 ; sans lui, plus aucune arrivée signalée. La réponse du cron dit alors `success: false` (HTTP 200 : pas de courriel cron-job.org en double). |
| Serrure non verrouillée après le départ | `departure-lock` | Relevé de `heating-automation` (15 min), le jour d'un départ, de D + 30 min **jusqu'à E**, la fin de validité réelle du code des partants (même formule que la synchro, `lockWindows`). Priorité 4, **3 la nuit** (22 h – 8 h, priorité d'envoi seulement). Verrouillée avant E : rétabli, mais la journée reste surveillée (retour d'un voyageur → « Serrure non verrouillée après le retour d'un voyageur », l'alerte rouvre). **Prise en main** (code personnel `#` ou `TRACKED_PEOPLE` au clavier, code nommé au garage, code des arrivants, après la dernière ouverture des partants) : aucune alerte, fermeture sans message, journée close. Porte non verrouillée après E : surveillée jusqu'à minuit, où l'alerte se **referme sans message** (plus de départ « aujourd'hui »). Lectures : serrure seule, puis journal si elle n'est pas verrouillée, puis garage (délai propre, 8 s) si le journal ne conclut pas. Alerte ouverte : le garage n'est plus relu. État nul ou de passage (2, 4, 7, 255) : relevé illisible, le suivant tranche. Redis illisible (horaires convenus, état, fin de journée) : relevé sauté, sans alerte. Mode été : même fermeture à minuit. Parade caméra non faite (en attente de la mesure du retard d'Intratone). |
| Porte non verrouillée, journal illisible | `departure-lock-log` | Deux relevés de suite avec la porte non verrouillée et le journal Nuki illisible : priorité 3, « impossible de savoir si le ménage est entré ». Rétabli quand la porte est verrouillée ou le journal relu ; fermé sans message avec la journée. |
| Garage ou porte illisibles (suivi ménage) | `cleaning-sources` | Priorité 3 ; une source sans identifiants (`no-credentials`) n'est pas une panne. Réponse `success: false` (HTTP 200). |
| Plafond des messages voyageurs | `messages-cap` | `confirmAfter: 1` (pas un état passager). |
| Crons en retard | `heartbeat` | Rétabli en priorité 1. La surveillance déclare `heartbeat.severity: "warning"` : plus de doublon `[Crons]` + `[Surveillance]` ; une route de heartbeat illisible reste bloquante (`heartbeat.reachable`). |

Inchangées : la préparation d'arrivée (déjà deux lectures, anti-répétition et silence 22 h–8 h),
le keepalive et la sauvegarde Beds24 (hebdomadaires), le devis IA. Le webhook refusé n'alerte
plus et n'écrit plus rien depuis le 2026-11-20 (un appel anonyme écrasait le témoin) : un Beds24
mal réglé se voit à la date du dernier appel accepté, sur l'écran Messages. Les
notifications d'information restent : check-in (priorité 3 depuis le 2026-11-10), rapport
pricing, veille des événements, sauvegarde réussie.

**Arrivée imminente** (2026-11-16, `lib/arrival-notice.ts`, appelée par `lib/access-sync.ts`) :
une information, pas une panne — hors règle des deux passages. Une notification par réservation
et jour d'arrivée (`SET NX` sur `barbusse:arrival-notice:<résa>:<jour>`), quand la synchro **a
exécuté** la création du code d'une réservation de dernière minute (< 48 h, `isLateBooking`) ou le
recalage d'un code dont le jour d'arrivée a changé, pour une arrivée aujourd'hui ou demain. Rien à
blanc ni en `?dry=1`. Texte : prénom seul, nombre de voyageurs, dernier ménage enregistré (rôle
`ménage` de `TRACKED_PEOPLE`, registre `barbusse:cleaning:log`) et dernier départ ; jamais d'heure
d'arrivée ni « non constaté ». Priorité 4 sans ménage enregistré depuis le dernier départ, 2
sinon (4 aussi si le dernier départ est inconnu, introuvable ou encore à venir — « départ prévu le
jj/mm »), 2 la nuit pour une arrivée le lendemain. Redis injoignable : rien n'est envoyé ; envoi
raté : la clé est retirée et la notification mise en file
(`barbusse:arrival-notice:retry:<résa>:<jour>`, jusqu'au lendemain de l'arrivée), retentée à chaque
passage live de la synchro. Notée dans le journal sous « Arrivée imminente », sans prénom.

### Ajustements du 2026-11-14 (relecture de l'hôte)

- **Radiateurs tenus hors des alertes** : `alerts: false` sur l'appareil dans
  `data/heatzy-zones.json` (`alertIgnoredDids`, `lib/heatzy.ts`). Le radiateur reste piloté,
  mais n'entre ni dans `heating-health`, ni dans « n'ont pas pris leur mode », ni dans la
  détection de coupure, ni dans la préparation d'arrivée (traité comme `unpaired`). **Véranda D**
  depuis le 2026-11-14 : panne connue, sans conséquence (décision de l'hôte).
- **Priorité selon la présence** (`stayInProgress`, `guestsAround`, `getBookingsAround`,
  `lib/bookings.ts`, séjours vendus au sens de `countsAsSold`) : radiateur seul 3 → 4 avec voyageurs ; thermo injoignable
  (`water-heater-reach`) 3 → 5 avec voyageurs ; mouvement caméra 4 quand la maison est vide, 2
  pendant un séjour (jour d'arrivée au jour de départ inclus). Beds24 illisible → la priorité
  haute. Un changement de priorité d'une alerte ouverte la relance (escalade) : voulu, des
  voyageurs arrivent et la panne dure. « Plusieurs radiateurs → 4 » se décide à l'envoi, sur les
  seuls confirmés (option `priority` de `reportAlerts`).
- **Passages Sophie / Eric** (`cleaning-watch`) : priorité 2.
- **Arrivée d'un autre code perso** (`cleaning-watch`, 2026-11-18) : priorité 2, une par venue
  (même nom à moins de 45 min, garage et porte confondus). Tout code Intratone **nommé** du garage
  et tout code Nuki manuel « # Nom » de la porte, hors personnes suivies (`TRACKED_PEOPLE`, déjà
  signalées) et hors codes de séjour (« <n° résa>: Prénom »). Mêmes lectures Intratone et Nuki
  que le suivi ménage. Ligne de base **par source** `barbusse:cleaning:last-personal`
  (`{ garage, porte }`) : rien au premier passage ; une source illisible ne signale rien et
  garde la sienne, ses arrivées partent au passage suivant. Titre « Accès maison — <Nom> », texte
  « Code « <Nom> » à HH:MM — garage|porte. » ; le nom ne part que dans ntfy : journal des
  notifications « Accès maison — code perso », réponse du cron `personal: <nombre>`. N'entre
  pas dans le journal des intervenants (page « Suivi »).

### Journal des notifications (30 jours)

ntfy.sh ne garde qu'environ 12 h. **Tout envoi ntfy du site passe par `@/lib/ntfy`** (enveloppe
de `sendNtfy` du socle) — jamais directement par `@sejour/socle/lib/ntfy` — qui note chaque envoi
réussi dans la liste Redis `barbusse:ntfy:log` (`lib/notify-log.ts`) : instant, titre, priorité,
mots-clés, **jamais le corps** ni un prénom (le check-in est noté « 🔑 Check-in », troisième
argument `log` de `sendNtfy`) ; les entrées de plus de 30 jours sont purgées à l'écriture, une
entrée illisible est ignorée, et la page signale un plafond (5 000) atteint. La caméra, qui poste elle-même vers ntfy (pièce jointe), appelle
`recordNotification`. Page admin **`/dashboard/alertes`** (`app/api/dashboard/alertes`,
`denyNonAdmin`, hors de la liste blanche viewer) : total, moyenne par jour, sonores, graphe par
jour, notifications qui reviennent le plus (titres regroupés, nombres → « N »), 200 dernières.
Non couvertes : les notifications de la surveillance GitHub (envoyées par Actions).
