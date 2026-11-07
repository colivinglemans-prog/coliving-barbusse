# Chauffage — Heatzy Pilote Pro

> Référence détaillée du chauffage (API Heatzy, scheduling, alertes, dashboard, mode été, transitions) — complément de [CLAUDE.md](../CLAUDE.md), qui en résume les règles critiques. À lire avant de modifier ou d'expliquer le code de ce sujet.

## Heatzy Pilote Pro

- **API** : Gizwits (`https://euapi.gizwits.com`), App ID `c70a66ff039d41b4a220e198b0fcc8b3`
- **Auth** : Email/password → token 7 jours (lazy refresh dans `lib/heatzy.ts`)
- **13 radiateurs** sur 4 zones : RDC (5), Chambre RDC (1), 1er étage (5), Dernier étage (2)
- **Modes** : `cft` (confort), `eco`, `fro` (hors-gel), `stop`, `presence` (via `derog_mode: 3`)
- **Températures par défaut** : confort 19°C (20°C dernier étage), éco 15°C (printemps)
- **Température API** : valeurs en dixièmes (179 = 17.9°C), diviser par 10
- **Config** : `data/heatzy-zones.json` (device IDs, zones, nightMode, mapping Beds24)

### Logique scheduling (centralisée dans `lib/heatzy.ts`)

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

### Fonctions utilitaires (`lib/heatzy.ts`)

- `getOccupiedMode(zone, hour)` : mode selon zone + heure
- `getBetweenReservationsMode(hour)` : éco 9h-17h, sinon hors-gel
- `getHeatingRules(occupied, hour, sameDayTurnaround, nextCheckIn)` : règles affichées
- `getLockedDevices()` : lit `LOCKED_DEVICES` env var

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

Appliquée dans : `heating-automation`, `heating-reset`, et `dashboard/heating` (alertes + règles affichées).

## Cron Jobs (via cron-job.org)

Le reset vérifie après application que les devices ont bien pris les changements (températures). Si échec → alerte ntfy.
