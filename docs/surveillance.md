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
- **`?dryRun=1`** : calcule et rend l'aperçu de la notification sans rien écrire ni envoyer
  (`run.ts` n'appelle jamais `send` en `dryRun`, et la route lui passe une fonction qui lève).
  `&at=<ISO>` simule l'instant (refusé hors `dryRun`). Les sondes lisent toujours l'état
  **actuel** des appareils.
- Le corps ntfy porte le prénom seul, jamais de PIN (`scrubCodes`) ni de nom de famille ; la
  réponse HTTP hors `dryRun` ne porte que les identifiants des constats.
- **Cron** à **:35**, jour et nuit (cron-job.org) : chaque passage nominal tombe une fois dans sa
  fenêtre de ± 30 min ; le passage `late` d'une arrivée à 23 h est à 22 h, les heures de silence
  sont gérées par la route.

## Battement de cœur des crons (`/api/health/heartbeat`)

`nuki-sync`, `heating-automation`, `water-heater-automation` et `arrival-readiness` appellent
`beat(name, "ok" | "error")` (`lib/heartbeat.ts`, `recordHeartbeat` du socle) en fin de passage
réel — pas en `dry`/`dryRun`. Redis `barbusse:heartbeat:<nom>` et `…:ok` (TTL 30 j).

Retards acceptés (dernier passage **réussi**) : `heating-automation` 45 min, les trois autres
150 min — fréquence réelle plus un passage manqué.

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
| Codes du clavier (planificateur, échecs d'écriture, confirmation) | `nuki-codes` | Identifiant = type + réservation (+ étape) ; priorité 3 / 4 / 5 selon la proximité de l'arrivée. |
| Radiateurs hors ligne | `heating-health` | Ignorés pendant une coupure soupçonnée ou signalée. |
| Radiateurs qui refusent leur mode | `heating-automation` | Deux passages de suite ; un radiateur vu hors ligne au même passage n'y compte pas (c'est `heating-health` qui le signale). |
| Coupure de courant | (`barbusse:heating:power-cut`, `lib/power-cut.ts`) | Soupçonnée au 1er passage, signalée en priorité 5 au 2e (15 min) si au moins 3 des **mêmes** radiateurs manquent encore (une chute toute neuve repart en soupçon) ; « courant revenu » en priorité 1. |
| Ballon thermodynamique | `water-heater-health` | Remplace `barbusse:water-heater:health-pending` (expire seule). |
| Erreur d'un cron (`catch`) | `error:<cron>` | `heating-health`, `heating-automation`, `heating-reset`, `water-heater-health`, `water-heater-automation`. Identifiant fixe : un message d'erreur qui change ne relance pas l'alerte. |
| Plafond des messages voyageurs | `messages-cap` | `confirmAfter: 1` (pas un état passager). |
| Crons en retard | `heartbeat` | Rétabli en priorité 1. La surveillance déclare `heartbeat.severity: "warning"` : plus de doublon `[Crons]` + `[Surveillance]` ; une route de heartbeat illisible reste bloquante (`heartbeat.reachable`). |

Inchangées : la préparation d'arrivée (déjà deux lectures, anti-répétition et silence 22 h–8 h),
le keepalive et la sauvegarde Beds24 (hebdomadaires), le webhook refusé (6 h), le devis IA. Les
notifications d'information restent : check-in (priorité 3 depuis le 2026-11-10), rapport
pricing, veille des événements, sauvegarde réussie.
