# Coliving Barbusse

Site vitrine + dashboard privé pour un coliving au Mans (Airbnb, Booking, Abritel).

Location à la **maison entière uniquement** depuis septembre 2026 (9 chambres, jusqu'à 20
personnes). La location à la chambre (propriété Beds24 310268, supprimée) ne survit que comme
archive en lecture seule — voir « Historique archivé ».

## Stack

- **Framework** : Next.js 16.4.5 (App Router, React 19.3, TypeScript)
- **Styling** : Tailwind CSS v4
- **Auth** : JWT via `jose` (HS256, cookie httpOnly, 90 jours) — mécanique dans `@sejour/socle`
- **Charts** : Recharts (dashboard)
- **PDF** : `@react-pdf/renderer` (factures LMNP, dashboard)
- **Paiements** : Stripe (lecture seule, utilisée pour générer des factures acquittées)
- **Alertes** : ntfy (`@sejour/socle/lib/ntfy`) — Resend retiré le 2026-11-07
- **i18n** : Système custom Context (FR/EN/IT/DE/ES)
- **API externes** : Beds24 (réservations, 4 voies), Heatzy/Gizwits (chauffage), Cozytouch/Overkiz (eau chaude), Nuki Web (serrure), Stripe (paiements)
- **Déploiement** : Vercel — **un `git push` sur `main` déploie la prod** (intégration GitHub) ; `npx vercel --prod` en secours
- **CI** : GitHub Actions (`.github/workflows/ci.yml`) — lint, types, tests, build à chaque push et PR, sans secret
- **Cron externe** : cron-job.org (plan Hobby Vercel limité aux crons quotidiens)
- **Package manager** : npm

## Commandes

```bash
npm run dev      # Serveur de développement
npm run build    # Build production
npm run lint     # ESLint
npm run typecheck # Vérification TypeScript (tsc --noEmit)
npm test         # Tests unitaires (vitest, tests/ hors tests/deploy)
npm run test:deploy # Contrôles post-déploiement contre la prod (DEPLOY_LEVEL=vital|full)
git push         # Sur main : déploie la production (intégration GitHub de Vercel)
```

## Documentation par sujet

