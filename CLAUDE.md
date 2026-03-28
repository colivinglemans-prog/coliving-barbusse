# Coliving Barbusse

Site vitrine + dashboard privé pour un coliving au Mans (Airbnb, Booking, Abritel).

## Stack

- **Framework** : Next.js 16.1.6 (App Router, React 19, TypeScript)
- **Styling** : Tailwind CSS v4
- **Auth** : JWT via `jose` (HS256, cookie httpOnly, 90 jours)
- **Charts** : Recharts (dashboard)
- **Email** : Resend (alertes chauffage)
- **i18n** : Système custom Context (FR/EN)
- **API externes** : Beds24 (réservations), Heatzy/Gizwits (chauffage)
- **Déploiement** : Vercel (deploy via CLI `npx vercel --prod`)
- **Cron externe** : cron-job.org (plan Hobby Vercel limité aux crons quotidiens)
- **Package manager** : npm

## Commandes

```bash
npm run dev      # Serveur de développement
npm run build    # Build production
npm run lint     # ESLint
npx tsc --noEmit # Vérification TypeScript
npx vercel --prod # Déployer en production
```

## Structure

```
app/
  (public)/           # Site vitrine (page d'accueil, chambres, réservation)
  (dashboard)/        # Dashboard privé (stats, calendrier, chauffage)
  api/
    auth/             # Login, logout, me
    availability/     # Disponibilité Beds24 (public)
    dashboard/
      heating/        # GET status radiateurs, POST contrôle mode
        control/      # POST changer mode device/zone/global
        lock/         # GET/POST verrouiller/déverrouiller devices
      stats/          # Statistiques revenus
      bookings/       # Réservations Beds24
      calendar/       # Calendrier disponibilité
      properties/     # Propriétés Beds24
    cron/
      heating-automation/  # Check-in/check-out → mode présence/hors-gel
      heating-reset/       # Reset modes + températures (0h,4h,8h,12h,16h,20h)
      heating-health/      # Check connectivité + email alertes
components/
  public/             # Composants du site vitrine
  dashboard/          # Composants du dashboard
    HeatingZoneCard   # Carte zone avec contrôle groupé
    HeatingDeviceCard # Carte device (mode, temp, tendance, présence, alertes)
lib/
  i18n/               # Traductions FR/EN (dictionaries/, context, types)
  auth.ts             # JWT (createToken, verifyToken, setAuthCookie)
  beds24.ts           # Client API Beds24 (cache 5 min)
  heatzy.ts           # Client API Heatzy + logique scheduling
  email.ts            # Alertes email via Resend
  cron-auth.ts        # Vérification CRON_SECRET pour les cron jobs
  calendar-utils.ts   # Utilitaires calendrier
  types.ts            # Types partagés (Beds24, Heatzy, Dashboard)
data/
  reviews.json        # 16 avis Airbnb (source: feed SociableKit)
  heatzy-zones.json   # Config zones radiateurs + mapping Beds24
public/images/
  house/              # 12 photos de la maison
  rooms/              # 9 dossiers chambre (chambre-1 à chambre-9)
middleware.ts         # Auth JWT + détection locale + contrôle rôles
vercel.json           # Config Vercel (crons quotidiens)
```

## Conventions

- **Langue de communication** : Français
- **Path alias** : `@/*` pointe vers la racine du projet
- **Images externes** : Airbnb CDN (`a0.muscache.com`) configuré dans `next.config.ts`
- **Rôles auth** : `admin` (accès complet) et `viewer` (calendrier + chauffage lecture/contrôle)
- **Photos** : triées par ordre alphabétique des noms de fichiers
- **Commits** : penser à commit/push régulièrement
- **Deploy** : `npx vercel --prod` (auto-deploy GitHub cassé)

## Données externes

- **Beds24** : Property ID `303771`, Room ID `633259`
- **Avis Airbnb** : Feed SociableKit `https://data.accentapi.com/feed/25659332.json` (filtrer pour ne garder que les avis Le Mans, exclure montagne/Paris)

## Heatzy Pilote Pro

- **API** : Gizwits (`https://euapi.gizwits.com`), App ID `c70a66ff039d41b4a220e198b0fcc8b3`
- **Auth** : Email/password → token 7 jours (lazy refresh dans `lib/heatzy.ts`)
- **13 radiateurs** sur 4 zones : RDC (5), Chambre RDC (1), 1er étage (5), Dernier étage (2)
- **Modes** : `cft` (confort), `eco`, `fro` (hors-gel), `stop`, `presence` (via `derog_mode: 3`)
- **Températures par défaut** : confort 21°C (22°C dernier étage), éco 17°C
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

**Pré-chauffage** : confort dès 15h le jour d'un check-in (arrivée voyageurs à 17h)

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

## Cron Jobs (via cron-job.org)

| Job | URL | Fréquence |
|-----|-----|-----------|
| Automation | `/api/cron/heating-automation` | `*/15 * * * *` |
| Reset | `/api/cron/heating-reset` | `0 */4 * * *` |
| Health | `/api/cron/heating-health` | `*/30 * * * *` |

Authentifiés via header `Authorization: Bearer {CRON_SECRET}`.

Le reset vérifie après application que les devices ont bien pris les changements (températures). Si échec → email alerte.

## Variables d'environnement

```
DASHBOARD_PASSWORD       # Mot de passe admin
DASHBOARD_PASSWORD_VIEWER # Mot de passe viewer (calendrier + chauffage)
DASHBOARD_SECRET         # Secret JWT (HS256)
BEDS24_API_TOKEN         # Token API Beds24
HEATZY_EMAIL             # Email du compte Heatzy
HEATZY_PASSWORD          # Mot de passe du compte Heatzy
CRON_SECRET              # Secret pour les cron jobs
RESEND_API_KEY           # Clé API Resend (emails)
ALERT_EMAIL              # Email destination des alertes chauffage
LOCKED_DEVICES           # Device IDs verrouillés (comma-separated, optionnel)
```
