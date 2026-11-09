# Chauffage — Heatzy Pilote Pro

> Référence détaillée du chauffage (API Heatzy, scheduling, alertes, dashboard, mode été, transitions) — complément de [CLAUDE.md](../CLAUDE.md), qui en résume les règles critiques. À lire avant de modifier ou d'expliquer le code de ce sujet.

## Heatzy Pilote Pro

- **API** : Gizwits (`https://euapi.gizwits.com`), App ID `c70a66ff039d41b4a220e198b0fcc8b3`
- **Auth** : Email/password → token 7 jours (lazy refresh dans `lib/heatzy.ts`)
- **15 radiateurs** sur 4 zones : RDC (5), Chambre RDC (1), 1er étage (6), Dernier étage (3) ; tous appairés (Chambres 3 et 7 ré-appairées, vérifié le 2026-11-07)
- **Modes** : `cft` (confort), `eco`, `fro` (hors-gel), `stop`, `presence` (via `derog_mode: 3`)
- **Températures par défaut** : confort 19°C (20°C dernier étage), éco 15°C (printemps)
- **Température API** : valeurs en dixièmes (179 = 17.9°C), diviser par 10
- **Config** : `data/heatzy-zones.json` (device IDs, zones, nightMode, mapping Beds24)

### Logique scheduling (une seule source : `lib/heating-schedule.ts`)