Cinq sujets ont leur référence détaillée hors de ce fichier, dans des liens simples (non chargés d'office). **Avant de modifier ou d'expliquer le code listé, lire le fichier correspondant.** Les règles critiques restent résumées plus bas.

| Sujet | Fichier | Le lire avant de toucher ou d'expliquer |
|---|---|---|
| Factures PDF (LMNP) | [docs/factures.md](docs/factures.md) | `lib/invoice-config.ts`, `lib/invoice-number.ts`, `lib/stripe.ts`, `lib/taxe-sejour.ts`, `components/dashboard/InvoiceForm.tsx`, `app/(dashboard)/dashboard/invoices/**`, `app/api/dashboard/invoices/**`, `app/api/dashboard/taxe-sejour/**`, `@sejour/socle/lib/invoice-*` |
| Fiscalité LMNP / LMP | [docs/fiscal.md](docs/fiscal.md) | `lib/fiscal.ts`, `data/fiscal/*.json`, `app/(dashboard)/dashboard/fiscal/**`, `app/api/dashboard/fiscal/**`, `@sejour/socle/lib/fiscal/*`, variables `FISCAL_*` |
| Chauffage Heatzy | [docs/heatzy.md](docs/heatzy.md) | `lib/heatzy.ts`, `lib/heating-schedule.ts`, `data/heatzy-zones.json`, `app/api/dashboard/heating/**`, `app/api/cron/heating-*`, `app/(dashboard)/dashboard/heating/**`, `components/dashboard/Heating*` |
| Eau chaude Cozytouch | [docs/cozytouch.md](docs/cozytouch.md) | `lib/cozytouch.ts`, `app/api/dashboard/water-heater/**`, `app/api/cron/water-heater-*`, `app/(dashboard)/dashboard/water-heater/**`, `components/dashboard/WaterHeaterCard.tsx` |
| Surveillance, préparation d'arrivée, battement de cœur | [docs/surveillance.md](docs/surveillance.md) | `tests/deploy/**`, `.github/workflows/{surveillance,post-deploy}.yml`, `lib/readiness/**`, `app/api/cron/arrival-readiness`, `app/api/health/heartbeat`, `lib/heartbeat.ts`, `lib/alert-memory.ts`, toute route ouverte au viewer (`proxy.ts`) |
| Pricing (Beds24, Beyond, moteur) | [docs/pricing.md](docs/pricing.md) | `lib/pricing/**`, `app/api/dashboard/pricing/**`, `app/api/cron/pricing-*`, `app/(dashboard)/dashboard/pricing/**`, `components/dashboard/pricing/**`, `tests/pricing/**`, toute question de prix, markup, frais ou séjour minimum dans Beds24 |

## Structure

```
app/
  # Pas de layout.tsx ni de page.tsx à la racine : deux layouts racines (voir i18n).
  # `/` est négocié par proxy.ts (localeRedirect).
  [locale]/           # Site vitrine 5 langues (/fr/*, /en/*, /it/*, /de/*, /es/*)
    layout.tsx        # Layout RACINE du site : <html lang={locale}>, I18nProvider, metadata
    page.tsx          # Homepage (metadata/JSON-LD localisés, inclut ReservationCalendar)
    blog/
    chambres/         # Suites + ReservationCalendar
    guide-arrivee/    # Guide voyageurs noindex (#avant / #sur-place, Wi-Fi QR depuis l'env, Découvrir Le Mans calculé, Revenir)
    seminaires/
    # /fr/reservation supprimée (avril 2026) → redirect 301 vers /fr via proxy.ts (5 locales).
    # Le calendrier de dispo est sur la homepage (#disponibilite) et /chambres.
  (dashboard)/
    layout.tsx        # Second layout RACINE : <html lang="fr">, noindex
    dashboard/        # Dashboard privé (calendrier d'accueil, stats, chauffage) — hors [locale]
                      # page.tsx = redirection vers /dashboard/calendar
  api/
    auth/             # Login, logout, me
    availability/     # Disponibilité Beds24 (public)
    webhooks/beds24/  # Webhook « Booking » de Beds24 → passage de synchro Nuki
    dashboard/
      heating/        # GET status radiateurs, POST contrôle mode
        control/      # POST changer mode device/zone/global
        lock/         # GET/POST verrouiller/déverrouiller devices
        summer-mode/  # GET/POST toggle mode été (suspend automation, all stop)
      water-heater/   # Ballon thermodynamique Cozytouch : GET état, control/ POST
      stats/          # Statistiques revenus
      bookings/       # Réservations Beds24
      calendar/       # Calendrier disponibilité
      properties/     # Propriétés Beds24
      event-links/    # GET déliements réservation ↔ événement (Redis)
      nuki-status/    # GET état des codes serrure par réservation (admin only, sans PIN)
      pricing/        # Page pricing en simulation (admin only) + history/
      invoices/       # Factures PDF (Beds24 + Stripe)
        prefill/          # GET ?bookingId=… OU ?stripeId=… → payload pré-rempli
        generate/         # POST payload édité → PDF téléchargé
        stripe-payments/  # GET liste des derniers paiements Stripe réussis
      taxe-sejour/    # Taxe de séjour (Le Mans Métropole, trimestres + canaux)
      fiscal/         # Estimation IR + PS/SSI + test LMP
      bookings/[id]/notes/      # POST notes internes (admin only) → Beds24
      bookings/[id]/nuki-code/  # GET code serrure (admin only) ← infoItems NUKI_PIN
      bookings/[id]/messages/   # GET état des 2 boutons / POST envoi arrivée|départ (admin only)
      bookings/[id]/event-link/ # POST/DELETE délier/rétablir un événement (admin only)
    cron/
      heating-automation/  # Modes par zone (décalés), consignes ramenées, délestage (observation), alerte de coupure
      heating-reset/       # Reset modes + températures (0h,4h,8h,12h,16h,20h)
      heating-health/      # Check connectivité + alertes ntfy
      water-heater-automation/ # Éco 55 °C, Absence aux heures de pic (4 h 45-7 h, 16 h 45-22 h)
      water-heater-health/     # Absence manquante/restée, boost, mode, consigne, PAC à l'arrêt, hors ligne → ntfy
      checkin-notifications/   # Première ouverture au clavier → ntfy
      nuki-sync/               # Horaire : codes du clavier ← réservations Beds24
      beds24-keepalive/        # Lundi : échange des 4 refresh tokens Beds24
      beds24-backup/           # Dimanche (Vercel 03:00 UTC) : sauvegarde Beds24 → Blob privé
      events-watch/        # Hebdo : rappel des dates d'événements à confirmer / calendrier à remplir (ntfy)
      pricing-snapshot/    # Quotidien (Vercel 05:00 UTC) : photo prix/séjour min/dispo 365 j → Upstash
      pricing-report/      # Lundi (Vercel 06:00 UTC) : rapport d'évaluation du pricing (ntfy), ?dry=1
      pricing-review-reminder/ # Mardi (Vercel 07:00 UTC) : rappel « évaluation des prix avec Claude » (ntfy), ?dry=1
components/
  public/             # Composants du site vitrine
  dashboard/          # Composants du dashboard
    HeatingZoneCard   # Carte zone avec contrôle groupé
    HeatingDeviceCard # Carte device (mode, temp, tendance, présence, alertes)
lib/
  blog/
    posts.ts          # BLOG_POSTS avec locales = Record<Locale, LocalizedPost> (fr/en/it/de/es) + soldOut + nextEdition + supersededBy
    content/
      fr/             # 28 articles FR (Link hrefs préfixés /fr)
      en/             # 28 articles EN (Link hrefs préfixés /en)
      it/             # 28 articles IT (Link hrefs préfixés /it)
      de/             # 28 articles DE (Link hrefs préfixés /de)
      es/             # 28 articles ES (Link hrefs préfixés /es)
  events.ts           # LE_MANS_EVENTS (calendrier ACO + Hippodrome) + shortEventLabel.
                      # Type et fonctions dans @sejour/socle/lib/events (Lot 5).
  # periodes.ts, calendar-utils.ts, channel.ts, cron-auth.ts, ntfy.ts et time.ts vivent
  # désormais dans @sejour/socle — voir sa CLAUDE.md.
  i18n/               # Traductions FR/EN/IT/DE/ES (dictionaries/, context, types)
  property-info.ts    # PROPERTY_INFO (adresse, check-in/out par locale, contact, navigation links)
  wifi.ts             # Wi-Fi lu dans WIFI_SSID / WIFI_PASSWORD (plus dans le dépôt public), guide d'arrivée seulement
  auth.ts             # Configuration locale de @sejour/socle/lib/auth : rôles, préfixes
                      # de mots de passe, `guard` de route. N'importe PAS next/headers
                      # (proxy.ts tourne en edge) : les cookies sont dans le socle.
  beds24.ts           # Client API Beds24 (cache Next.js 60s : next.revalidate)
  bookings.ts         # getBookingsWithArchive() / getStays() : live + archive
  bookings-archive.ts # ARCHIVED_PROPERTY_IDS, withArchive() (fusion de l'archive 310268)
  access-sync.ts      # Synchronisation des codes de la serrure Nuki ← réservations Beds24
  heatzy.ts           # Client API Heatzy + logique scheduling
  cozytouch.ts        # Client Overkiz du ballon d'eau chaude
  event-links.ts      # Déliements réservation ↔ événement (Redis)
  guest-messages.ts   # Modèles de messages voyageur (5 langues) + detectGuestMessageKind
  pricing/            # Relevés quotidiens, rapport du lundi, moteur de prix en simulation
  redis.ts            # Client Upstash (KV_REST_API_URL / KV_REST_API_TOKEN)
  seo.ts, site.ts     # Chemins SEO ; SITE_URL, guideUrl(), guestLocaleFromCountry()
  alerts.ts           # Alertes d'exploitation des crons → ntfy (priorité 4)
  alert-memory.ts     # Règle commune des alertes : 2 passages de suite, pas de répétition, retour en priorité 1
  ntfy.ts             # sendNtfy du socle + journal 30 j : TOUT envoi ntfy du site passe par ici
  notify-log.ts       # Journal des notifications (Redis barbusse:ntfy:log), page /dashboard/alertes
  invoice-config.ts   # INVOICE_TEMPLATE (branding + mentions) et le préfixe du compteur.
                      # Le reste est dans @sejour/socle/lib/invoice-config (Lot 4).
  invoice-number.ts   # Le client Upstash, branché sur createInvoiceNumbering du socle.
                      # Clé invoice:counter:barbusse:{année}, avec reprise de l'ancienne.
  stripe.ts           # Client Stripe (listRecentPayments, getStripePayment)
  taxe-sejour.ts      # TAXE_SEJOUR_CONFIG — le seul barème du Mans. Moteur au socle.
  fiscal.ts           # Répertoire des données, accès Beds24 et collectivité, injectés
                      # dans @sejour/socle/lib/fiscal/* (les 8 fichiers de calcul).
  types.ts            # Types partagés (Beds24, Heatzy, Dashboard)
data/
  reviews.json        # 30 avis (Airbnb, Booking.com et 1 Abritel/Vrbo). Champs: text + hostReply optionnel + sourceLang + translations/hostReplyTranslations pré-générées par DeepL
  heatzy-zones.json   # Config zones radiateurs + mapping Beds24
  fiscal/
    2026.json         # Config annuelle : biens (Barbusse + Dahlias vendu), amortissements, ARD, charges
public/images/
  house/              # 12 photos de la maison
  rooms/              # 9 dossiers chambre (chambre-1 à chambre-9)
proxy.ts              # Ex-middleware.ts (nom de Next 16). Configure createDashboardProxy
                      # du socle : redirections legacy (5 locales), cookie, bornage viewer.
vercel.json           # Config Vercel (crons quotidiens)
scripts/              # beds24-backup, beds24-setup, compress-images, translate-reviews, generate-print-sheets…
tests/                # vitest (données inventées : le dépôt est public)
docs/
  journal.md          # Historique : récits datés, enquêtes, débogages résolus
  factures.md, fiscal.md, heatzy.md, cozytouch.md, pricing.md  # Référence par sujet (voir « Documentation par sujet »)
  refonte-pricing.md  # Plan et configuration Beds24 du pricing
  print/              # Fiches A4 (Wi-Fi, code serrure) — GITIGNORÉ, le dépôt est public
```

## Conventions

### Couleurs : tokens pour la marque, rampe brute pour l'information

Le rose Airbnb passe par les **tokens** du thème (`text-primary`, `bg-primary`,
`hover:text-primary-dark`, `border-border`, `bg-light-bg`), jamais par `text-rose-500`
(`#f43f5e` ≠ `#ff385c`). **Le Tailwind brut reste là où la couleur est l'information** (seuils
d'occupation, réalisé / confirmé) : les tokens sémantiques ne savent pas le dire. Les écrans
factures, taxe de séjour et fiscalité ne sont pas encore normalisés (historique :
docs/journal.md § Conventions).


- **Langue de communication** : Français
- **Path alias** : `@/*` pointe vers la racine du projet
- **Images** : toujours optimisées avant commit — resize max 1920px + JPEG qualité 82 (mozjpeg). Script : `node scripts/compress-images.mjs` (traite `public/images/*` > 400 KB, convertit PNG → JPG). **À lancer systématiquement à chaque nouvel ajout de photo.** Mettre à jour les refs `.png` → `.jpg` dans le code si conversion.
- **Images externes** : Airbnb CDN (`a0.muscache.com`) configuré dans `next.config.ts`
- **Droits photo** : ne jamais committer une image sans licence claire. Les photos de presse des organisateurs (ACO, Porsche Club Motorsport France) et les previews Getty/stock sont protégées — vérifier les métadonnées XMP (`dc:rights`, `xmpRights:Marked`) avant usage. Sources sûres : Wikimedia Commons (CC BY / CC BY-SA), Unsplash, ou nos propres photos. Une licence à attribution **exige** de remplir `BlogPostMeta.imageCredit` (auteur + page source + licence) : le crédit est rendu en légende sous la photo de l'article, avec le libellé localisé `PHOTO_CREDIT_LABEL`.
- **Rôles auth** : `admin` (accès complet) et `viewer` (calendrier, chauffage et eau chaude en lecture/contrôle — `allowedPaths` de `proxy.ts`).
  Mécanique dans `@sejour/socle/lib/auth` — voir sa CLAUDE.md, section « Lot 1 ».
  **Un jeton illisible vaut `viewer`, jamais `admin`** : aucun repli fail-open dans le `catch`
  de `getTokenRole` (historique : docs/journal.md § Conventions).
- **Photos** : triées par ordre alphabétique des noms de fichiers
- **Capacité** : **20 personnes** (9 chambres doubles ; chambres 8 et 9 avec clic-clac 1 place en plus). Source : `PROPERTY_INFO.maxGuests` + clé i18n `sleeping.doubleBedSofa` (rendue pour les chambres d'index ≥ 7 dans `SleepingArrangement`).
- **Zoom photo** : composant partagé [components/public/Lightbox.tsx](components/public/Lightbox.tsx) (plein écran, clavier ←/→/Échap, swipe tactile, scroll lock). Utilisé par SleepingArrangement (par chambre), CommonSpaces, Garden. La galerie d'accueil PhotoGallery garde sa propre implémentation historique.
- **Commits** : penser à commit/push régulièrement
- **Deploy** : un `git push` sur `main` déploie la prod via l'intégration GitHub de Vercel. `npx vercel --prod` reste possible en secours.

## Règles de travail

- **Dépôt public** (GitHub `colivinglemans-prog/coliving-barbusse`) : aucun secret, aucune donnée
  de réservation, aucun PIN dans le code, les logs, les tests ou les commits. Les archives
  `data/*.json` de réservations et `docs/print/` (fiches A4 avec Wi-Fi et code de serrure) sont
  gitignorés et doivent le rester. Rien ne se copie depuis `.env.local`.
- **Un push sur `main` déploie la prod.** Travailler sur une branche ; vérifier en preview
  (`npx vercel --scope colivinglemans-progs-projects`) avant de fusionner.
- **Plusieurs sessions travaillent dans ce dépôt** : jamais deux sessions dans le même arbre.
  Pour un chantier, `git worktree add -b <branche> <dossier> origin/main`.
- `git pull` avant d'attaquer un nouveau sujet ; mettre à jour ce fichier avant de pousser.
- **Socle `@sejour/socle`** : dépendance git épinglée par tag dans `package.json`. Une
  correction de mécanisme se fait dans le socle, pas ici ; une montée de version se déploie
  sur Albiez d'abord, se vérifie, puis sur Barbusse. Ne montent **jamais** au socle : le
  chauffage et l'eau chaude (`lib/heatzy.ts`, `lib/cozytouch.ts`, leurs routes et composants),
  les crons, les données du Mans (`lib/events.ts`, zone scolaire B), le bien et le voyageur
  (`lib/property-info.ts`, les **textes** des messages voyageurs — `lib/guest-messages.ts`,
  `lib/messages/templates.ts` —, guide d'arrivée, code Nuki). Le **moteur** des messages
  automatiques, lui, est au socle (`@sejour/socle/lib/guest-messaging`, v3.17.0) : deux appelants.
- Ce fichier est la **référence au présent**. Les récits datés, enquêtes et débogages résolus
  vont dans [docs/journal.md](docs/journal.md), sous le même titre de section.

## CI et tests

- **CI** : `.github/workflows/ci.yml` — `npm ci`, lint, `typecheck`, `test`, `build`, sur chaque push et PR. Le build ne doit exiger **aucune** variable d'environnement (vérifié sans `.env.local`) : une variable lue au build est un défaut à corriger dans le code, pas un secret à ajouter à la CI. Le socle, en `git+ssh` dans le lock, est forcé en HTTPS sur le runner.
- **Tests** : vitest, dans `tests/` (hors de `lib/`). Tests de caractérisation du rapport hebdomadaire du pricing et de `diffSnapshots`. Données **inventées** (dépôt public). Le socle est transformé par vitest (`server.deps.inline`) car il est publié en TypeScript source.
- **Contrôles post-déploiement et surveillance** (moteur du socle, attendus dans `tests/deploy/site.ts`) : `vital` toutes les heures, `full` chaque matin et après chaque déploiement, alerte ntfy et issue publique `surveillance-ko` **sans détail** à chaque changement d'état. Un résultat ne contient jamais un corps de réponse (logs publics). Détail, secrets attendus et KO connus : [docs/surveillance.md](docs/surveillance.md).
- **Non-régression d'une montée de version** : protocole du socle contre `next start` local, avant/après, avec `--compare` (voir le `CLAUDE.md` du socle). Le mot de passe admin local diffère de la prod : l'injecter par `BARBUSSE_ADMIN_PASSWORD` dans l'environnement, `loadEnvFile` n'écrase pas une variable déjà posée.

## TODO — dette technique restante (au 2026-11-07)

Chantier du 2026-11-07 (brief `../briefs/dette-technique.md`) : fait et déployé — Next 16.4.5, audit prod à 0, CI, vitest, sauvegarde Beds24 → Blob privé, alertes ntfy, socle v3.8.1 (Albiez et Barbusse). Reste :

**À surveiller**
- [ ] Premier passage automatique du cron `beds24-backup` : dimanche 2026-11-08, 03:00 UTC (notification ntfy priorité 1 attendue).
- [ ] Tester une **restauration** depuis une sauvegarde Blob (télécharger, dégzipper, relire) et l'écrire ici ; `scripts/beds24-backup.mjs` (sauvegarde manuelle locale) peut alors être retiré ou gardé en secours.

**Socle** (via `le-douanier`, déploiement Albiez d'abord)
- [ ] `lib/stats.ts:886` et `components/stats/format.ts:47` : `bookedAt.slice(0, 10)` = jour UTC → une réservation faite entre 0 h et 1 h/2 h (Paris) compte la veille (délai moyen de réservation, date courte des réservations récentes). Correctif « jour de Paris », comme les factures en v3.8.1.
- [ ] `projectedTotal` (`lib/fiscal/revenus.ts`) divise un réalisé qui inclut la nuit du jour par N−1 jours (≈ +0,5 %, simulation non opposable). À aligner sur `daysObserved`.
- [ ] Provenance de la taxe de séjour : indicatifs d'outre-mer (+262, +590, +594, +596) classés « Étranger » (`it.todo` dans les tests du socle) — à trancher avec `le-percepteur`.
- [ ] Protocole du socle à remettre à jour : le keepalive attend 3 voies Beds24 (il y en a 4 avec la messagerie) ; `/dashboard` admin attend 200 (il redirige, 307). Et les 17 « année absente de comparison[] » en local viennent de l'historique absent (`HISTORIQUE_BARBUSSE`) : documenter comment le fournir au protocole.
- [ ] CI GitHub Actions dans le socle (`npm test` + `npm run verifier`). Albiez : fait le 2026-11-07 (lint, types, tests, build).
- [ ] Aligner vitest : 5.0.5 ici, 4.1 dans le socle (qui garde `@types/node` 20).
- Non corrigé, décidé : quotient conjugal en dur dans `lib/fiscal/ir.ts` (sans effet pour un couple à 3 parts).

**Dépendances**
- [ ] `@react-pdf/renderer` 4.5 → 4.9 et `recharts` 3.7 → 3.10 : écartés faute de contrôle visuel (factures PDF, graphiques du dashboard). À monter avec une relecture à l'écran.
- [ ] Majeures non montées : `stripe` 23, `eslint` 10, `typescript` 7.
- [ ] `npm audit` (dev) : 8 alertes modérées (`minimatch` dans la chaîne ESLint), correctif cassant.

**Code et doc**
- [ ] 2 avertissements lint `no-location-assign-relative-destination` dans `dashboard/invoices/page.tsx` (passer par `router.push` ; celui du login est voulu).
- [ ] Ce fichier (1 400+ lignes) mêle documentation et journal : séparer le journal (`docs/journal.md`) de la doc de référence.

**Décisions reportées** (« on ne fait rien pour le moment »)
- Plan Vercel Hobby : usage commercial interdit par les CGU → Pro (20 $/mois) ou migration.
- Dépôts GitHub en privé (le socle exigerait alors un jeton pour Vercel).

## i18n (5 langues : fr / en / it / de / es)

- `Locale`, `LOCALES`, `DEFAULT_LOCALE`, `LOCALE_META`, `isLocale`, `localeFromAcceptLanguage` viennent de **`@sejour/socle/lib/locales`** et sont ré-exportés par `lib/i18n`. Ne plus redéclarer la liste des langues nulle part — c'est ce qui avait laissé `/chambres` annoncer quatre `hreflang` sur cinq.
- Dictionnaires dans `lib/i18n/dictionaries/{fr,en,it,de,es}.ts` — structure typée par `Dictionary`. Toute nouvelle clé doit être ajoutée aux 5 dicos. Les dictionnaires **restent ici**, le socle ne prend jamais de contenu.
- **`app/[locale]/layout.tsx` est le layout racine** : il rend `<html lang={locale}>` et valide la locale avec `isLocale`. `app/(dashboard)/layout.tsx` est le second layout racine (`lang="fr"`, `noindex`). Il n'y a plus d'`app/layout.tsx` — en ajouter un casserait le `lang` des cinq langues.
- `/` est négocié par `proxy.ts` (`localeRedirect` + `localeFromAcceptLanguage`, vrai tri par poids `q=` conforme RFC 9110). Il n'y a plus d'`app/page.tsx`.
- Header (`components/Header.tsx`) : dropdown 5 langues (libellés depuis `LOCALE_META[l].short`) + swap pathname `/{old}/...` → `/{new}/...`.
- `I18nProvider` n'a **pas** de `setLocale` : on change de langue en changeant d'URL. Ne pas réintroduire de cookie de langue ni de `document.documentElement.lang`.
- Blog : `BLOG_POSTS.locales` typé `Record<Locale, LocalizedPost>` — chaque post doit avoir les 5 metadata. Le composant article est résolu via `CONTENT[slug][locale]` dans `app/[locale]/blog/[slug]/page.tsx`, où les entrées sont des **imports paresseux** (`() => import(...)`). Les chemins doivent rester des littéraux : une expression `content/${locale}/${slug}` ferait perdre au bundler son analyse statique.
- Blog, rédaction (lot du 2026-11-08 : équipes de nuit, sport, équitation, concours et salons, exposants, 24 Heures Vélo, fêtes) : les **faits sur la maison** viennent **uniquement de `public/llms.txt`** — pas de tapis de course (tapis de yoga), pas d'Ethernet, pas d'appareil à raclette, tram T1 « au niveau de la gare », vélos rangés dans la salle zen, factures aussi pour clubs, associations et écoles. Les cas réels de voyageurs restent **anonymes**, et les avis cités viennent mot pour mot de `data/reviews.json`. Ranger un nouvel article à sa place chronologique dans `BLOG_POSTS`, et donner à chaque article sa propre date.
- Blog, parcours voyageur (`lib/blog/journey.ts`, 2026-11-08) : chaque article porte `journey` (au moins une étape parmi `evenement`, `groupe`, `preparer`, `sur-place`). La liste (`app/[locale]/blog/page.tsx`, `revalidate` 1 jour) affiche des pastilles par motif — Tous / Grands événements / Séjours de groupe / Pendant votre séjour (`preparer` ∪ `sur-place`) — via `FilterChips` du socle (v3.17.0) ; une pastille de moins de 3 articles ne s'affiche pas. Le filtre est **CSS** (`BlogListFilter` pose `data-active`, chaque carte porte `data-f`) : toutes les cartes restent dans le HTML. Ancres **fixes, jamais renommées** (liens du guide, des messages, des QR) : `#evenements`, `#groupes`, `#pendant-le-sejour`, puis `#preparer` / `#sur-place` quand chacune aura assez d'articles. Ordre : événements à venir aux dates officielles (par date), groupes, pendant le séjour, éditions passées. Archives `supersededBy` hors de la liste et de l'accueil. « Passé » est **calculé** (fin de l'`event` dépassée) : badge « Édition 2026 terminée », jamais « Complet » sans constat. Carte partagée `components/public/BlogCard.tsx` (dates de l'événement à la place de la date de publication). Accueil (`BlogSection`, serveur) : 3 prochains événements officiels puis 3 séjours de groupe. Tests : `tests/blog/journey.test.ts`.
- Blog, disponibilité en fin d'article : `event` (un seul événement : `EventBookingCTA` + JSON-LD `Event`), `events` (plusieurs clés de `LE_MANS_EVENTS`, ex. exposants : liste `EventDates`, événements `confirmed` seulement, fenêtre `stayWindow`, pas de JSON-LD), `familyDates` (fêtes : `FamilyDates`). `EventDates` et `FamilyDates` s'appuient sur `components/public/AvailabilityDates.tsx` (disponibilité lue à la visite, « Complet » jamais en dur). Dès qu'un article cite des dates d'événement à venir et officielles, lui donner `event` ou `events`.
- Pages avec T object local (seminaires, guide-arrivee, chambres) : maintenir les 5 entrées dans le `Record<Locale, ...>`.
- **Liens vers Beds24** : l'URL `booking2.php` doit porter `&lang=${locale}` pour que la page de paiement ET les Auto Actions soient dans la bonne langue. Les codes `Locale` (fr/en/it/de/es) sont déjà au format ISO 639-1 attendu par Beds24, pas de mapping nécessaire. Voir [components/public/ReservationCalendar.tsx](components/public/ReservationCalendar.tsx). Prérequis Beds24 : langues activées sur la booking page (Settings → Properties → Booking Page → Languages).
- Quand on ajoute une 6ᵉ locale : elle se déclare **dans le socle** (`lib/locales.ts` : `Locale`, `LOCALES`, `LOCALE_META`), et tout ce qui en dérive suit seul — `generateStaticParams`, les `hreflang` des six pages, le sitemap, la négociation de `/`. Reste à faire ici, et seulement ici : créer le dictionnaire, traduire tous les objets `T` locaux (seminaires, guide-arrivee, chambres), `PROPERTY_INFO.checkIn/checkOut`, les 28 articles de blog et leurs `BLOG_POSTS.locales`, et étendre la regex `/reservation` du `proxy.ts`.

## SEO

- `lib/seo.ts` compose **`@sejour/socle/lib/seo`** avec l'URL et le nom du site, et ne déclare plus que les chemins : `homePath`, `roomsPath`, `seminarsPath`, `arrivalGuidePath`, `blogPath`, `blogPostPath`.
- Toute page déclare ses `alternates` avec `alternatesFor(locale, unPathFor)` — **jamais** de liste `languages` écrite à la main.
- `app/sitemap.ts` construit ses `hreflang` avec le **même** `hreflangMap` que le `<head>`. Il conserve deux règles métier propres au site : le filtre `!post.supersededBy`, et pas de `lastModified` sur les pages statiques.
- `openGraph` : la fusion de Next est **en surface**. Une page qui déclare un bloc `openGraph` remplace celui du layout et perd `og:image` / `og:site_name` ; une page qui n'en déclare pas hérite du titre et de l'URL **de l'accueil**. Depuis le 2026-11-08, chaque page indexable passe donc par `pageOpenGraph(locale, { title, description, url })` et `pageTwitter(…)` de `lib/seo.ts` (image `DEFAULT_OG_IMAGE`, 1536 × 1024, `siteName`, `type`). Les articles gardent leur propre bloc (image de l'article, sans dimensions déclarées).
- **JSON-LD de `/seminaires`** : deux nœuds, `LodgingBusiness#lodging` et `FAQPage#faq`. Celui de l'accueil décrit la maison, celui-ci décrit **ce qu'elle permet en séminaire** — d'où `maximumAttendeeCapacity: 20`, la capacité de travail assis en intérieur chauffé (grande table de 16 places + les 2 mini-tables de la véranda, depuis novembre 2026 ; avant, 12 à l'îlot). Les questions de la `FAQPage` sont celles rendues dans la page, avec des réponses autosuffisantes : Google en extrait une seule, elle doit rester vraie hors contexte.
- `app/robots.ts` ne bloque que `/dashboard/` et `/api/dashboard/`. **Ne pas y remettre `/api/`** : Googlebot exécute le JS du calendrier et le photographierait vide.
- **`coliving-barbusse.vercel.app` → 301 vers www** (`next.config.ts`, `redirects()` avec `has: host`) : c'était le seul domaine indexé par les moteurs des assistants IA (test voyageur du 2026-11-07). Hôte exact (les previews ne sont pas touchées), **`/api/*` exclu** (les crons Vercel ne suivent pas les redirections).

## Données externes

- **Beds24** : Property ID `303771`, Room ID `633259`
- **Avis Airbnb** : Feed SociableKit `https://data.accentapi.com/feed/25659332.json` (filtrer pour ne garder que les avis Le Mans, exclure montagne/Paris)

### Traduction des avis (DeepL)

- Les avis sont pré-traduits **statiquement** dans toutes les locales du site via le script `npm run translate-reviews` (cf. [scripts/translate-reviews.mjs](scripts/translate-reviews.mjs)).
- Champs ajoutés par le script dans chaque entrée de [data/reviews.json](data/reviews.json) : `sourceLang` (langue détectée par DeepL), `translations` (map locale → texte), et idem pour `hostReply` → `hostReplyTranslations` quand l'avis a une réponse de l'hôte.
- Le composant [components/public/AirbnbReviews.tsx](components/public/AirbnbReviews.tsx) affiche la traduction quand `sourceLang !== locale courante` et propose un toggle « Traduit automatiquement · Voir l'original » (UX Airbnb-like). Si l'avis est dans la langue du visiteur, le texte original s'affiche sans bouton.
- À relancer après chaque ajout/modif d'avis (mode incrémental — ne retraduit que ce qui manque). `--force` pour tout retraduire.
- Variable env locale **`DEEPL_API_KEY`** (compte Free DeepL, suffixe `:fx`). N'est pas déployée sur Vercel (script local uniquement).
- Pour ajouter une réponse d'hôte : éditer manuellement le champ `hostReply` dans l'avis concerné, puis relancer le script.

## Pricing (Beds24, Beyond, moteur en simulation)

Politique tarifaire configurée **dans Beds24**, pas dans le code : le site n'affiche aucun prix en dur. **Le direct doit toujours être moins cher qu'Airbnb** (remise directe −7 %). Le cron `pricing-snapshot` relève chaque jour prix, séjour minimum et dispo sur 365 j (Upstash, sans TTL) ; le moteur maison (`lib/pricing/engine.ts`) tourne en simulation ; **la sortie de Beyond est engagée** (plan du 2026-11-14, bascule visée le 01/12/2026) : `lib/pricing/push.ts` sait écrire prix et séjours minimum dans Beds24, mais **rien ne part tant que `PRICING_PUSH_MODE` n'est pas `live`** (absent = `off`).
- ⚠️ **Ne jamais ajouter `/dashboard/pricing` ni `/api/dashboard/pricing` à `allowedPaths`** de `proxy.ts` : page admin, interne (aucun chiffre du moteur dans `/dashboard/stats`).
- ⚠️ **Une seule porte d'écriture des prix : `lib/pricing/push.ts`, appelée par le seul cron `pricing-push`.** Le jeton `BEDS24_PRICING_REFRESH_TOKEN` (voie `tarifs`) n'a **aucun repli** et `writeCalendar` n'est importé nulle part ailleurs (test `tests/pricing/push-import.test.ts`). Aucune route du dashboard n'écrit dans Beds24 : le coupe-circuit n'écrit que dans Redis. Les bornes absolues et planchers d'événement (`lib/pricing/guards.ts`) ne viennent pas d'`ENGINE_CONFIG` et **ne s'assouplissent jamais pour faire passer un envoi** : on corrige la grille ou un prix forcé.
- ⚠️ Beds24 ne sait pas plafonner la taxe de séjour : jamais 2,75 % sur le direct, un forfait bas. Jamais un frais ou une remise actifs **à la fois** sur Airbnb et dans Beds24 (double comptage).
- Détail complet (markups, occupation, paliers, frais, HomeToGo, relevés, moteur, page v1.1, essais 2027) : [docs/pricing.md](docs/pricing.md).

## Calendrier public de réservation

`components/public/ReservationCalendar.tsx` n'est qu'une enveloppe : le calendrier vit dans
**`@sejour/socle/components/ReservationCalendar`**, commun avec Albiez depuis le Lot 5
(historique : docs/journal.md § Calendrier public de réservation).

Restent ici : `propertyId` (303771), la route `/api/availability?mode=map`, la capacité, et
les libellés hors section `calendar` — la seule section de dictionnaire commune aux deux
sites, dont la forme (`CalendarLabels`) est maintenant **définie dans le socle** et vérifiée à
la compilation des cinq dictionnaires.

Le composant du socle porte un `sandbox` 3-D Secure sur l'iframe de paiement
(`allow-top-navigation-by-user-activation`), plafonne adultes + ados à la capacité, et met à
jour la disponibilité par `setAvail((prev) => …)` fonctionnel. Les chevrons de mois ont leurs
propres libellés (`calendar.previousMonth` / `calendar.nextMonth`, et `calendar.close`).

⚠️ **Le moteur de sélection est hors du composant**, dans `@sejour/socle/lib/stay-selection`
(`isValidCheckIn`, `isValidCheckOut`, `cellState`, `selectionAfterClick`) : c'est le chemin qui
produit le chiffre d'affaires direct, il se teste sur une vraie réponse Beds24, sans navigateur.

## Réservation par IA (`/api/agent/*`, `/[locale]/devis/[token]`)

`lib/agent.ts` déclare la maison à `@sejour/socle/lib/stay-agent` : une seule route publique
`app/api/agent/[tool]/route.ts` (`info`, `availability`, `quote`, `find`, `openapi`, en GET,
CORS ouvert), documentée dans `public/llms.txt`. Le prix vient de `getroomprice.php` (total
Beds24 tout compris) et passe un **garde-fou** : `breakdown` (le détail montré au voyageur) recalcule la grille (nuits
−7 %, ménage 280, linge 15 €/voyageur, taxe 2,20 €/**adulte**/nuit). Un écart de plus de 1 €
bloque le prix (`price-blocked`) et envoie un ntfy « Devis IA Barbusse » : c'est le signal
qu'un réglage Beds24/Beyond a changé la grille — corriger `breakdown`, pas le contourner. IndexNow : `npm run indexnow` (clé publique dans `public/<clé>.txt`) soumet sitemap + llms.txt à Bing et aux moteurs participants, à lancer après chaque déploiement de contenu.

- Politiques servies aux IA = `CANCELLATION_POLICY` / `PAYMENT_POLICY` de `lib/property-info.ts`.
- Arrivée le jour même : le devis porte une consigne d'appeler l'hôte (`lastMinute`).
- La page de devis revérifie dispo et prix à chaque affichage ; non indexée.
- **Conditions de réservation** : `app/[locale]/conditions/page.tsx` (5 langues, `conditionsPath`, au sitemap, liée depuis le pied de page et `llms.txt`). Nombres lus dans `PROPERTY_INFO` / `CANCELLATION_POLICY` / `PAYMENT_POLICY`, texte d'annulation généré par `cancellationText` du socle. Pied de page : « Paiement et réservation » (instantané par carte ; entreprises sur facture, 30 %).
- **Mentions légales** : `app/[locale]/mentions-legales/page.tsx` (5 langues, `legalPath`, `noindex, follow`, hors sitemap, liée depuis le pied de page). Identité EI (nom, statut, SIREN) dans `lib/legal.ts` avec l'hébergeur Vercel ; adresse et contact lus dans `PROPERTY_INFO` ; données personnelles renvoyées aux conditions. Médiateur de la consommation à ajouter une fois désigné.
- Le calendrier se pré-remplit par `?arrivee=&depart=&adultes=&enfants=` (socle).
- **Connecteur MCP** : `app/api/mcp/route.ts` (`createMcpRoute`, socle v3.12.0), mêmes outils que `/api/agent/*` via `runTool`, sans état. Route publique ; à couvrir par la règle Vercel Firewall comme `/api/agent/*`.
- Tests voyageur à rejouer à chaque lot : voir le plan du chantier (mémoire « tests voyageur IA »).

## Cloisonnement du dashboard

Trois portes, dans cet ordre. Aucune n'est suffisante seule.

| Porte | Où | Ce qu'elle fait |
|---|---|---|
| `proxy.ts` | racine | Cookie exigé sur `/dashboard` et `/api/dashboard`. **Liste blanche** des chemins ouverts à `viewer` — l'ancien middleware tenait une liste noire de quatre préfixes, et c'est ainsi que `bookings` est resté ouvert. |
| `guard` de route | `@/lib/auth` | `guard.denyNonAdmin(req)` en tête des routes sensibles : `invoices/prefill`, `bookings/[id]/notes`, `bookings/[id]/nuki-code`, `bookings/[id]/messages`. |
| DTO | `@sejour/socle/lib/booking-dto` | `/api/dashboard/bookings` projette vers `BookingListItem` (15 champs) ou `AdminBookingListItem` (+`price`, `email`, `mobile`, `phone`, `country`). |

**Deux protections contre la fuite des `NUKI_PIN`**, fermée le 2026-09-11 (historique et
mesures : docs/journal.md § Cloisonnement du dashboard) :

1. À la source : la fusion de l'archive dépouille les réservations archivées de leurs
   `infoItems` et `invoiceItems` quand l'appelant ne les a pas demandés — symétrie avec l'API,
   où ce qu'on n'a pas demandé n'est pas là. C'est dans `withArchive()`
   ([lib/bookings-archive.ts](lib/bookings-archive.ts)), appelé par `getBookingsWithArchive()`
   ([lib/bookings.ts](lib/bookings.ts)).
2. À la sortie : le DTO en liste blanche, qui protège aussi des champs que Beds24 ajoutera.

⚠️ **`includeInfoItems: true` n'est légitime qu'à cinq endroits** : `getBookingById` (donc
`nuki-code` et `invoices/prefill`, toutes deux admin-only), `findBookingByStripeIds` (matching
`STRIPEPAYMENT`), `getAllBookingsRaw` (cron `beds24-backup`, vers un Blob privé), la
synchronisation Nuki (`lib/access-sync.ts`, qui lit et écrit `NUKI_PIN`), et le cron
`checkin-notifications` (qui lit encore en secours l'ancien code `CHECKIN`). Tous sont derrière
une garde admin ou `CRON_SECRET` ; aucun PIN ne part vers le navigateur hors des routes admin.

## Beds24 API (v2)

**Quatre tokens — un par chemin, pas par verbe.** Les trois premiers datent du 2026-09-11
(rotation complète après la découverte de quatre secrets en clair dans
`.claude/settings.json`) ; la messagerie s'est ajoutée le 2026-09-22.

| Variable | `deviceName` | Scopes | Chemin servi |
|---|---|---|---|
| `BEDS24_PUBLIC_REFRESH_TOKEN` | `coliving-barbusse-public-2026-09` | `read:inventory`, `read:properties` | `/api/availability`, vitrine |
| `BEDS24_READ_REFRESH_TOKEN` | `coliving-barbusse-lecture-2026-09b` | + `read:bookings`, `read:bookings-personal`, `read:bookings-financial` | dashboard, factures, fiscal |
| `BEDS24_REFRESH_TOKEN` | `coliving-barbusse-ecriture-2026-09` | `read:bookings`, `write:bookings` | consignes de ménage, `NUKI_PIN`, confirmation `new` → `confirmed` |
| `BEDS24_MESSAGES_REFRESH_TOKEN` | `coliving-barbusse-messagerie-2026-09` | `read:bookings`, `read:bookings-personal`, `write:bookings-personal` | messages voyageur |
| `BEDS24_PRICING_REFRESH_TOKEN` | `coliving-barbusse-tarifs-AAAA-MM` | `read:inventory`, `write:inventory` | envoi des prix (`lib/pricing/push.ts` seul), **à créer** — voir `docs/pricing.md` |

Vérifiés contre l'API, pas supposés : le public reçoit `401` sur `/bookings`, la lecture ne
peut pas écrire, l'écriture ne voit ni `price`, ni `commission`, ni `invoiceItems`.

**Règles des quatre voies** (justifications : docs/journal.md § Beds24 API (v2)) :
- `/bookings/messages` exige la variante `-personal` des scopes, en lecture **comme** en
  écriture : d'où un jeton dédié plutôt qu'un jeton d'écriture élargi. Cette voie n'a **aucun
  repli** — un envoi dégradé écrirait sous un autre privilège ou ferait croire au départ.
- La page publique a son propre jeton (inventaire seulement). Sur 401, le repli va vers le
  jeton de **lecture** — jamais vers l'écriture.
- **Aucun long life token** (`BEDS24_API_TOKEN` retiré le 2026-09-11). Un refresh token meurt
  après 30 jours sans usage ; le cron keepalive échange les quatre chaque semaine.

⚠️ **`vercel env add --force` ne remplace pas toujours une variable `Secret` existante**, et
échoue en silence si l'on masque sa sortie. Pour une rotation : `vercel env rm` puis
`vercel env add`. L'âge affiché par `vercel env ls` est la date de **création**, pas de mise à
jour — il ne prouve rien. La seule vérification qui tranche est le keepalive, qui échange
réellement chaque jeton et nomme celui qui échoue.

**Le refresh token s'obtient ainsi :**
- Via un *Invite code* (à usage unique, durée de validité courte — voir « Keepalive Beds24 ») portant les scopes de la voie (tableau ci-dessus).
- Échange invite code → refresh token via `scripts/beds24-setup.mjs <INVITE_CODE>` OU via curl direct :
  ```bash
  curl -H 'code: <INVITE_CODE>' -H 'deviceName: coliving-barbusse-<voie>-AAAA-MM' \
    https://api.beds24.com/v2/authentication/setup
  ```
- Le client du socle échange ensuite le refresh token contre un access token (24h, caché en mémoire, marge de 60 s) via `/authentication/token`.
- Le jeton d'**écriture** sert à `updateBookingNotes()` (notes internes), `addNukiPin()` (écriture du `NUKI_PIN`) et `confirmBooking()` (passage `new` → `confirmed`).

**Vérifier les scopes d'un token** :
```bash
curl -H 'token: <TOKEN>' https://api.beds24.com/v2/authentication/details
```

**Vercel** : les quatre refresh tokens (`BEDS24_PUBLIC_REFRESH_TOKEN`, `BEDS24_READ_REFRESH_TOKEN`, `BEDS24_REFRESH_TOKEN`, `BEDS24_MESSAGES_REFRESH_TOKEN`) doivent être configurés sur Production + Development.

### Le transport et les types viennent du socle

[lib/beds24.ts](lib/beds24.ts) ne fait pas d'HTTP : échange des jetons, cache d'access tokens,
replis, écriture de note (y compris le « 200 avec `success: false` ») et réexpansion des
tranches de calendrier vivent dans `createBeds24Client` (`@sejour/socle/lib/beds24-client`).
Restent ici les noms des variables, la traduction vers `Booking` et les lectures propres au
bien (rapprochement Stripe, propriétés, PIN Nuki, confirmation). Les replis sont **deux
champs** : `whenMissing` (variable absente) et `whenRefused` (jeton refusé, échange impossible
ou 401) ; la voie publique a les deux vers la **lecture**, la voie de lecture n'en a aucun.

⚠️ **`expandSpans` itère en UTC** : ne jamais composer un jour par `new Date(jour + "T00:00:00")`
puis le relire par `toISOString()` — minuit local relu en UTC, décalage d'un jour hors de
Vercel (historique : docs/journal.md § Beds24 API (v2)).

### `Booking` canonique, et `Beds24Booking` pour ce qui parle à l'API

Le type canonique est **`Booking`** (`@sejour/socle/lib/booking`), vers lequel se traduisent les
deux sources (live et archive). Champs requis : `ref`, `channel` (déjà normalisé), `arrival`,
`departure`, `nights`, `gross`, `net`, `commission`, `source` (`"live"` | `"archive"`). Tout le
reste est optionnel, **l'identité du voyageur comprise** : Albiez ne porte pas
`read:bookings-personal`, aucun calcul du socle ne doit en dépendre. Les types de transport
(`Beds24Booking`, `Beds24InfoItem`, `Beds24InvoiceItem`, `Beds24Property`) viennent de
`@sejour/socle/lib/beds24-types`, réexportés par [lib/types.ts](lib/types.ts) ; ce qui a besoin
d'`invoiceItems` ou d'`infoItems` (factures, taxe de séjour, commissions fiscales, code Nuki,
notifications d'arrivée) travaille sur la forme brute (historique : docs/journal.md § Beds24 API (v2)).

### Historique archivé (propriété "à la chambre" supprimée)

La propriété **310268** ("Coliving Henri Barbusse", location à la chambre) a été supprimée du compte
Beds24 (coût d'abonnement) — l'activité est désormais **maison entière uniquement** (303771). Ses
réservations n'existent donc plus dans l'API. On les conserve pour les dashboards + le moteur fiscal via
un merge transparent :

- **Sauvegarde** : `scripts/beds24-backup.mjs` aspire tout le compte par API et écrit deux fichiers,
  **tous deux ignorés par git depuis le 2026-09-13** — ils portent noms, e-mails et téléphones des
  voyageurs, et ce dépôt est public (ils y ont été versionnés du 24/07 au 13/09, un commit, `e807f68`) :
  - `data/beds24-raw-backup.json` — dump brut intégral (disaster recovery, **non lu au runtime**).
  - `data/bookings-archive.json` — sous-ensemble `propertyId ∈ ARCHIVED_PROPERTY_IDS` (310268),
    **lu au runtime en local seulement**. Lancer : `node --env-file=.env.local scripts/beds24-backup.mjs`.
- **En production, l'archive vient de la variable `HISTORIQUE_BARBUSSE`** : le JSON minifié, sans
  `infoItems` (les codes de serrure n'ouvrent plus rien), gzippé puis base64 — 12,5 Ko pour 42 séjours.
  Cascade de chargement identique à Albiez : variable → fichier local → rien, avec `archiveOrigin()`
  pour que le dashboard puisse le dire. Régénérer la valeur :
  `node -e 'const z=require("zlib"),f=require("fs");const a=JSON.parse(f.readFileSync("data/bookings-archive.json","utf8")).map(({infoItems,...b})=>b);process.stdout.write(z.gzipSync(Buffer.from(JSON.stringify(a))).toString("base64"))' | npx vercel env add HISTORIQUE_BARBUSSE production --force`
  — puis déployer. Vercel plafonne l'ensemble des variables d'un déploiement à 64 Ko.
- **Corrections dans l'archive** : la propriété n'existe plus dans Beds24, on corrige le fichier
  (détail : docs/journal.md § Historique archivé). Contrôle : `price = Σ lignes (+ commission
  Airbnb)` doit tenir sur toutes les lignes vendues.
- **Merge** : [lib/bookings-archive.ts](lib/bookings-archive.ts) (`ARCHIVED_PROPERTY_IDS`, `withArchive()`) sur le mécanisme générique `createArchive`
  (`@sejour/socle/lib/archive`) : dédup par `id`, **le live gagne**, on n'injecte que les résas
  archivées absentes du live et matchant les mêmes filtres (dates + statuts). Les stats classent
  310268 en `type:"room"` ; le fiscal garde `310268` dans `propertyIds` de `data/fiscal/2026.json`.
- ⚠️ **Le merge n'est pas dans `getBookings()`** : un client d'API ne doit jamais ajouter en
  silence des lignes que l'API n'a pas renvoyées ; la fusion est exposée à ses appelants,
  comme chez Albiez (historique : docs/journal.md § Historique archivé).
  - `getBookings()` ([lib/beds24.ts](lib/beds24.ts)) : le live seul, tel que l'API le rend.
  - `getBookingsWithArchive()` ([lib/bookings.ts](lib/bookings.ts)) : live + archive, forme
    Beds24 brute. Pour ce qui a besoin d'`invoiceItems` / `infoItems` : factures, fiscal, taxe
    de séjour, code Nuki, notifications d'arrivée, calendrier.
  - `getStays()` (même fichier) : live + archive, traduits en `Booking` canonique. Pour ce qui
    **calcule** — aujourd'hui `/api/dashboard/stats`.
- Endpoints d'inventaire (`getAvailability`/`getDailyPrices`/`getMinStay`) et `updateBookingNotes` ne
  concernent pas l'archive (historique en lecture seule).

## Serrure Nuki — synchronisation des codes

Depuis le 2026-11-07, les codes du clavier sont posés par ce site, plus par le connecteur
payant Beds24 → Nuki, qui ne poussait plus rien depuis mai 2026 : la serrure de
remplacement (Smart Lock Ultra, id dans `NUKI_SMARTLOCK_ID`) n'avait pas Nuki Web activé.
⚠️ La serrure morte, toujours dans le compte, s'appelle **aussi** « Barbusse » : toujours viser l'id.

| Pièce | Rôle |
|---|---|
| `@sejour/socle/lib/access-codes` (v3.8.0) | Planificateur pur : quoi créer, recaler, reprendre, supprimer. |
| `@sejour/socle/lib/nuki` | Client Nuki Web, erreurs expurgées des PIN. |
| [lib/access-sync.ts](lib/access-sync.ts) | Lit Beds24 + serrure, exécute dans l'ordre du plan, alerte (ntfy, **au passage horaire du cron seulement**, règle commune : `barbusse:alert:nuki-lock` et `…:nuki-codes`, deux passages de suite). Verrou Redis `nuki:sync:lock`. |
| `/api/cron/nuki-sync` | Passage horaire (cron-job.org). `?dry=1` = plan sans écriture. |
| `/api/dashboard/nuki-status` | **Admin seulement.** État du code par réservation (`ok` / `pending` / `error`), calculé à blanc par le planificateur, sans PIN. Alimente la pastille des barres du calendrier (vert / ambre / rouge) et une ligne dans la fiche. |
| `/api/webhooks/beds24` | Webhook « Booking » de Beds24, en-tête `x-webhook-secret`. Déclenche un passage : PIN posé en quelques secondes pour une réservation de dernière minute. Le corps n'est pas lu. |

**Règles de l'exploitant** : code valable de **14 h le jour d'arrivée à 14 h le jour du
départ** ; nom `<n° de réservation>: <Prénom>` ; statuts `confirmed` et `new` seulement
(`request`, `inquiry`, `black` : rien) ; annulation → code supprimé ; modification → plage
recalée ; séjour terminé → supprimé. Une réservation `new` est **passée en `confirmed`**
(`confirmBooking`, jeton `ecriture`) une fois son PIN dans Beds24 et son code sur la serrure. **Codes `# …` (manuels) jamais touchés** — préfixer de
`# ` tout code saisi à la main qui doit survivre.

**Le PIN** est tiré des 6 derniers chiffres du téléphone du voyageur quand ils respectent les
règles du clavier (1 à 9, pas « 12 » en tête) et sont libres, sinon au hasard. Il est écrit
dans Beds24 (`addNukiPin`, jeton `ecriture`) **avant** d'être posé sur la serrure ; si
l'écriture échoue, le code n'est pas posé. Le gabarit Beds24 le lit par
`[BOOKINGINFOCODETEXT:NUKI_PIN]`, et l'auto-action « Before arrival - Send Nuki PIN » est
conditionnée à la présence de ce code (« All Booking Info Codes »).

**Variables** : `NUKI_API_TOKEN`, `NUKI_SMARTLOCK_ID`, `NUKI_SYNC_MODE` (`live` pour écrire ;
toute autre valeur = à blanc), `BEDS24_WEBHOOK_SECRET`.

**Pièges payés le 2026-11-07** :
- Une mise à jour Nuki (`POST …/auth/{id}`) **efface les champs non renvoyés** — un renommage
  seul a rendu un code daté permanent. Le socle renvoie toujours l'objet complet.
- Un PIN est unique par serrure (`409`), et **le message du 409 contient le PIN en clair**.
- `getBookings` envoyait `status=a,b` : Beds24 répond `400`. Une requête par statut
  désormais ; et **sans statut, l'API omet les annulées**.
- La réponse Beds24 à l'ajout d'un `infoItem` renvoie son texte : jamais de corps de
  réponse dans une erreur de `addNukiPin`.
- Python (`urllib`) refuse le certificat de `api.beds24.com` : scripts en Node.

## Chauffage Heatzy (ne monte jamais au socle)

`lib/heatzy.ts` pilote 15 radiateurs sur 4 zones (API Gizwits, `data/heatzy-zones.json` avec le mapping Beds24) : crons `heating-automation`, `heating-reset`, `heating-health`, page `/dashboard/heating` (contrôle ouvert au `viewer`).
- **Une seule règle** : `expectedHeatingMode` (`lib/heating-schedule.ts`), utilisée par l'automatisation, le reset, le dashboard et la préparation d'arrivée ; **la référence est l'automatisation**. `heating-reset` compte le jour d'arrivée comme occupé dès 12 h (il coupait le préchauffage avant le 2026-11-07).
- **Occupation** (`isOccupiedAt`) : réservation active à **17 h** le jour d'arrivée, maison libérée à **10 h** le jour du départ ; pré-chauffage éco 12 h puis confort 15 h (montée progressive pour ne pas faire sauter les plombs). Heure toujours via `@sejour/socle/lib/time`.
- ⚠️ **Délestage (2026-11-09, coupures à 9 kVA ; 15 radiateurs ACOVA Atoll LCD 1 000 W)** :
  - **Montées en chauffe échelonnées** par zone (`staggerMinutes`, `zoneHour`) : **dernier étage −15 min, RDC et chambre RDC à l'heure, 1er +15 min** (confort du soir 19 h 45 / 20 h / 20 h 15). Les descentes (7 h, départ 10 h, arrivée 17 h) restent à l'heure partout (décision de l'hôte). Toujours passer la **minute** de Paris à `expectedHeatingMode` / `resetTarget`.
  - **Charge estimée** (`lib/radiator-load.ts`) : à fond si écart ≥ 1 °C ou `Heating_state = 1`, un tiers en régulation, **hors ligne = 100 %**. Plafond et budgets dans `lib/electrical-budget.ts` (**un chiffre à changer au passage à 12 kVA**).
  - **Délestage tournant** (`lib/load-shedding.ts`) : au-delà du plafond (6 kW à 9 kVA), des étages passent en éco un quart d'heure, ordre **dernier → 1er → chambre RDC, jamais le RDC** ; `heating-reset` respecte les zones délestées (Redis `barbusse:heating:shed`). ⚠️ **En observation** (`LOAD_SHEDDING_MODE = "observe"`) : calculé et affiché, **non appliqué** — le 9/11 à 21 h 54 l'estimation donnait 13,3 kW alors que le compteur tenait ; actif, il aurait mis les 9 chambres en éco toute la nuit. Passer en `"active"` seulement après calibrage (Linky).
  - **Consignes montées par les voyageurs ramenées toutes les 15 min** par `heating-automation` (boutons des Heatzy laissés libres, choix de l'hôte).
  - **Alerte de coupure** (`lib/power-cut.ts`) : 3 radiateurs ou plus hors ligne au même passage → coupure soupçonnée ; **toujours hors ligne au passage suivant** → ntfy priorité 5, puis « courant revenu » en priorité 1.
  - La charge du passage est mémorisée (`barbusse:heating:load`) pour le dashboard.
- Températures de l'API en dixièmes (179 = 17,9 °C). **Mode été** (Redis `heatzy:summer-mode`) : automation et reset en no-op, `heating-health` reste actif. `LOCKED_DEVICES` : devices tenus en hors-gel, ignorés par les crons. `alerts: false` sur un appareil de `data/heatzy-zones.json` : piloté, mais jamais dans une alerte (**Véranda D**, panne connue, 2026-11-14 ; voir docs/surveillance.md).
- **Préparation d'arrivée** (`/api/cron/arrival-readiness`, lecture seule) : serrure, radiateurs et ballon contrôlés la veille 19 h et le jour J (12h30, 15h30, 16h30), non-arrivée signalée le lendemain 9 h, pile de la serrure chaque matin ; silence 22 h–8 h. Détail : [docs/surveillance.md](docs/surveillance.md).
- Détail (modes, scheduling, alertes, présence, dashboard, transitions, reset) : [docs/heatzy.md](docs/heatzy.md).

## Dashboard stats (`/dashboard/stats`)

> **L'accueil du dashboard est le calendrier.** `/dashboard` redirige vers `/dashboard/calendar` ;
> les statistiques sont sur `/dashboard/stats`. ⚠️ Une redirection, pas le calendrier rendu sur
> `/dashboard` : les chemins ouverts à `viewer` se lisent **par préfixe**, et `/dashboard` dans
> `allowedPaths` ouvrirait du même coup factures, fiscal et taxe de séjour.

> **Partagé avec le socle** (Lots 3, C + D) : `spreadRevenue`, le thème Recharts
> (`lib/chart-theme`), la barre `components/DashboardNav` et la page elle-même,
> `@sejour/socle/components/StatsDashboard` (titre, sous-titre, accent `#FF385C`). La route
> `app/api/dashboard/stats/route.ts` ne fournit que les séjours vendus, `unitsTotal = 1`
> (**l'unité est la nuit de maison** ; une nuit de chambre de l'époque pèse 1/9, posé par
> `toBooking`), l'événement du circuit comme repère et les avertissements à
> `computeDashboardStats`. Paramètres : `?period=currentYear|previousYear|rolling12m|all&mode=…`.
> L'accent des graphes est `#334155`, pas le rose du site : `#FF385C` est la couleur du canal Airbnb.
> Le fiscal ne lit les prix Beds24 que si `?projected=true` (`fiscalDeps(simulate)`).
> Détail : `CLAUDE.md` et `docs/PROTOCOLE-TEST.md` du socle (historique : docs/journal.md § Dashboard stats).

> **Tri par statut et brut (socle `v2.0.0`)** : le tri se fait **une fois**, par
> `soldBookings()` en tête de route — `new` compte comme vendu (statut de rangement d'une résa
> OTA déjà confirmée), `request`, `inquiry`, `black`, `cancelled` jamais. Le brut se définit
> **une seule fois**, dans `toBooking` (`lib/beds24.ts`) : `price` moins la taxe de séjour lue
> dans les lignes de facture, commission par `commissionOf`, `units` = 1 pour la maison entière
> et 1/9 pour une chambre de l'époque. `getStays` demande toujours les lignes de facture. La
> route porte sa garde `denyNonAdmin`. Invariant `INV-FISCAL-1` du protocole du socle : même CA
> sur les stats et sur le fiscal (historique et mesures : docs/journal.md § Dashboard stats).

- **La date de référence est celle de Paris, jamais `toISOString()`.** La charge utile de
  `/api/dashboard/stats` doit rester **identique octet pour octet quel que soit le fuseau du
  serveur**, et c'est ce qu'on vérifie après y avoir touché (historique : docs/journal.md §
  Dashboard stats).
- **Deux planchers hérités, conservés à dessein.** Le délai moyen de réservation et les nuits
  futures déjà couvertes passaient par un helper qui plafonnait à un jour ; les deux gardent ce
  plancher (`nights()`), sans quoi `avgLeadTime.room` passait de 3 à 2. Le `Math.max(0, …)` qui
  les entoure dit que l'intention était l'inverse : à corriger dans un lot qui assume de
  déplacer l'indicateur.
- **Statuts exclus** : la route stats filtre `cancelled`/`black` (`isExcludedStatus`, `@sejour/socle/lib/booking-status`, cohérent avec `lib/bookings.ts` / `lib/fiscal`). Sans ça, les blocages propriétaire à 0 € et annulations faussaient revenus, TJM et occupation.
- **Composition** : la page rend `@sejour/socle/components/StatsDashboard` — cartes
  `MetricCard`, `CommittedRevenue`, `MonthlyRevenueChart`, `OccupancyByMonth`,
  `ChannelsByYearChart`, `YearComparisonBlock`, et deux `StaysTable` (« Réservations
  récentes », « Meilleures nuitées », événement via `findEventForStay`). Le détail des
  indicateurs est dans le `CLAUDE.md` du socle. L'ancienne page (StatsCards à 9 cartes,
  RevenueProjection à 3 scénarios, camembert des canaux, `OccupancyGauge`) a disparu aux Lots
  C + D (description : docs/journal.md § Dashboard stats).

## Dashboard référencement (`/dashboard/seo`)

Rapport Google Search Console (requêtes, clics, impressions, position, pages, pays, appareils)
dessiné par `SearchConsoleDashboard` du socle **v3.16.0**, le même écran que chez Albiez.
- **Admin seulement** : `guard.denyNonAdmin` dans `app/api/dashboard/seo/route.ts`, et hors de
  la liste blanche du viewer dans `proxy.ts`.
- Variables d'environnement `GOOGLE_SERVICE_ACCOUNT_JSON` (clé du compte de service, collée
  telle quelle) et `GSC_SITE_URL` — **jamais dans le dépôt**, qui est public.
- Si Google refuse la propriété, la route liste celles que le compte de service voit : c'est la
  bonne valeur de `GSC_SITE_URL`.

## Dashboard calendrier (`/dashboard/calendar`)

> **Le moteur de placement monte, l'enveloppe reste.** `placeSegments` / `Segment` /
> `laneCount` / `roundedEnds` / `periodTooltip` / `PERIOD_PALETTE` vivent dans
> `@sejour/socle/lib/calendar-lanes`, et le squelette des semaines (`WEEK_GRID.row` /
> `.columnRule` / `.barsBlock`, socle `v3.7.0`) aussi : chaque semaine a son cadre permanent,
> avec un vide de 6 px entre deux cadres. **L'enveloppe (`BookingCalendar.tsx`) n'est pas
> partagée, et c'est délibéré** : ce qu'elle peint, sa popup et son ancrage divergent d'Albiez
> (historique : docs/journal.md § Dashboard calendrier).

- Un séjour qui part le 1er du mois suivant court jusqu'au bord droit du mois, sans arrondi,
  comme tout séjour qui continue (historique : docs/journal.md § Dashboard calendrier).
- **Grille mois** avec navigation prev/next, jour férié marqué, aujourd'hui en rose (`bg-primary`)
  - L'état du mois est un couple `{year, month}` et non une `Date`, comme le calendrier public
    du site : `addMonths`, `daysInMonth` et `firstDayOfMonth` du socle travaillent dessus.
  - ⚠️ **La pastille du jour se calcule par `formatDate` du socle** (depuis `getFullYear` /
    `getMonth` / `getDate`), jamais par `toISOString()` — en UTC, elle se posait sur la veille
    entre minuit et 2 h l'été.
- **Événements Le Mans** : un **libellé coloré souligné d'un filet de 3 px** (`EVENT_LINE` / `EVENT_TEXT`), au-dessus des barres de réservation (une seule fois par event, même sur plusieurs jours). Label court via `shortEventLabel`, nom complet en tooltip. Plusieurs events qui overlappent → lanes séparés.
  - **Un événement n'est pas une réservation, et ne se dessine pas comme elle** : pas d'aplat, texte coloré, trait fin — la lecture tient aussi en niveaux de gris et pour un daltonien (historique : docs/journal.md § Dashboard calendrier).
  - Le filet **se retire de 3 px du côté où l'événement s'arrête vraiment** et file jusqu'au bord de la semaine quand il continue (ce qui sépare aussi deux événements qui s'enchaînent). **Pas de demi-cellules pour un événement** : il occupe des journées entières.
- **Barres de réservation** : couleur par canal (admin), demi-cellules pour checkout/check-in → permet aux résas back-to-back (même jour) de partager une ligne
- **Vacances scolaires et fêtes** : une rangée de filets **au-dessus des événements**. L'ordre se lit du plus large au plus précis en descendant — les bandes durent des semaines, les événements des jours, les séjours des nuits.
  - **Ambre pour la zone B (Le Mans)** — l'information utile au **ménage**, dont la personne a ses enfants à la maison quand les écoles du Mans ferment —, émeraude pour les zones A / C, rose pour les fêtes. L'émeraude est une divergence assumée avec Albiez (ici l'indigo est le badge « Événement »).
  - **Le test de zone lit `band.zones`, jamais `band.sources`** (`sources` contient la zone *sortante* d'une bascule absorbée).
  - **Une seule ligne, sans lanes** (`bandesPeriodes` ne produit jamais deux bandes qui se chevauchent) ; **demi-cellules comme les séjours**, fin portée au *lendemain* du dernier jour de la composition. (Historique : docs/journal.md § Dashboard calendrier.)
- **Filets de colonnes** : une couche hors flux (`absolute inset-0 grid grid-cols-7`) placée *avant* les barres dans le DOM — au-dessus des fonds de cases, sous les séjours. Ni bordures de cases (le trait s'arrêterait avant les barres), ni éléments `grid-row: 1 / -1` (le placement automatique repousserait les cases). `gray-300` pour l'en-tête des jours, `gray-200` pour la grille.
- **Légende** : l'entrée « Événement circuit » s'affiche quel que soit le rôle. Les filets sont apparus dans la grille, ils doivent être nommés même en vue viewer, où les couleurs de canal sont masquées.
- **Réservations non confirmées** (`UNCONFIRMED_STATUSES` = `new`, `request`, `inquiry`) : **absentes de la vue viewer** — le planning du ménage dit les nuits vendues —, et en **ardoise rayée** (`#94a3b8` + hachures 45°, la couleur seule ne suffit pas) avec un marqueur `?` en vue admin. La popup explique le statut quand il n'est pas `confirmed`.
  - ✅ **C'est désormais une seconde ceinture, plus le seul contrôle.** `/api/dashboard/bookings` vérifie le rôle et **retire les provisoires de la réponse** avant de l'envoyer : un viewer reçoit 50 réservations là où l'admin en reçoit 55. Le filtre du composant reste, il sert la « vue viewer » de l'admin, qui prévisualise avec des données complètes. Les constantes vivent dans `@sejour/socle/lib/booking-status`.
- **Options commerciales** (`HELD_STATUSES` = `black`) : **même sort que les non confirmées** — absentes de la vue viewer, ardoise rayée en admin — mais étiquetées **« OPTION »** au lieu de « ? ». Beds24 appelle `black` un blocage ; l'usage ici est commercial : une option saisie à la main pour tenir des dates pendant une négociation, ni une nuit vendue, ni une demande de renseignement (exemple : docs/journal.md § Dashboard calendrier).
  - Le libellé d'une barre retombe sur `company` puis `title` quand prénom et nom sont vides — c'est le cas des options saisies à la main. « Spartner Travel » vaut mieux que « · 1 voy. », ce que l'ancien libellé affichait. `title` en dernier car Beds24 y met la civilité aussi souvent que le nom de société.
  - `cancelled` n'est traité nulle part : l'API Beds24 n'en renvoie pas sur nos fenêtres. Si cela changeait, une annulée s'afficherait comme une réservation ordinaire.
- **Indicateur 📝** sur la barre quand la résa a une note interne (visible admin ET viewer)
- **Popup réservation** : dates, **heure d'arrivée** (`arrivalTime`), nuits, voyageurs, prix/canal (admin)
  - Admin : titre/société + email (mailto) + téléphone (tel) cliquables + édition inline des notes internes (Beds24)
  - Viewer : notes en lecture seule (fond ambre), reste visible le 📝, l'heure d'arrivée et les remarques voyageur
  - **Remarque voyageur** (`comments`) affichée uniquement pour le canal `Direct` (sur Airbnb/Booking/Abritel ce champ contient des métadonnées OTA inutiles : "prepaid", rate codes…)
  - Événement associé affiché en bas (badge indigo)
  - Mobile : `max-h-[calc(100vh-2rem)] overflow-y-auto` pour garder le popup dans l'écran
- **Toggle admin/viewer** : bouton prévisualiser la vue viewer (comme /heating). `isAdmin` et `showChannels` sont des **dépendances du `useMemo` des barres** : sans elles, basculer en « Vue viewer » garderait les couleurs de canal du rendu précédent.

### Vacances scolaires (`@sejour/socle/lib/periodes`)

Le module et sa donnée vivent dans `@sejour/socle` (copie partagée avec Albiez) ; la
regénération se lance depuis le socle (`node scripts/build-vacances.mjs [année_de_début]`).
Ici, **import direct dans le composant**, comme `LE_MANS_EVENTS` — pas via une route d'API
(historique : docs/journal.md § Dashboard calendrier).

**Une seule bande à la fois** : `bandesPeriodes` fusionne les zones d'une même période dans le
libellé et ne coupe que là où la composition change ; `fusionnerBascules` donne le week-end de
bascule entre deux zones à la bande suivante (test étroit à dessein, pour qu'un « ASCENSION
A+B+C » d'un seul jour y survive). **`zones` n'est pas `sources`** : pour savoir si une zone
est en vacances sur la bande affichée, lire `zones` ; `sources` (infobulle) garde la zone
sortante d'une bascule absorbée (détail : docs/journal.md § Dashboard calendrier).

### Notes internes (ménage, infos)

- Stockées dans le champ `notes` de Beds24 (non imprimé sur factures, contrairement à `comments`).
- API : `POST /api/dashboard/bookings/[id]/notes` (admin only via JWT) → `updateBookingNotes()` dans [lib/beds24.ts](lib/beds24.ts), par la voie **écriture** (`BEDS24_REFRESH_TOKEN`).
- Le state `bookings` côté page calendrier est mis à jour via la callback `onNotesUpdated` pour éviter un refetch.

### Partage voyageur (lien du guide + code serrure)

Bloc dans la popup de réservation du calendrier — [components/dashboard/GuestShareBlock.tsx](components/dashboard/GuestShareBlock.tsx). Copie en un clic du lien du guide et d'un message prêt à envoyer dans les 5 langues, plus le code de la serrure.

- **Rendu uniquement si `isAdmin`** (prop passée par la page calendrier depuis `effectiveRole`, donc masqué aussi en « Vue viewer »).
- **Code Nuki** : le PIN 6 chiffres vit dans `infoItems[]` sous `code = "NUKI_PIN"` (champ `text`). Il y est désormais écrit **par notre synchronisation** dès la réservation (voir « Serrure Nuki »), et non plus par le connecteur Beds24 à J-6 → l'état « Pas encore généré » ne dure que jusqu'au passage suivant. Le bouton « Arrivée + code » refuse (`409`) tant que le code n'est pas **sur la serrure** avec ce PIN. Lu via `GET /api/dashboard/bookings/[id]/nuki-code` (admin only via JWT, re-vérifié dans la route car le middleware ne bloque pas viewer sur `/api/dashboard/bookings`). Route dédiée volontairement : le calendrier charge ~19 mois de résas, hors de question d'y faire transiter les PIN. **Ne jamais logger le PIN — le dépôt est public.**
- **URL et langues** : `guideUrl()` / `guestLocaleFromCountry()` dans [lib/site.ts](lib/site.ts) ; modèles de message dans [lib/guest-messages.ts](lib/guest-messages.ts) (vouvoiement FR/DE, tutoiement IT/ES, comme le guide).
- **Presse-papier** : le dashboard est utilisé en mode « app » sur mobile, où `navigator.clipboard` peut être refusé → repli sur un champ sélectionnable, jamais d'échec silencieux.
- **Lien « Pendant votre séjour »** (`aroundUrl()`, `/xx/blog#pendant-le-sejour`) : ligne de copie dans le bloc, et ajouté au message d'arrivée (`buildGuestMessage`, param `aroundUrl`). **Pas** d'article d'événement dans le message : envoyé à une réservation Airbnb / Booking, un article qui pousse à réserver serait une incitation hors plateforme (relecture du 2026-11-08). Le libellé du code (« Votre code d'accès à la porte ») et l'ouverture du départ (« Le départ approche », et depuis le 2026-11-11 « Votre séjour se termine demain ») sont des **signatures** (`SIGNATURES`) : ne jamais les reformuler.
- **Message de départ** : une remarque par WhatsApp et une ligne d'avis **neutre** (« chaque retour, positif ou critique, nous est utile ») ; jamais « si vous avez aimé » ni « 5 étoiles » (règles Google / Airbnb / Booking). Pas de variante « réservation directe » : le dashboard n'écrit qu'aux réservations des plateformes (les directes n'ont pas de fil).
- **Textes des auto-actions Beds24** (confirmation, lendemain de l'arrivée, avant le départ) : [docs/auto-actions-beds24.md](docs/auto-actions-beds24.md), référence à recopier dans Beds24.

### Guide d'arrivée — parties, raccourcis QR (2026-11-08)

- Deux repères à ancre fixe sur la même page : `#avant` (venir, stationnement, lits d'appoint, règles) et `#sur-place` (serrure, Wi-Fi, chauffage, café, Découvrir Le Mans, le jour du départ, revenir, contact).
- « Découvrir Le Mans » est **calculé** (articles `journey` « sur-place ») avec un lien vers `/xx/blog#pendant-le-sejour` ; « Revenir » liste les prochains événements aux dates officielles (`isUpcomingOfficial`), sur un ton informatif, jamais « réservez » (le lien du guide part dans les fils Airbnb / Booking) ; la page se régénère chaque jour (`revalidate`). Aucune page indexée ne renvoie vers le guide (il affiche le Wi-Fi) : le lien va du guide vers le blog, jamais l'inverse.
- Raccourcis imprimés (QR de la fiche « Pendant votre séjour », `scripts/generate-print-sheets.mjs`) : `/bienvenue` → `/xx/guide-arrivee#sur-place`, `/autour` → `/xx/blog#pendant-le-sejour` (`app/bienvenue`, `app/autour`, `lib/short-links.ts` : 307 selon `Accept-Language`, `Vary`, hors proxy). Changer la destination ne demande pas de réimprimer.

### Messages voyageurs automatiques (depuis le 2026-11-08, socle v3.18.0)

Les auto-actions Beds24 sont remplacées par des messages écrits **dans ce dépôt** —
[lib/messages/templates.ts](lib/messages/templates.ts), cinq langues, vouvoiement FR/DE et
tutoiement IT/ES : arrivée + code (J-5 16h), lendemain de l'arrivée (9h), veille du départ (17h),
avis (lendemain du départ 10h). Textes reconstitués à partir des fils le 2026-11-08 (aucun n'était
sauvegardé) ; le « bien installé » partait en français à tout le monde. **La confirmation de
réservation reste dans Beds24** (décision de l'hôte). Moteur : section v3.18.0 du CLAUDE.md du socle.
Le message « Tout se passe bien à la maison ? » (J+1 10h) proposé au Lot 4 dans
[docs/auto-actions-beds24.md](docs/auto-actions-beds24.md) est **fondu dans le lendemain de
l'arrivée** (texte apprécié gardé, lien « autour de la maison » ajouté) — ne pas le créer dans
Beds24 en plus ; s'il l'a été, son empreinte est reconnue. Sa ligne « remarque, suggestion » est
dans la veille du départ ; la ligne « la plateforme vous proposera un commentaire » ne l'est pas :
l'avis du lendemain le fait déjà.

- **Faire évoluer un texte** : modifier le français, reporter dans les quatre langues, incrémenter
  `version`. [tests/messages.test.ts](tests/messages.test.ts) bloque toute incohérence, vérifie que
  les anciens boutons reconnaissent les nouveaux messages, et que les auto-actions Beds24 réelles
  sont reconnues sans confusion (« wonderful stay » est dans le départ **et** dans l'avis anglais).
- **Arrivée** : envoyée seulement si `NUKI_PIN` existe **et** que le code est sur la serrure
  (`isPinOnLock`). Réservation tardive : rattrapée jusqu'au soir de l'arrivée.
- **Confirmation** (`confirmation`, à la réservation) : **en mode test seulement** depuis le
  2026-11-08 — la vraie reste l'auto-action Beds24 (facture, lien de paiement). Elle corrige le
  départ de Beds24 (« avant 10h00 », faux : **11h**). Le webhook Beds24
  ([app/api/webhooks/beds24/route.ts](app/api/webhooks/beds24/route.ts)) lance un passage de la
  messagerie après la synchro Nuki : la copie part dans la minute, le cron de 10 min rattrape.
- **Avis** : le bloc « réservez en direct » n'apparaît que pour une réservation directe (Airbnb
  et Booking.com interdisent d'inciter à réserver hors plateforme dans leur messagerie ; confirmé
  par l'hôte le 2026-11-08). Jamais « si vous avez aimé » ; la version directe ne parle pas de
  plateforme.
- **Dernière minute** (décision de l'hôte du 2026-11-08) : départ à partir de 2 nuits, lendemain de
  l'arrivée à partir de 3 ; ces deux messages et l'avis sautent si un autre message — ou la
  confirmation Beds24, à la création — est parti dans les 12 h précédentes (`quietHours`).
  L'arrivée part toujours.
- **Canal** : Airbnb, Booking.com, Abritel → messagerie ; direct → e-mail SMTP OVH (`SMTP_*`, non
  posées au 2026-11-08 : une directe est alors « bloquée ») ; HomeToGo et autres → rien, visible.
- **Registre** : `infoItems` `MSG_*` (jeton d'écriture) + messages de l'hôte reconnus dans les fils
  — l'écran reprend donc tout l'historique des auto-actions. ⚠️ Chaque écriture déclenche le
  webhook Beds24 : deux écritures par envoi (`pending`, `sent`), donc la synchro Nuki repasse deux
  fois par message (inoffensif : son verrou absorbe, le cron horaire rattrape).
- **Modes** : `MESSAGES_MODES=arrivee-code:test,bien-installe:test,depart:test,avis:test`,
  **ombre par défaut** ; `MESSAGES_KILL_SWITCH=1` coupe tout. **`test`** (étape voulue par l'hôte
  avant de remplacer les auto-actions) : au moment où le message partirait, une copie part à
  `MESSAGES_TEST_TO`, à défaut à `SMTP_FROM` (`contact@coliving-barbusse.fr`), avec un bandeau
  « COPIE DE TEST » ; rien au voyageur, trace `MSG_<ID>_TEST` jamais lue comme un envoi. Les
  auto-actions Beds24 continuent pendant ce temps. La copie part par le SMTP : sans `SMTP_*`,
  **tous** les modèles en `test` sont bloqués (`no-test-transport`, une alerte ntfy par
  réservation et modèle) — poser `SMTP_*` avant de passer en `test`. Cron `/api/cron/messages-voyageurs`, cron-job.org toutes les
  10 min, verrou Redis `barbusse:messages:cron:lock`, plafond 5 envois par passage, alertes ntfy
  (échec, blocage, orphelin). Pas encore dans `EXPECTED_CRONS` : à ajouter au passage en réel.
- **Écran** : [/dashboard/messages](app/(dashboard)/dashboard/messages/page.tsx) et le panneau
  « Messages au voyageur » de la fiche du calendrier (admin seulement).
- **Bascule, un message à la fois, dans cet ordre : avis, départ, bien-installé, arrivée**
  (chef-de-stand), chacun **après** sa période en `test` (copies reçues et relues, comparées à ce
  que l'auto-action a réellement envoyé). Pour chacun, à une heure creuse sans échéance dans les 2 h : **d'abord désactiver
  l'auto-action Beds24, puis** passer le modèle en `live` — l'inverse fait une course entre les deux
  envois, et un e-mail Beds24 (réservation directe) n'apparaît pas dans le fil, donc le doublon est
  certain. Les rattrapages couvrent l'écart (arrivée jusqu'au soir de J, départ 6 h, avis 8 h).
  Vérifier le registre `MSG_*` et le fil au premier envoi réel. Les anciens boutons (ci-dessous)
  restent jusqu'à une semaine d'arrivée en `live`. Directes : tant que `SMTP_*` n'est pas posé,
  les laisser à Beds24.
- **Changement de dates** : le code est renvoyé (`onAnchorChange: "resend"`) ; `isPinOnLock` vérifie
  le code, pas encore sa plage horaire — le message peut précéder de moins d'une heure le recalage
  par la synchro.
- **Wi-Fi** : `getWifi()` ([lib/wifi.ts](lib/wifi.ts), `WIFI_SSID` / `WIFI_PASSWORD`). Absentes,
  le message d'arrivée est bloqué (`missing:wifiReseau,…`) au lieu d'annoncer un réseau vide.

### Envoi des messages arrivée / départ depuis le calendrier

Deux boutons dans le même bloc de partage — « Arrivée + code » et « Départ » — qui écrivent
dans le fil de messagerie de la réservation sans passer par l'interface Beds24. Grisés si le
message est déjà parti, avec sa date ; cliquables sinon.

**Les « Mail & Actions » de Beds24 ne sont pas dans l'API** ([apiV2.yaml](https://api.beds24.com/v2/apiV2.yaml)) : impossible de lire une auto-action, son statut ou de déclencher son « Send Now ». Le `actions` de `POST /bookings` est autre chose. **Ne pas repartir en quête de cet endpoint : il n'existe pas.**

**L'état des boutons se relit dans `GET /bookings/messages?bookingId=…`**, pas dans un registre local : seule source qui voie aussi les envois des auto-actions restées actives. `detectGuestMessageKind()` ([lib/guest-messages.ts](lib/guest-messages.ts)) compare le texte normalisé (minuscules, sans diacritiques) aux empreintes de `SIGNATURES` — l'en-tête de bienvenue des gabarits Beds24 et le libellé du code des nôtres, dans les 5 langues. Seuls les messages `source: "host"` comptent ; le fil arrive du plus récent au plus ancien.

⚠️ **Ne jamais reprendre l'URL du guide comme empreinte** : un message écrit à la main avec le lien passerait pour un envoi d'arrivée, alors que l'arrivée, c'est le PIN. Beds24 n'a de gabarit d'arrivée qu'en **FR et EN** à ce jour ; en ajouter un dans une autre langue oblige à poser son en-tête dans `SIGNATURES`.

**Cohabitation assumée** : les auto-actions « Before arrival - Send Nuki PIN » et « Before checkout » restent actives côté Beds24 ; les boutons servent à **avancer** un envoi. Si un gabarit est modifié dans Beds24, vérifier que son empreinte tient encore dans `SIGNATURES` — sinon le bouton redevient cliquable et le voyageur reçoit deux fois. (Historique et cas réels : docs/journal.md § Dashboard calendrier.)

Autres points de conception, dans [la route](app/api/dashboard/bookings/[id]/messages/route.ts) :

- **Le texte est construit côté serveur.** Un `message` libre posté depuis le navigateur ferait
  de cette route un relais d'écriture arbitraire vers Airbnb et Booking.com sous notre identité
  d'hôte. Le client ne choisit que la famille (`arrivee` | `depart`) et la langue.
- **Garde-fou serveur contre le double envoi** : le fil est relu juste avant d'écrire, `409` si
  le message est déjà là. Un bouton grisé ne protège de rien (deux onglets, une auto-action
  partie entre-temps).
- **Réservations directes** : pas de canal, donc pas de fil. `sendable: false`, bouton grisé avec
  la raison — l'API accepterait le `POST` mais personne ne le lirait.
- **Arrivée sans PIN** : refusé (`409`). Le PIN est posé par la synchronisation de la serrure
  dès la réservation ; envoyer sans lui grillerait le bouton pour l'envoi qui compte. Les boutons de copie restent là.
- **Confirmation avant envoi** : `window.confirm` nommant la langue et le canal. Le message part
  chez un vrai voyageur et ne se rattrape pas.
- **Jamais le corps du message dans les logs** : il porte le PIN, et le dépôt est public.

Limites du canal : texte brut, pas de HTML. Booking.com filtre les liens externes — l'URL du
guide passe sur Airbnb, à vérifier sur Booking.com. Les pièces jointes sont possibles
(`attachment` base64 + `attachmentName` + `attachmentMimeType`) mais inutilisées ici.

## Événements Le Mans (`lib/events.ts`)

> **Lot 5 — le type et les fonctions sont montés dans `@sejour/socle/lib/events`.** Il ne
> reste ici que **les données et les libellés**. Albiez tient l'autre moitié du couple, avec
> son catalogue de la vallée ; un catalogue est une valeur, il ne monte jamais.

- `LE_MANS_EVENTS` : 41 entrées (2025-2027) — 24h Moto, MotoGP, SWS Karting, 24h du Mans,
  Le Mans Classic, 24h Rollers, 24h Camions, Rotax, Mini OGP, Superbike, Rallye Sarthe,
  23H60, 24h Vélo, Porsche Sprint Challenge, Championnat Monde Karting KZ, Euro IAME,
  Marathon, Slalom ACO, TTE, Fun Cup, et les réunions hippiques des Hunaudières.
- `shortEventLabel(event)` : libellé court pour le calendrier (« 24h Mans », « MotoGP »,
  « Classic »). **Reste ici, et y restera** : c'est une table de noms propres du Mans, donc
  une donnée. Il prend l'événement et non plus son nom, parce qu'il lit `confirmed`.

Chaque entrée porte une **`key`** stable (jamais le nom, qui est de l'affichage) — c'est elle
que portent `BlogPostMeta.event` et les déliements — et un booléen **`confirmed`**, qui
commande le « ? » du calendrier et autorise l'émission du JSON-LD `Event`. Une projection de
date ne sert qu'à se souvenir de vérifier (historique : docs/journal.md § Événements Le Mans).

**Champs `organizer`, `performer`, `tickets`** (socle v3.2.0), seulement sur les entrées reliées
à un article : l'organisateur **véritable** (`ACO`, Peter Auto…), jamais nous ; le plateau ; la
billetterie officielle et son prix d'entrée, jamais notre maison — à retirer si l'épreuve est
complète (le nœud affirme `InStock`). Sans billetterie ouverte, `tickets` reste absent : on ne
déclare pas une vente qui n'existe pas. `tickets.validFrom` (`YYYY-MM-DD`) accompagne chaque
`tickets`, lu dans le communiqué d'ouverture de l'organisateur (newsroom.lemans.org), jamais
deviné. **Vérifier l'année de la source d'un tarif.** La **commune** n'est pas portée par les
entrées : elle est fournie une fois pour toutes à `eventJsonLd` par la page d'article
(historique : docs/journal.md § Événements Le Mans).

Les fonctions, dans le socle et appelées avec le catalogue en premier argument :

- `findEventForStay(catalog, arrival, departure, { marginDays })` — rend **l'événement**. Marge
  de 2 jours par défaut ; entre plusieurs candidats, celui dont les dates **exactes** recouvrent
  le plus de nuits gagne. Utilisé par les stats et la popup du calendrier (`.name`).
  - ⚠️ Les helpers de date sont ceux de `@sejour/socle/lib/dates` : jamais de `addDays` local
    qui compose minuit en heure locale et relit par `toISOString()` (historique :
    docs/journal.md § Événements Le Mans).
- `findEventOnDay(catalog, day)` — l'événement qui couvre ce jour, sans marge.
- `findEventByKey(catalog, key)` — par clé, jamais par nom.
- `stayWindow(event, { before, after })` — fenêtre de séjour (défauts −1 / +1).
- `eventJsonLd(event, place, article?)` — le nœud `Event` de schema.org. Rend `null` tant que
  les dates ne sont pas officielles : on ne déclare pas une date supposée à Google. La page lui
  passe `{ description: loc.description, imageUrl }` (description dans la langue de la page,
  couverture en URL absolue) : le socle ne connaît pas l'i18n.

### Délier une réservation d'un événement

Le rattachement est une **heuristique de dates**, et elle se trompe (une semaine de chantier
qui mord sur les 24 Heures devient « 24h Mans »). La popup porte donc une **croix à côté du nom
de l'événement** : elle écrit un démenti, et le démenti gagne toujours sur l'heuristique.

- **Stocké : le couple `<id de réservation>:<clé d'événement>`**, jamais le seul identifiant.
  Délier ne fait **pas** repêcher le candidat suivant — une réservation déliée n'a plus
  d'événement, jusqu'à ce que le catalogue bouge.
- **Redis (`event-links:unlinked`, un `SET`), pas Beds24** : la note interne est lue par la
  personne du ménage, et les 42 lignes de l'historique n'existent plus dans Beds24. Variables
  `KV_REST_API_URL` / `KV_REST_API_TOKEN`.
- **Échec ouvert à la lecture** (Redis injoignable ⇒ étiquetage d'origine), **franc à
  l'écriture** (la route rend 503 plutôt que d'annoncer un enregistrement qui n'a pas eu lieu).
- **Une seule fonction tranche** : `eventForStay(bookingId, arrival, departure, unlinked)` dans
  [lib/events.ts](lib/events.ts), appelée par la route des stats pour son `markerOf` ; la popup
  appelle `findEventForStay` **sans** le filtre, pour afficher l'événement démenti barré et
  offrir « Rétablir ».
- **Portes** : `GET /api/dashboard/event-links` est **voulue** ouverte à `viewer` (la route
  accepte `admin` et `viewer` : l'étiquette s'affiche sans condition de rôle, la servir au seul
  admin la ferait réapparaître chez lui). Elle figure dans `allowedPaths` de `proxy.ts` depuis
  le 2026-11-07 (elle y manquait : 403 silencieux chez le viewer). ⚠️ Toute route qui accepte
  `"viewer"` dans son `guard.deny` doit **aussi** figurer dans `allowedPaths`, sinon le proxy la
  ferme avant elle, sans erreur visible côté interface.
  `POST` / `DELETE /api/dashboard/bookings/[id]/event-link` sont **admin only** — délier change
  des nombres que le `viewer` ne voit pas. Les deux verbes sont idempotents (`sadd` / `srem`).
- `eventLinkRef(bookingId, eventKey)` vit dans [lib/events.ts](lib/events.ts) et non dans
  [lib/event-links.ts](lib/event-links.ts) : le client Upstash finirait sinon dans le bundle du
  navigateur (historique : docs/journal.md § Événements Le Mans).

## Blog : CTA de réservation sur les articles d'événement

`components/public/EventBookingCTA.tsx` affiche un bloc de réservation en fin d'article.
Il existe parce que le contenu seul ne convertissait pas (historique : docs/journal.md § Blog :
CTA de réservation sur les articles d'événement).

> **Le comportement est dans `@sejour/socle/components/EventBookingCTA`** (Lot 5). Restent ici
> l'identifiant Beds24, la route `/api/availability`, le séjour minimum par défaut et les
> libellés dans cinq langues ; le composant prend **l'événement** et calcule sa fenêtre.
>
> ⚠️ À ne pas confondre avec l'`EventBanner` (socle, composant **serveur** : « quand est la
> prochaine édition ») ; ce CTA est **client** et interroge la disponibilité en direct. Les
> deux coexistent sur une même page et ne doivent pas être fusionnés.

- Activé par le champ `event` de `BlogPostMeta` (`posts.ts`), qui porte **la clé** d'une
  entrée de `LE_MANS_EVENTS` — plus son nom. Sans ce champ, aucun CTA n'est rendu.
- Un événement dont les dates ne sont pas officielles (`confirmed: false`) garde son CTA mais
  **n'émet aucun nœud JSON-LD `Event`**, et le bloc **dit que les dates sont prévisionnelles**
  (`COPY[locale].provisionalDates`, socle v3.3.0, formulée sans nommer l'organisateur). Aucun
  article n'est dans ce cas depuis le 2026-10-01 (historique : docs/journal.md § Blog : CTA de
  réservation sur les articles d'événement).
- Client component : les pages blog sont statiques, la dispo doit être lue à la visite et
  non au build. Il se masque seul si l'événement est passé, et tronque les nuits écoulées
  s'il est en cours.
- 4 états : disponible / partiel / complet / erreur API. En cas de panne API le CTA reste
  affiché avec les dates conseillées — on ne sacrifie pas la conversion à un incident.
- `minStay` : on retient le **max** de la fenêtre, pas la valeur du jour d'arrivée. Beds24
  renvoie ces clés décalées d'un jour, et lire une seule clé fait retomber silencieusement
  sur le défaut de 2 nuits.
- Traductions dans le fichier du composant (`Record<Locale, Copy>`), comme le reste des
  libellés du blog — pas dans `lib/i18n/dictionaries`.

## Blog sold-out

- Flag manuel `soldOut: true` dans `posts.ts` par article
- Si soldOut : grayscale image + badge "Complet" + trié en bas de liste + bandeau article "Rendez-vous pour l'édition {nextEdition}"
- Pas d'auto-détection Beds24 (Turbopack avait des issues de compilation)

## Blog : renouvellement annuel des articles d'événement

Un événement passé n'est **pas** réécrit sur place : l'article de l'édition écoulée reste
en ligne comme archive, et une nouvelle version datée est créée à côté.

- Nouveau slug suffixé de l'année (`motogp-france-le-mans-2027`), `date` = date de publication réelle
- Les 5 fichiers de contenu sont clonés depuis l'édition précédente puis re-datés, et
  recensés dans `CONTENT` de `app/[locale]/blog/[slug]/page.tsx` (imports paresseux à chemin littéral)
- L'archive garde `soldOut: true` et reçoit `supersededBy: "<nouveau-slug>"`, ce qui déclenche :
  - `robots: noindex, follow` dans `generateMetadata` — sinon les deux éditions se
    concurrencent sur des contenus quasi identiques
  - un lien "Lire l'édition à venir" dans le bandeau "Complet"
  - son exclusion de `app/sitemap.ts` (`filter(post => !post.supersededBy)`)
- Ne créer l'article de l'année N+1 que si l'édition est **confirmée** par l'organisateur
  (cf. `lib/events.ts`). Sinon laisser l'archive telle quelle.
- Événement **définitivement arrêté** (ex : GP Explorer, dont la 3e édition « The Last Race »
  d'octobre 2025 était la dernière) : là on réécrit bien **sur place**, en rétrospective qui
  répond d'entrée « il n'y aura pas de prochaine édition » puis renvoie vers les événements
  encore vivants. Pas de `soldOut` ni de `supersededBy` : il n'y a pas de successeur, et
  l'article doit rester indexable pour capter les recherches « <événement> <année> ».
- Exception : un événement qui n'a jamais eu d'article garde un slug **sans année** (`porsche-sprint-challenge-le-mans`) et reste evergreen tant que les dates de l'édition suivante ne sont pas publiées ; on le renouvellera en `-AAAA` seulement le jour où une archive vaut la peine d'être conservée.

## Timezone

- Vercel tourne en **UTC** → toute la logique horaire utilise `@sejour/socle/lib/time` (Europe/Paris)
- Fonctions : `currentHourParis()`, `todayParis()`, `tomorrowParis()`, `nowParis()`
- **Ne jamais utiliser** `new Date().getHours()` ou `toISOString().split("T")[0]` directement
- Côté **navigateur**, le jour affiché se compose avec `formatDate` / `parseDate` / `addDays` /
  `daysBetween` de `@sejour/socle/lib/dates` : un jour y est ce que l'utilisateur voit dans sa
  grille, pas un instant. `daysBetween` est la seule de ces fonctions à compter en UTC, parce
  qu'un écart est une quantité et non un jour affiché.
- **Comment on le vérifie** : lancer `npx next dev` une fois tel quel et une fois avec `TZ=UTC`,
  et comparer les charges utiles. Elles doivent être identiques octet pour octet — c'est ce qui
  a révélé les 459,16 € qui basculaient de mars à avril, et ce qui prouve aujourd'hui que
  `/api/dashboard/stats` ne dépend plus du fuseau.

## Eau chaude Cozytouch (ne monte jamais au socle)

`lib/cozytouch.ts` pilote le ballon thermodynamique **Atlantic ÉGÉO 250 L** (PAC sur air ambiant, 8–35 °C d’air, appoint 1 800 W ; fiche dans `docs/cozytouch.md`), en série avec un ballon classique (API Overkiz, session cachée en Redis 8 h, device URL `modbuslink://…` en dur). Le cron `water-heater-automation` choisit un profil selon le nombre de personnes présentes ; `water-heater-health` alerte par ntfy.
- ⚠️ Consigne plafonnée à **60 °C** : au-delà, la résistance électrique prend le relais (coût ×3). Statuts `cancelled` / `black` exclus du comptage.
- ⚠️ Le thermo **alimente un ballon classique** (résistance seule, ~3 kW, permanent) : de l'eau tiède en sortie du thermo, c'est le classique qui chauffe. Aux heures de pic, il porte **seul** l'eau chaude (thermo en Absence) ; à 14 personnes, il peut s'épuiser en fin de série de douches — surveiller les retours voyageurs.
- ⚠️ **Le boost n'ajoute que de la résistance** : la PAC chauffe dans tous les modes tant que l'eau est sous la consigne. Un boost hors des tirages remplace de la PAC par de la résistance.
- ⚠️ **Absence aux heures de pic (2026-11-09, coupures à 9 kVA)** : **mesuré le 9/11 au soir avec le compteur d'énergie du thermo, le mode Éco (`manualEcoActive`) ne coupe PAS l'appoint** (≈ 2,1 kW toute la soirée ; PAC seule ≈ 300 W). **Seul le mode Absence coupe toute la chauffe** (`setAbsenceMode`, effet en 10-15 min). Règle (`getExpectedSettings`, `PEAK_WINDOWS`) : **Éco 55 °C** (50 °C vide), **jamais de boost automatique**, **Absence de 4 h 45 à 7 h et de 16 h 45 à 22 h** quand des voyageurs sont là ; le ballon classique 300 L fournit l'eau chaude pendant ces plages. Hors pic, le thermo gère seul PAC et appoint. Ordre des commandes : boost off et Absence on d'abord, Absence off en dernier. Le boost de rattrapage est supprimé. Les puissances remontées (`PowerHeatPumpState` ≈ 1 000 W = chaleur produite, `PowerHeatElectricalState` = 1 800 W figé) ne mesurent rien : se fier au compteur `ElectricEnergyConsumptionState`.
- **Contrôle** (`lib/water-heater-health.ts`) : recalcule les réglages attendus à la même heure ; Absence manquante au pic ou restée hors pic, boost actif, mode ou consigne divergents, **« PAC à l'arrêt »** (compteur immobile 2 h, hors Absence) ; un constat n'alerte que s'il était déjà là au contrôle précédent, une seule fois tant qu'il dure (règle commune, `barbusse:alert:water-heater-health`).
- **Thermo injoignable** (`getConnectivity`, `isUnreachable`) : `available` de l'appareil et passerelle Overkiz — les états restent en cache quand le thermo n'a plus de courant (circuit du garage coupé le 10/11, maison vide). Alerte priorité 5 après deux passages de suite (`water-heater-reach`).
- **Dashboard** : boost, Éco+ et Performance manuels **refusés (409) aux heures de pic** ; l'admin peut forcer après confirmation, mais **l'automation reprend la main au passage suivant (15 min)**.
- **Voyageurs comptés** (`countGuests`) : bascule à **11 h** (check-out) — arrivants dès 11 h, partants jusqu'à 11 h, jamais d'éco entre deux réservations enchaînées.
- Session Overkiz : après un 401, le second essai ouvre une session **neuve** (`getSession(true)`) — relire Redis rendait la session expirée, d'où un 401 une heure sur deux.
- Détail (configuration physique, modes, commandes, states, profils) : [docs/cozytouch.md](docs/cozytouch.md).

## Factures PDF (LMNP)

Facture PDF d'un paiement (virement attendu ou paiement reçu, pré-rempli depuis Beds24 ou Stripe) depuis `/dashboard/invoices`, **admin seulement**. Mécanismes au socle (`@sejour/socle/lib/invoice-*`, `taxe-sejour`), valeurs ici (`lib/invoice-config.ts`, `lib/invoice-number.ts`, `lib/stripe.ts`, `lib/taxe-sejour.ts`).
- ⚠️ **Numérotation continue (obligation légale)** : compteur Upstash `invoice:counter:barbusse:{année}`, incrémenté **seulement** à la génération réelle. Pour tester ou relire, toujours l'**Aperçu** (`POST …/generate?preview=1`, numéro fictif `PREVIEW_NUMBER`) : jamais de génération réelle en test.
- ⚠️ La mention 293B est dans `INVOICE_TEMPLATE` (obligatoire au socle, sans défaut) ; variables `INVOICE_*` requises. `invoices/prefill` revérifie le rôle elle-même (elle renvoie le PIN). Dates au jour de Paris. Pas de signe moins U+2212 dans le PDF (Helvetica).
- Détail (socle, flux, PDF, plateformes, taxe de séjour, acompte/solde, restrictions) : [docs/factures.md](docs/factures.md).

## Dashboard Fiscalité LMNP / LMP (`/dashboard/fiscal`)

Estimation indicative (IR + PS/SSI, test LMP) depuis les séjours Beds24, `data/fiscal/{année}.json` et les variables `FISCAL_*` ; **ne remplace pas la déclaration** (LMNP.ai). Moteur au socle (`@sejour/socle/lib/fiscal/*`), données et accès ici (`lib/fiscal.ts`). Admin seulement.
- Le CA est le **brut** (`Booking.gross`), le même que `/dashboard/stats` (invariant `INV-FISCAL-1`). Défaut contractuel (réalisé + confirmé) ; `?projected=true` = simulation non opposable. Jamais les commissions dans `chargesDeductibles` (calculées depuis Beds24). Barème IR 2025 en dur, à mettre à jour.
- Détail (contexte 2026, règles codées, configuration, UI, données 2025, restrictions) : [docs/fiscal.md](docs/fiscal.md).

## Cron Jobs (via cron-job.org)

| Job | URL | Fréquence |
|-----|-----|-----------|
| Automation chauffage | `/api/cron/heating-automation` | `*/15 * * * *` |
| Reset chauffage | `/api/cron/heating-reset` | `0 */4 * * *` |
| Health chauffage | `/api/cron/heating-health` | `*/30 * * * *` |
| Automation ECS | `/api/cron/water-heater-automation` | `*/15 * * * *` (depuis le 2026-11-09 ; journal : une entrée par heure ou par commande) |
| Health ECS | `/api/cron/water-heater-health` | `0 */2 * * *` |
| Notifications check-in | `/api/cron/checkin-notifications` | `*/10 * * * *` |
| Synchro serrure Nuki | `/api/cron/nuki-sync` | `0 * * * *` |
| Veille caméra (mouvement) | `/api/cron/camera-watch` | `*/5 * * * *` |
| Suivi ménage (Sophie) | `/api/cron/cleaning-watch` | `0 * * * *` |
| Préparation d'arrivée | `/api/cron/arrival-readiness` | `35 * * * *` (jour et nuit) |
| Keepalive Beds24 | `/api/cron/beds24-keepalive` | `0 4 * * 1` |
| Veille événements | `/api/cron/events-watch` | `0 8 * * 1` |

Authentifiés via header `Authorization: Bearer {CRON_SECRET}`.

Crons **Vercel** (déclarés dans `vercel.json`, une fois par jour au plus sur le plan Hobby) : `heating-automation` 7 h et `heating-health` 8 h (en doublon de cron-job.org), `pricing-snapshot` 5 h, `pricing-report` lundi 6 h, `pricing-review-reminder` mardi 7 h, `beds24-backup` dimanche 3 h (UTC).

### Sauvegarde Beds24 (cron Vercel, hebdomadaire)

`/api/cron/beds24-backup` aspire tout le compte (lignes de facture, infoItems, voyageurs) par la voie `lecture` et l'écrit gzippé dans **Vercel Blob en accès privé** : `beds24-backup/AAAA-MM-JJ_N.json.gz` (N = nombre de réservations). Données personnelles : rien du contenu dans la réponse, les logs ou la notification. Rétention : 8 sauvegardes. Garde-fou : une sauvegarde vide ou sous la moitié de la précédente n'est pas écrite et n'efface rien. Succès → ntfy priorité 1 ; échec → priorité 4. `?dry=1` lit Beds24 et vérifie le store sans rien écrire.

Store : `barbusse-sauvegardes` (privé, région cdg1, relié en Production + Development), créé le 2026-11-07 ; première sauvegarde le même jour. ⚠️ Lier un store par la CLI (`vercel blob create-store`) réécrit `.env.local` et ajoute `.env*` au `.gitignore` : sauvegarder le fichier avant, refusionner après.

### Keepalive Beds24 (refresh token)

Beds24 **invalide un refresh token qui n'a pas servi depuis 30 jours** (`401 Token not valid`).

Le cron `/api/cron/beds24-keepalive` force l'échange des **quatre** refresh tokens chaque lundi
4 h, hors cache — c'est l'échange qui repousse l'échéance, pas la lecture d'un access token
encore valide gardé en mémoire. Aucun des quatre ne s'entretient seul de façon fiable (usage
rare ou intermittent). Les quatre sont tentés même si le premier échoue — un jeton mort ne doit
pas en entraîner un second — et chaque échec déclenche une alerte ntfy (`sendBeds24Alert`)
nommant les scopes exacts à régénérer pour cette voie-là.

⚠️ **Plusieurs de ces morts seraient silencieuses.** Si le jeton public meurt, le repli vers la
lecture prend le relais : le tunnel continue de fonctionner, en ayant reperdu la séparation des
privilèges, sans que rien ne le signale à l'écran. Seul le keepalive rend cette dégradation
visible (historique : docs/journal.md § Cron Jobs (via cron-job.org)).

**Régénérer un refresh token** (si l'alerte tombe, ou en cas de `401 Token not valid`) :

1. Beds24 > SETTINGS > ACCOUNT > ACCESS > générer un invite code avec **les scopes de la voie** : l'alerte ntfy et la réponse du cron les nomment (`REPARATION` dans `app/api/cron/beds24-keepalive/route.ts`), le tableau de « Beds24 API (v2) » les récapitule.
2. `curl -H "code: <INVITE>" -H "deviceName: coliving-barbusse-<voie>-AAAA-MM" https://api.beds24.com/v2/authentication/setup` (ou `scripts/beds24-setup.mjs`) — **jamais** `/authentication/token`, qui consomme le code sans montrer le token.
3. Copier le champ `refreshToken` dans la variable de la voie (`.env.local` + Vercel, par `vercel env rm` puis `vercel env add`).
4. Redéployer (`npx vercel --prod`, ou le prochain push sur `main`) : une variable modifiée n'est lue qu'au déploiement suivant.

L'invite code est à usage unique ; sa validité est courte (« ~20 min » et « 24 h » ont été notés tous deux, non revérifié).

### Notifications check-in (push ntfy.sh)

Détecte l'utilisation du code Nuki par un voyageur via la serrure connectée et envoie une notification push.

- **Détection** : première ouverture réussie au clavier par le code `<n° de réservation>: …`, lue dans le **journal de la serrure** (`keypadArrivals` du socle, `GET /smartlock/{id}/log`). L'ancien signal — un `infoItems[]` `CHECKIN` que déposait le connecteur Beds24 → Nuki, horodaté dans `createTime` — reste lu en secours pendant la transition ; il disparaît avec le connecteur.
- **Cron** : `/api/cron/checkin-notifications` toutes les 10 min, fenêtre arrivées J-3 → J+1.
- **Contenu** : le **prénom seul** (`firstNameOnly` du socle), jamais le nom de famille — le sujet ntfy n'a pour secret que son nom.
- **Anti-doublon** : Redis `checkin:notified:{bookingId}` (TTL 60 jours) — une seule notif par résa, même si le code est retapé.
- **Priorité 3** (4 jusqu'au 2026-11-10) : une information, pas une panne.
- **Service push** : ntfy.sh (gratuit, topic privé non-devinable). Variable `NTFY_TOPIC` = URL complète (ex `https://ntfy.sh/coliving-barbusse-xxxxx`). Subscribe au topic depuis l'app ntfy mobile.
- **Helper** : `sendNtfy(message, { title, priority, tags, click })` de `@sejour/socle/lib/ntfy`. Encode automatiquement le titre en RFC 2047 pour les emojis/accents (les headers ntfy doivent être ASCII).
- **Kill switch** : `CHECKIN_NOTIFICATIONS_ENABLED=false` désactive sans redéployer (le cron retourne `{ skipped: "disabled" }`).
- **Statuts ignorés** : `cancelled`, `black`.
- **Domaine canonique pour les crons externes** : `https://www.coliving-barbusse.fr/api/cron/...` (le 308 redirect de `coliving-barbusse.fr` → `www.` drop le header `Authorization` → 401).

### Veille des dates d'événements (push ntfy, hebdomadaire)

`/api/cron/events-watch`, le lundi matin. Rappelle d'aller vérifier les dates de
`lib/events.ts` qui ne sont pas encore officielles (`confirmed: false` — une seule au 2026-11-07, `test-24h-2027`), et de recopier le calendrier de l'année suivante quand le circuit l'a publié.

- **Règles** : dans `@sejour/socle/lib/events-watch`. Ce site n'en tient que les seuils,
  `EVENTS_WATCH` à côté du catalogue : projection à moins de **120 jours** signalée ; le
  catalogue de l'année en préparation doit compter au moins **10 entrées** — l'année suivante
  à partir du **1er octobre** (le calendrier complet du circuit paraît alors sur lemans.org),
  l'année en cours avant, donc toute l'année ; d'**octobre à décembre**, la fenêtre rappelle
  où regarder, avec lemans.org en lien de la notification.
- **Sans état**, contrairement au check-in : pas de clé Redis, pas de kill switch. La même
  alerte revient chaque lundi tant que le catalogue n'est pas mis à jour, et s'éteint seule
  ensuite. `?dry=1` rend les alertes sans rien envoyer, `&today=YYYY-MM-DD` permet alors de
  les lire à une autre date.
- **Envoi** : même `NTFY_TOPIC` que le check-in, priorité 2 (basse), titre « Veille
  événements — Coliving Barbusse ». `NTFY_TOPIC` absent → **500**, jamais un envoi ignoré.

## Veille caméra (Wansview / AJCloud, mouvement → ntfy)

Les caméras de la maison (Wansview / Cinnado, plateforme **AJCloud**) n'exposent ni RTSP ni
ONVIF dans l'appli, et leur flux vidéo passe par un **P2P propriétaire** (DLL `SE_P2PSDK`,
non réimplémenté). Mais leur **API cloud** se laisse interroger avec le compte Wansview : on y
lit l'état, l'image instantanée et surtout les **événements de mouvement** (image + clip vidéo).

| Pièce | Rôle |
|---|---|
| [lib/camera/ajcloud.ts](lib/camera/ajcloud.ts) | Client API cloud AJCloud : login (défi NaCl Box + signature HMAC-SHA256 `X-UAC-Signature`), `device-list`, `fetch-infos` (snapshot, RTSP local, en ligne), `alarms-survey` (mouvement). `tweetnacl` pour le chiffrement. |
| [lib/camera/watch.ts](lib/camera/watch.ts) | Logique pure : nouveaux événements depuis le dernier `cts`, mise en forme. Testée (`tests/camera/`). |
| `/api/cron/camera-watch` | Toutes les 5 min (cron-job.org). Relaie vers ntfy les nouveaux mouvements, image en pièce jointe, clip vidéo au tap. `?dry=1` calcule sans envoyer. |

- **Anti-inondation** : au premier passage d'une caméra, aucune notification — on pose seulement
  la ligne de base `barbusse:camera:last-cts:<did>` (Redis). Les passages suivants ne notifient
  que ce qui est postérieur. Plafond de 6 alertes par passage.
- **Dépôt public** : les URLs d'image et de vidéo sont **signées** (jetons temporaires) ; jamais
  dans la réponse du cron ni dans les logs, seulement dans la notification.
- **Vidéo en direct dans le dashboard** : non faite. Le flux `rtsp://<IP locale>:554/...` (donné
  par `fetch-infos`) n'est joignable que depuis le réseau de la maison — il faudra un relais sur
  place (VM Freebox + go2rtc). Le P2P reste non réimplémenté (repli possible : caméra ONVIF).
- Variables : `AJCLOUD_EMAIL`, `AJCLOUD_PASSWORD`, `NTFY_TOPIC`, `CRON_SECRET` ;
  `CAMERA_WATCH_ENABLED=false` coupe sans redéployer.

## Suivi de la femme de ménage (Sophie)

Alerte quand Sophie arrive, et journal de ses passages. Trois sources, chacune facultative :

| Source | Pièce | Rôle |
|---|---|---|
| **Garage** (Intratone) | [lib/cleaning/intratone.ts](lib/cleaning/intratone.ts) | Ouvertures par code clavier du digicode (le code dont le libellé contient `CLEANER_NAME`). |
| **Porte** (Nuki) | journal de la serrure | Code manuel « # Sophie », lu via `listLog` du socle. |
| **Caméra** (mouvement) | [lib/camera/ajcloud.ts](lib/camera/ajcloud.ts) | Derniers mouvements, pour **estimer** l'heure de sortie. |

| Pièce | Rôle |
|---|---|
| [lib/cleaning/sessions.ts](lib/cleaning/sessions.ts) | Logique pure : fusion des arrivées, dédoublonnage (<45 min), estimation de sortie, durée. Testée (`tests/cleaning/`). |
| `/api/cron/cleaning-watch` | Horaire (cron-job.org). Ligne de base au 1er passage, puis ntfy par nouvelle arrivée. **Persiste et affine** les sessions dans le magasin `barbusse:cleaning:log` (`lib/cleaning/store.ts`). `?dry=1` calcule sans envoyer. |
| `/api/dashboard/suivi` + `/dashboard/suivi` | **Page admin « Suivi »** : **lit le magasin persistant** (plus de recalcul en direct), totaux par personne (heures/coût), graphe mensuel, journal. `lib/cleaning/sources.ts` fournit les 4 sources au cron **et** à l'amorçage de la page. |
| [lib/cleaning/store.ts](lib/cleaning/store.ts) | Magasin Redis des passages (hash `barbusse:cleaning:log`, clé `who:arrivalMs`). ⚠️ **La sortie estimée ne peut que progresser, jamais régresser ni revenir à `null`** : c'est ce qui corrige la perte (un mouvement caméra qui vieillit et quitte le cloud ne fait plus disparaître la sortie). Le cron l'affine chaque heure. |
| `/api/dashboard/video` + `/dashboard/video` | **Page admin « Vidéo »** : caméras Wansview (image rafraîchie ≈30 s + galerie des mouvements, clips `.ts` lus par `mpegts.js`), encarts ICSee/ANRAN « non connectées ». Le **direct** continu viendra d'un pont local (go2rtc/Freebox) via `CAMERA_LIVE_BASE`, pas de Vercel. |

- **Intratone** n'a pas d'API publique. Séquence (reconstituée) : `connexion.php` (FormData
  identifiant/mdp/device) → `data/connect.php?SID=` (bootstrap legacy) → `data/events/evts.php` (sélection
  de la centrale `INTRATONE_CENTRALE_ID`) → `data/events/evts_list.php` `evt=4` (code clavier). ⚠️ Les
  événements récents n'apparaissent qu'après « récupération » depuis l'interphone (auto pour les modèles
  connectés ; `evts_recup` est refusé hors UI) — d'où un cron **horaire**, pas temps réel.
- **Les ouvertures ne tracent que les entrées** (sortie par bouton poussoir interne, sans nom). La fin de
  visite est donc **estimée** (dernier mouvement caméra, sinon BP), pas mesurée. Les heures servent à
  **recouper la facture de Sophie, pas à pointer** (statut auto-entrepreneur, risque de salariat déguisé).
- Rien de sensible en clair ni dans les logs (identifiants, jwt, code). Le dépôt est public : l'id de
  centrale et le code de Sophie restent **hors du dépôt** (variables d'environnement).
- Variables : `INTRATONE_USER/PASS`, `INTRATONE_CENTRALE_ID`, `TRACKED_PEOPLE` (nom:rôle),
  `CLEANING_RATES` (« Sophie:21 » en €/h, pour le coût de la page Suivi), plus `NUKI_*`,
  `AJCLOUD_*`, `NTFY_TOPIC`. `CLEANING_WATCH_ENABLED=false` coupe.
- **Page admin `/dashboard/suivi`** : cartes par personne (passages, heures estimées, coût),
  graphe mensuel, journal des passages. Les heures/sorties ne couvrent que les visites récentes
  (historique caméra limité) — assumé, affiché « estimé ». Admin seulement (hors liste blanche viewer).

## Redis (client unique, `lib/redis.ts`)

`getRedis()` est le seul client Upstash du site (les six copies ont été retirées le 2026-11-07). Les **nouvelles** clés passent par `redisKey(...)` → préfixe `barbusse:` ; les anciennes (`heatzy:*`, `cozytouch:*`, `nuki:*`, `checkin:notified:*`, `pricing:*`, `invoice:counter:*`) ne sont **pas** renommées : verrous, compteurs de factures et anti-doublons repartiraient de zéro.

## Variables d'environnement

```
DASHBOARD_PASSWORD       # Mot de passe admin
DASHBOARD_PASSWORD_VIEWER # Mot de passe viewer (calendrier + chauffage)
DASHBOARD_PASSWORD_VIEWER_* # Mots de passe viewer nommés, même accès (ex: DASHBOARD_PASSWORD_VIEWER_Sylvie)
DASHBOARD_SECRET         # Secret JWT (HS256)
BEDS24_PUBLIC_REFRESH_TOKEN # Page publique : read:inventory, read:properties. Rien d'autre.
BEDS24_READ_REFRESH_TOKEN   # Dashboard, factures, fiscal : + read:bookings & -personal & -financial.
                            # Aussi utilisé par scripts/beds24-backup.mjs.
BEDS24_REFRESH_TOKEN        # Notes de ménage, NUKI_PIN, confirmation : read:bookings, write:bookings. Ne voit pas l'argent.
BEDS24_MESSAGES_REFRESH_TOKEN # Messages voyageur : read:bookings + read/write:bookings-personal.
BEDS24_PRICING_REFRESH_TOKEN  # Envoi des prix : read:inventory + write:inventory, aucun repli (à créer).
PRICING_PUSH_MODE           # off (défaut) | dry | live — l'envoi réel exige live ET pas de coupe-circuit.
PRICING_MAX_DATES           # Dates modifiées par envoi, 60 par défaut (395 au plus, relevé pour la bascule).
PRICING_MAX_CHANGE          # Variation avant quarantaine, 0.25 par défaut (relevé pour la bascule).
                            # /bookings/messages refuse tout jeton sans la variante -personal.
                            # Les quatre sont des refresh tokens — plus aucun long life depuis le 2026-09-11.
                            # Obtenus via un invite code (Settings → API → Invites) échangé par
                            # scripts/beds24-setup.mjs, soit GET /authentication/setup.
                            # JAMAIS /authentication/token : il consomme le code sans montrer le token.
HEATZY_EMAIL             # Email du compte Heatzy
HEATZY_PASSWORD          # Mot de passe du compte Heatzy
CRON_SECRET              # Secret pour les cron jobs
WIFI_SSID                # Wi-Fi de la maison (lib/wifi.ts) : lu AU BUILD par le guide d'arrivée prérendu,
WIFI_PASSWORD            # un changement exige un redéploiement. Absentes : le guide renvoie vers l'hôte.
                         # Risque accepté (2026-11-08) : l'ancien mot de passe reste dans l'historique git
                         # public et le guide (noindex, sans authentification) l'affiche ; l'hôte ne le change pas.
QUOTE_SIGNING_SECRET     # Signe les devis IA (/devis/<jeton>), 32 caractères au moins. Rotation :
                         # l'ancien passe dans QUOTE_SIGNING_SECRET_PREVIOUS pendant 7 jours.
KV_REST_API_URL          # Upstash Redis (chauffage, crons, factures, pricing, Nuki, déliements)
KV_REST_API_TOKEN        # Noms de l'intégration Vercel, pas les UPSTASH_* de la console
HISTORIQUE_BARBUSSE      # Archive 310268 : JSON gzippé + base64, sans infoItems (voir « Historique archivé »)
NUKI_API_TOKEN           # Nuki Web
NUKI_SMARTLOCK_ID        # Id de la serrure (toujours viser l'id, jamais le nom)
NUKI_SYNC_MODE           # "live" pour écrire ; toute autre valeur = à blanc
AJCLOUD_EMAIL            # Compte Wansview/AJCloud (veille caméra). Absentes → le cron se tait.
AJCLOUD_PASSWORD         # Mot de passe du compte Wansview. API cloud seulement (pas le P2P vidéo).
CAMERA_WATCH_ENABLED     # Optionnel : "false" pour couper la veille caméra sans redéployer
INTRATONE_USER           # Portail Intratone (digicode garage) — suivi ménage
INTRATONE_PASS           # Mot de passe Intratone
INTRATONE_CENTRALE_ID    # Id de la centrale digicode du garage (hors dépôt : dépôt public)
TRACKED_PEOPLE           # Optionnel : "Sophie:ménage,Eric:dépannage" — personnes suivies (nom:rôle)
CLEANING_WATCH_ENABLED   # Optionnel : "false" pour couper le suivi ménage sans redéployer
CLEANING_RATES           # Optionnel : "Sophie:21" (€/h) — coût estimé sur la page /dashboard/suivi
CAMERA_LIVE_BASE         # Optionnel : URL du pont vidéo local (go2rtc/Freebox) pour le direct dans /dashboard/video
BEDS24_WEBHOOK_SECRET    # En-tête x-webhook-secret du webhook Beds24
DEEPL_API_KEY            # Local seulement (scripts/translate-reviews.mjs), pas sur Vercel
BLOB_READ_WRITE_TOKEN    # Store Vercel Blob PRIVÉ de la sauvegarde Beds24 (posé par Vercel à la liaison du store)
LOCKED_DEVICES           # Device IDs verrouillés (comma-separated, optionnel)
COZYTOUCH_EMAIL          # Email du compte Cozytouch/Atlantic
COZYTOUCH_PASSWORD       # Mot de passe du compte Cozytouch
INVOICE_LEGAL_NAME       # Nom du loueur affiché sur la facture
INVOICE_ADDRESS_LINE1    # Rue du loueur
INVOICE_ADDRESS_LINE2    # CP + ville du loueur
INVOICE_EMAIL            # Email de contact affiché sur la facture
INVOICE_PHONE            # Téléphone (optionnel)
INVOICE_IBAN             # IBAN sans espaces (beneficiaire virement)
INVOICE_BIC              # BIC / SWIFT
INVOICE_BANK_NAME        # Nom de la banque
INVOICE_WEBSITE          # URL du site affichée sur la facture (optionnel)
STRIPE_SECRET_KEY        # Clé Stripe (restricted read-only suffit) pour lister les paiements

# Notifications push (alertes des crons, check-in, veille des événements, pricing, sauvegarde)
NTFY_TOPIC                            # URL complète du topic ntfy (ex https://ntfy.sh/coliving-barbusse-xxx)
CHECKIN_NOTIFICATIONS_ENABLED         # Optionnel : "false" pour désactiver les notifs check-in sans redeploy

# Fiscalité (dashboard /dashboard/fiscal)
FISCAL_TMI                               # Taux marginal d'imposition (ex 0.30 pour 30 %) — utilisé dans le simulateur
FISCAL_NB_PARTS                          # Parts fiscales foyer (ex 3 pour couple + 2 enfants)
FISCAL_REVENU_IMPOSABLE_MONSIEUR         # Net imposable annuel M. (case 1AJ, AVANT abattement 10 %)
FISCAL_REVENU_IMPOSABLE_MADAME           # Net imposable annuel Mme (case 1BJ)
FISCAL_REVENU_IMPOSABLE_FOYER            # Fallback si M./Mme non renseignés individuellement
FISCAL_AUTRES_REVENUS_ACTIVITE_FOYER     # Net imposable APRÈS abattement 10 % (M. + Mme) pour test LMP
```
