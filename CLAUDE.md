# Coliving Barbusse

Site vitrine + dashboard privé pour un coliving au Mans (Airbnb, Booking, Abritel).

## Stack

- **Framework** : Next.js 16.1.6 (App Router, React 19, TypeScript)
- **Styling** : Tailwind CSS v4
- **Auth** : JWT via `jose` (HS256, cookie httpOnly, 90 jours)
- **Charts** : Recharts (dashboard)
- **i18n** : Système custom Context (FR/EN)
- **API externe** : Beds24 (disponibilité, réservations, séjour minimum)
- **Déploiement** : Vercel (auto-deploy sur push `main`)
- **Package manager** : npm

## Commandes

```bash
npm run dev      # Serveur de développement
npm run build    # Build production
npm run lint     # ESLint
npx tsc --noEmit # Vérification TypeScript
```

## Structure

```
app/
  (public)/           # Site vitrine (page d'accueil, chambres, réservation)
  (dashboard)/        # Dashboard privé (stats, calendrier)
  api/                # Routes API (auth, availability, dashboard)
components/
  public/             # Composants du site vitrine
  dashboard/          # Composants du dashboard
lib/
  i18n/               # Traductions FR/EN (dictionaries/, context, types)
  auth.ts             # JWT (createToken, verifyToken, setAuthCookie)
  beds24.ts           # Client API Beds24 (cache 5 min)
  calendar-utils.ts   # Utilitaires calendrier
  types.ts            # Types partagés (Beds24Booking, DashboardStats, etc.)
data/
  reviews.json        # 16 avis Airbnb (source: feed SociableKit)
public/images/
  house/              # 12 photos de la maison
  rooms/              # 9 dossiers chambre (chambre-1 à chambre-9)
middleware.ts         # Auth JWT + détection locale + contrôle rôles
```

## Conventions

- **Langue de communication** : Français
- **Path alias** : `@/*` pointe vers la racine du projet
- **Images externes** : Airbnb CDN (`a0.muscache.com`) configuré dans `next.config.ts`
- **Rôles auth** : `admin` (accès complet) et `viewer` (calendrier uniquement)
- **Photos** : triées par ordre alphabétique des noms de fichiers
- **Commits** : penser à commit/push régulièrement

## Données externes

- **Beds24** : Property ID `303771`, Room ID `633259`
- **Avis Airbnb** : Feed SociableKit `https://data.accentapi.com/feed/25659332.json` (filtrer pour ne garder que les avis Le Mans, exclure montagne/Paris)

## Variables d'environnement

```
DASHBOARD_PASSWORD      # Mot de passe admin
DASHBOARD_PASSWORD_VIEWER # Mot de passe viewer (calendrier)
DASHBOARD_SECRET        # Secret JWT (HS256)
BEDS24_API_TOKEN        # Token API Beds24
```
