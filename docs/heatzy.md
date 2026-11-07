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