**`expectedHeatingMode(bookings, today, hour, zone)`** rend `{ situation, mode }` — `occupied`,
`arrival-morning`, `preheat-eco`, `preheat-cft`, `turnaround`, `checkout`, `vacant` (`mode: null` :
rien d'imposé). C'est **la** règle, pure, utilisée par `heating-automation`, `heating-reset`
(`resetTarget`), `/api/dashboard/heating` (`expectedMode`, `getHeatingRules(situation, …)`) et la
sonde `heating` de la préparation d'arrivée. Elle remplace trois copies qui avaient divergé
(2026-11-07) : le dashboard annonçait hors-gel puis confort un jour de rotation, là où
l'automatisation pose l'éco de 10 h à 17 h. **La référence est l'automatisation.** Le test
`tests/heating/expected-mode.test.ts` garde les anciennes copies en oracle sur une semaine
simulée ; toute modification de la règle doit l'y faire apparaître. `lib/heatzy.ts` réexporte
ces fonctions pour les anciens imports.

**Chambres occupées** :
- 7h-20h : mode présence
- 20h-0h : confort
- 0h-5h : confort
- 5h-7h : confort

**RDC occupé (nightMode: "presence")** :
- 7h-20h : mode présence
- 20h-0h : confort
- 0h-5h : **présence** (éco si personne dans les espaces communs la nuit)
- 5h-7h : confort

**Entre deux réservations (même jour)** :
- 9h-17h : éco
- Sinon : hors-gel

**Pas de réservation** : hors-gel

**Pré-chauffage** (jour du check-in) : éco à 12h, confort à 15h (montée progressive pour éviter de faire sauter les plombs)

### Délestage (2026-11-09 — coupures à 9 kVA, 14 voyageurs)

15 radiateurs **ACOVA Atoll LCD 1 000 W** (fluide caloporteur), 15 kW installés pour un abonnement de 9 kVA.

- **Échelonnement** : chaque zone a un décalage signé `staggerMinutes` (`data/heatzy-zones.json`) ;
  `zoneHour(hour, minute, stagger)` donne l'heure à laquelle la zone lit la règle. **Dernier étage
  −15 min** (zone la plus froide, d'abord), **RDC et chambre RDC à l'heure**, **1er +15 min** :
  préchauffage éco 11 h 45 / 12 h / 12 h 15, confort 14 h 45 / 15 h / 15 h 15, confort du soir
  19 h 45 / 20 h / 20 h 15. **Seules les montées en chauffe sont décalées** (`staggered` : la zone en
  avance prend le mode décalé s'il chauffe plus, la zone en retard garde l'ancien s'il chauffe moins) ;
  les descentes (7 h, 10 h départ, 17 h arrivée, minuit) restent à l'heure partout. Les appelants
  passent la minute de Paris (`heating-automation`, `heating-reset`, dashboard, sonde d'arrivée).
- **Charge estimée** (`lib/radiator-load.ts`) : par radiateur, consigne du mode (`cft`, `cft1`/`cft2`
  = confort −1/−2 du mode présence, `eco`, hors-gel 7 °C), écart à la température : ≥ 1 °C ou
  `Heating_state = 1` → 100 %, régulation → 1/3, au-dessus → 0 ; **hors ligne ou illisible → 100 %**.
  Puissance `powerW` (défaut 1 000 W). Pour décider d'un délestage, la consigne retenue est celle
  que le radiateur **aura** après le passage (`expectedSetpoint`).
- **Délestage tournant** (`lib/load-shedding.ts`, `heating-automation`, situations occupé /
  préchauffage / rotation) : au-delà de `ELECTRICAL_BUDGET.radiatorCapW` (6 kW à 9 kVA, 9 kW à
  12 kVA), des zones qui visent le confort passent en **éco pour le quart d'heure**, ordre
  **dernier → 1er → chambre RDC**, jamais le RDC ; une zone délestée au quart d'heure précédent passe
  après les autres ; une zone devenue superflue est rendue. État Redis `barbusse:heating:shed`,
  respecté par `heating-reset`. ntfy priorité 3 au premier délestage du jour.
  ⚠️ **En observation** depuis sa mise en service (`LOAD_SHEDDING_MODE = "observe"`,
  `lib/electrical-budget.ts`) : le passage calcule et affiche les zones qu'il délesterait
  (`observedShedZones`), sans rien appliquer. Le 9/11 à 21 h 54, 13 radiateurs sur 15 en demande
  de chauffe donnaient 13,3 kW estimés alors que le compteur de 9 kVA tenait : l'estimation est
  pessimiste (`Heating_state` = demande du Heatzy, pas pleine puissance ; l'ACOVA régule aussi).
  À activer après calibrage (puissance max du Linky, courbe Enedis, module TIC).
- **Consignes** : celles montées au-dessus de la zone (boutons du Heatzy, laissés libres) sont
  ramenées à chaque passage de `heating-automation` (15 min) pendant un séjour.
- **Coupure de courant** (`lib/power-cut.ts`) : 3 radiateurs ou plus en ligne au passage précédent
  et hors ligne à celui-ci → ntfy **priorité 5** « Coupure de courant probable » ; tous revenus →
  « Courant revenu ». Une coupure non résolue est oubliée après 6 h (circuit resté coupé) ; une
  nouvelle chute pendant une coupure ouverte relance l'alerte. **Tous** les radiateurs hors ligne :
  titre « Coupure de courant ou box Internet » (box ou cloud Heatzy en panne, indiscernables).
  Pendant une coupure, l'alerte « n'ont pas pris leur mode » est tue.
- La situation globale (libellés, consignes ramenées, délestage) n'est pas décalée : écarts d'un
  quart d'heure sur les montées, cosmétiques.
- **Avant de passer le délestage en actif** : `expectedMode` du dashboard et la sonde d'arrivée
  ignorent les zones délestées (une zone en éco y paraîtrait en écart).
- **Dashboard** : charge estimée, plafond et zones délestées sous la règle active
  (`barbusse:heating:load`, lue aussi par l'automation du ballon pour l'appoint).

**Reset (`heating-reset`, toutes les 4 h)** : un **jour d'arrivée compte comme occupé dès 12 h**
(`resetTarget`) — mode du préchauffage (ou éco en rotation), consignes remises seulement si
elles ont été montées. Avant le 2026-11-07, les passages de 12 h et 16 h remettaient le
hors-gel par défaut et coupaient le préchauffage jusqu'au quart d'heure suivant.

### Fonctions utilitaires

- `lib/heating-schedule.ts` : `expectedHeatingMode`, `heatingSituation`, `isOccupiedAt`,
  `getOccupiedMode(zone, hour)`, `getBetweenReservationsMode(hour)`, `resetTarget`,
  `getHeatingRules(situation, hour, nextCheckIn)`
- `lib/heatzy.ts` : client Gizwits, `getLockedDevices()` (Redis `heatzy:locked-devices`, repli
  `LOCKED_DEVICES`), mode été
- `data/heatzy-zones.json` : `unpaired: true` marque un radiateur dont le module n'est plus
  appairé — ignoré par la préparation d'arrivée, toujours piloté par l'automatisation. Aucun
  aujourd'hui.

### Alertes des crons chauffage (ntfy, anti-répétition)

`heating-health` (connectivité) et `heating-automation` (radiateurs qui refusent leur mode,
`failures[]`) passent par `nextAlertState` du socle, état dans Redis
`barbusse:alert:heating-health` / `barbusse:alert:heating-automation` (`lib/alert-memory.ts`) :
une notification à l'ouverture, une quand un nouveau radiateur tombe, une en priorité 2 au
rétablissement — **jamais deux fois à gravité égale** (`heating-health` renvoyait la même alerte
toutes les 30 min). `sendHeatingAlert(subject, body, priority = 4)` (`lib/alerts.ts`).

### Alertes (basées sur température + comportement)

**Sans réservation** :
- `Heating_state=1` + temp > 10°C → "Chauffe sans réservation"
- temp > cft_temp + 3°C → "Température anormale"

**Avec réservation** :
- Pas en mode présence (journée) → warning
- `Heating_state=1` + temp < consigne - 5°C → "N'atteint pas la consigne"
- `Heating_state=0` + temp < consigne - 3°C → "Ne chauffe pas"
- temp > cft_temp + 3°C → "Température anormale"

**Toujours** : offline, consigne modifiée par voyageur

### Dashboard chauffage (`/dashboard/heating`)

- **Cartes résumé** : en ligne, hors ligne, total, actions requises
- **Règles actives** : bandeau bleu avec règle actuelle + prochaine
- **Contrôle global** : 5 boutons mode (admin only)
- **Zones** : carte par zone avec boutons mode + grille devices
- **Carte device** : mode, temp actuelle → consigne, tendance ↑↓, badge "Chauffe", indicateur présence (vert/gris + durée), alertes erreur/warning, bouton lock
- **Toggle admin/viewer** : prévisualiser la vue viewer
- **Polling** : refresh 30s, tendance basée sur historique 5 min côté client
- **Lock** : verrouiller un device en hors-gel (ignoré par crons), via env var `LOCKED_DEVICES`

### Présence

- **Détection** : `derog_mode=3` + `mode` commence par `cft` = présence détectée
- **Limitation** : capteur ne remonte son état que en mode présence (`derog_mode=3`)
- **Diminution** : affiche l'écart cft_temp - eco_temp quand personne n'est détecté
- **Comportement normal** : `cur_signal=fro` quand personne ≠ problème fil pilote

### Mode été (chauffage suspendu)

- **Toggle** : bouton "Activer le mode été" dans `/dashboard/heating` (admin only). Bandeau ambre persistant tant qu'actif avec bouton "Désactiver".
- **Effet** : tous les radiateurs passent en `stop` (fallback `fro` si firmware ne supporte pas stop ou device offline). Les crons `heating-automation` et `heating-reset` deviennent no-op (`{ skipped: "summer-mode" }`). Les alertes "chauffe sans réservation" / "ne chauffe pas" sont masquées.
- **Cron `heating-health` reste actif** : surveillance connectivité conservée (utile pour repérer un device tombé avant l'automne).
- **Flag** : stocké en Redis (`heatzy:summer-mode`), cache 60s.
- **API** :
  - `GET /api/dashboard/heating/summer-mode` → `{ enabled }`
  - `POST /api/dashboard/heating/summer-mode { enabled: true|false }` → si `true`, tente `stop` puis fallback `fro` device par device, tolérant aux pannes individuelles (continue si un radiateur est offline). Retourne `{ success, enabled, stopped, fallbackFro, failed: [{name, reason}] }`.
- **Helpers `lib/heatzy.ts`** : `getSummerMode()`, `saveSummerMode(enabled)`.

## Logique check-in/check-out (transitions)

**Jour du check-in** :
- 0h-12h : hors-gel (pas encore de pré-chauffage)
- 12h-15h : éco (pré-chauffage progressif)
- 15h-17h : confort (pré-chauffage final)
- **17h+** : réservation active (mode présence, occupé)

**Jour du check-out** :
- **0h-10h** : encore considéré occupé (voyageur sur place, prépare ses affaires)
- **10h+** : transition vers le mode suivant :
  - Check-in même jour → "entre deux réservations" (éco 9h-17h, sinon hors-gel)
  - Sinon → "pas de réservation" (hors-gel)

La condition `isCurrentlyOccupied` :
```
(arrival < today && departure > today)
|| (arrival === today && departure > today && hour >= 17)
|| (departure === today && hour < 10)
```

Elle n'existe plus qu'une fois : `isOccupiedAt` dans `lib/heating-schedule.ts`, derrière
`expectedHeatingMode`. Exception voulue : `heating-reset` traite le jour d'arrivée comme occupé
dès 12 h.

## Cron Jobs (via cron-job.org)

Le reset ne relit pas les radiateurs après application : un échec de commande n'apparaît que
dans `failures` de sa réponse. Les échecs de `heating-automation`, eux, partent par ntfy.
