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
npm test         # Tests unitaires (vitest, tests/)
git push         # Sur main : déploie la production (intégration GitHub de Vercel)
```

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
    guide-arrivee/    # Guide voyageurs noindex (accès, Wi-Fi QR, chauffage, café, lits d'appoint, checkout)
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
      heating-automation/  # Check-in/check-out → mode présence/hors-gel
      heating-reset/       # Reset modes + températures (0h,4h,8h,12h,16h,20h)
      heating-health/      # Check connectivité + alertes ntfy
      water-heater-automation/ # Profil eau chaude selon le nombre de personnes présentes
      water-heater-health/     # Dérive mode/consigne/boost, hors ligne, sous-chauffe → ntfy
      checkin-notifications/   # Première ouverture au clavier → ntfy
      nuki-sync/               # Horaire : codes du clavier ← réservations Beds24
      beds24-keepalive/        # Lundi : échange des 4 refresh tokens Beds24
      beds24-backup/           # Dimanche (Vercel 03:00 UTC) : sauvegarde Beds24 → Blob privé
      events-watch/        # Hebdo : rappel des dates d'événements à confirmer / calendrier à remplir (ntfy)
      pricing-snapshot/    # Quotidien (Vercel 05:00 UTC) : photo prix/séjour min/dispo 365 j → Upstash
      pricing-report/      # Lundi (Vercel 06:00 UTC) : rapport d'évaluation du pricing (ntfy), ?dry=1
components/
  public/             # Composants du site vitrine
  dashboard/          # Composants du dashboard
    HeatingZoneCard   # Carte zone avec contrôle groupé
    HeatingDeviceCard # Carte device (mode, temp, tendance, présence, alertes)
lib/
  blog/
    posts.ts          # BLOG_POSTS avec locales = Record<Locale, LocalizedPost> (fr/en/it/de/es) + soldOut + nextEdition + supersededBy
    content/
      fr/             # 21 articles FR (Link hrefs préfixés /fr)
      en/             # 21 articles EN (Link hrefs préfixés /en)
      it/             # 21 articles IT (Link hrefs préfixés /it)
      de/             # 21 articles DE (Link hrefs préfixés /de)
      es/             # 21 articles ES (Link hrefs préfixés /es)
  events.ts           # LE_MANS_EVENTS (calendrier ACO + Hippodrome) + shortEventLabel.
                      # Type et fonctions dans @sejour/socle/lib/events (Lot 5).
  # periodes.ts, calendar-utils.ts, channel.ts, cron-auth.ts, ntfy.ts et time.ts vivent
  # désormais dans @sejour/socle — voir sa CLAUDE.md.
  i18n/               # Traductions FR/EN/IT/DE/ES (dictionaries/, context, types)
  property-info.ts    # PROPERTY_INFO (adresse, check-in/out par locale, Wi-Fi, contact, navigation links)
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
  (`lib/property-info.ts`, `lib/guest-messages.ts`, guide d'arrivée, code Nuki).
- Ce fichier est la **référence au présent**. Les récits datés, enquêtes et débogages résolus
  vont dans [docs/journal.md](docs/journal.md), sous le même titre de section.

## CI et tests

- **CI** : `.github/workflows/ci.yml` — `npm ci`, lint, `typecheck`, `test`, `build`, sur chaque push et PR. Le build ne doit exiger **aucune** variable d'environnement (vérifié sans `.env.local`) : une variable lue au build est un défaut à corriger dans le code, pas un secret à ajouter à la CI. Le socle, en `git+ssh` dans le lock, est forcé en HTTPS sur le runner.
- **Tests** : vitest, dans `tests/` (hors de `lib/`). Tests de caractérisation du rapport hebdomadaire du pricing et de `diffSnapshots`. Données **inventées** (dépôt public). Le socle est transformé par vitest (`server.deps.inline`) car il est publié en TypeScript source.
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
- [ ] CI GitHub Actions dans le socle (`npm test` + `npm run verifier`) et dans Albiez (lint, types, build), sur le modèle de `.github/workflows/ci.yml`.
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
- Pages avec T object local (seminaires, guide-arrivee, chambres) : maintenir les 5 entrées dans le `Record<Locale, ...>`.
- **Liens vers Beds24** : l'URL `booking2.php` doit porter `&lang=${locale}` pour que la page de paiement ET les Auto Actions soient dans la bonne langue. Les codes `Locale` (fr/en/it/de/es) sont déjà au format ISO 639-1 attendu par Beds24, pas de mapping nécessaire. Voir [components/public/ReservationCalendar.tsx](components/public/ReservationCalendar.tsx). Prérequis Beds24 : langues activées sur la booking page (Settings → Properties → Booking Page → Languages).
- Quand on ajoute une 6ᵉ locale : elle se déclare **dans le socle** (`lib/locales.ts` : `Locale`, `LOCALES`, `LOCALE_META`), et tout ce qui en dérive suit seul — `generateStaticParams`, les `hreflang` des six pages, le sitemap, la négociation de `/`. Reste à faire ici, et seulement ici : créer le dictionnaire, traduire tous les objets `T` locaux (seminaires, guide-arrivee, chambres), `PROPERTY_INFO.checkIn/checkOut`, les 21 articles de blog et leurs `BLOG_POSTS.locales`, et étendre la regex `/reservation` du `proxy.ts`.

## SEO

- `lib/seo.ts` compose **`@sejour/socle/lib/seo`** avec l'URL et le nom du site, et ne déclare plus que les chemins : `homePath`, `roomsPath`, `seminarsPath`, `arrivalGuidePath`, `blogPath`, `blogPostPath`.
- Toute page déclare ses `alternates` avec `alternatesFor(locale, unPathFor)` — **jamais** de liste `languages` écrite à la main.
- `app/sitemap.ts` construit ses `hreflang` avec le **même** `hreflangMap` que le `<head>`. Il conserve deux règles métier propres au site : le filtre `!post.supersededBy`, et pas de `lastModified` sur les pages statiques.
- `openGraph` : la fusion de Next est **en surface**. Une page qui déclare un bloc `openGraph` remplace celui du layout et perd `og:image` / `og:site_name` — c'est le cas de l'accueil, des séminaires et des articles. Le layout porte `openGraphLocales(locale)` pour les autres.
- **JSON-LD de `/seminaires`** : deux nœuds, `LodgingBusiness#lodging` et `FAQPage#faq`. Celui de l'accueil décrit la maison, celui-ci décrit **ce qu'elle permet en séminaire** — d'où `maximumAttendeeCapacity: 20`, la capacité de travail assis en intérieur chauffé (grande table de 16 places + les 2 mini-tables de la véranda, depuis novembre 2026 ; avant, 12 à l'îlot). Les questions de la `FAQPage` sont celles rendues dans la page, avec des réponses autosuffisantes : Google en extrait une seule, elle doit rester vraie hors contexte.
- `app/robots.ts` ne bloque que `/dashboard/` et `/api/dashboard/`. **Ne pas y remettre `/api/`** : Googlebot exécute le JS du calendrier et le photographierait vide.

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
`calendar.directDiscount`, 5 langues). **Détail complet (plan + config Beds24 + résultats vérifiés)** : [docs/refonte-pricing.md](docs/refonte-pricing.md).

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
| [lib/access-sync.ts](lib/access-sync.ts) | Lit Beds24 + serrure, exécute dans l'ordre du plan, alerte (ntfy, dédoublonné Redis `nuki:alert:*`). Verrou Redis `nuki:sync:lock`. |
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
  admin la ferait réapparaître chez lui). ⚠️ Mais `/api/dashboard/event-links` **manque à
  `allowedPaths`** de `proxy.ts` : le proxy rend 403 au viewer, dont le calendrier retombe sur
  l'étiquetage automatique. À ajouter à la liste blanche.
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

## Cozytouch (Ballon thermodynamique Atlantic)

- **API** : Overkiz (`https://ha110-1.overkiz.com/enduser-mobile-web/enduserAPI`)
- **Auth** : 3 étapes (Atlantic token → JWT → Overkiz session JSESSIONID)
- **Client ID** : constant dans `lib/cozytouch.ts`
- **Session** : cachée en Redis (TTL 8h) + in-memory (60s), retry sur 401
- **Device** : `modbuslink:AtlanticDomesticHotWaterProductionMBLComponent`
- **Device URL** : `modbuslink://1908-1459-2296/1#1`, sensor `#2`

### Configuration physique

- Ballon thermo Atlantic (250L) **en série** avec un ballon classique Chauffeo 300L (ref 022122)
- Le thermo **préchauffe** l'eau en amont, le classique sert de tampon/backup
- Consigne thermo : **58°C** (pour que le classique à ~55°C ne se déclenche quasi jamais)
- Thermostat classique : position 2 (~55°C), réglage manuel

### Modes Cozytouch

| App Cozytouch | API (`modbuslink:DHWModeState`) | Dashboard |
|---|---|---|
| Éco+ | `autoMode` | Auto |
| Éco | `manualEcoActive` | Éco |
| Manuel | `manualEcoInactive` | Performance |

### Commandes (préfixe `modbuslink:` / `core:`)

- `setDHWMode` : autoMode / manualEcoActive / manualEcoInactive
- `setBoostMode` : "on" / "off"
- `setTargetDHWTemperature` : [temp] (50-65)
- `setAbsenceMode` : "on" / "off"
- Refresh : `refreshBottomTankWaterTemperature`, `refreshMiddleWaterTemperature`, etc.

### States clés

- `core:BottomTankWaterTemperatureState` — temp bas du ballon
- `modbuslink:MiddleWaterTemperatureState` — temp milieu
- `core:TargetDHWTemperatureState` — consigne
- `modbuslink:DHWModeState` — mode actuel
- `modbuslink:DHWBoostModeState` — "on"/"off"
- `core:HeatingStatusState` — "Heating" quand chauffe
- `core:RemainingHotWaterState` — litres restants
- `core:NumberOfShowerRemainingState` — douches estimées
- `modbuslink:DHWCapacityState` — capacité (250L)
- `modbuslink:HeatPumpOperatingTimeState` — heures PAC
- `modbuslink:ElectricBoosterOperatingTimeState` — heures résistance

### Automation eau chaude (cron `water-heater-automation`)

Profil calculé à partir du nombre de personnes présentes (somme `numAdult + numChild` sur les bookings actifs + check-in du jour après 12h) :

| Profil | Personnes | Mode | Consigne | Boost (fenêtre COP max) |
|---|---|---|---|---|
| `vacant` | 0 | Éco | 50°C | off |
| `low` | 1–4 | Auto | 55°C | off |
| `normal` | 5–8 | Auto | 58°C | off |
| `high` | 9–12 | Performance | 60°C | on 12h–15h |
| `xl` | 13+ | Performance | 60°C | on 11h–16h |

**Logique** :
- Ballon dans un garage non chauffé → COP meilleur en journée (air ambiant chaud), mauvais la nuit. Le Boost est volontairement programmé en milieu de journée uniquement.
- Plafond 60°C → reste en PAC pure (au-delà, la résistance électrique prend le relais : coût ×3).
- Pré-chauffe check-in : à partir de 12h si `guests ≥ 5`, le profil cible est appliqué pour que le ballon soit chargé à l'arrivée (17h).
- Statuts `cancelled` et `black` exclus du comptage (helper partagé `lib/bookings.ts`).

**Cron de santé** `water-heater-health` (toutes les 2h) : alerte ntfy si dérive mode/consigne/boost, ballon hors ligne, ou sous-chauffe (`bottomTemp < consigne - 8°C` avec occupation).

## Factures PDF (LMNP)

### Le réglementaire vient du socle (Lot 4)

Factures, taxe de séjour et module fiscal sont montés dans `@sejour/socle` le 2026-09-11.
Les **mécanismes** y vivent, les **valeurs** restent ici :

| Ici | Là-bas |
|---|---|
| `lib/invoice-config.ts` — `INVOICE_TEMPLATE` (nom, accroche, couleur, logo, objet, mention de TVA, pied de page) et `INVOICE_COUNTER_PREFIX` | `@sejour/socle/lib/invoice-config` — lecture des `INVOICE_*`, types |
| `lib/invoice-number.ts` — le client Upstash | `@sejour/socle/lib/invoice-number` — `createInvoiceNumbering`, `PREVIEW_NUMBER` |
| — | `@sejour/socle/lib/invoice-payload` — payload, traducteurs, validation |
| — | `@sejour/socle/lib/invoice-pdf` — gabarit React-PDF |
| `lib/taxe-sejour.ts` — `TAXE_SEJOUR_CONFIG`, le barème du Mans | `@sejour/socle/lib/taxe-sejour` — le moteur |
| `lib/fiscal.ts` — répertoire des données, accès Beds24, collectivité | `@sejour/socle/lib/fiscal/*` — les 8 fichiers de calcul |

`lib/invoice-payload.ts`, `lib/invoice-pdf.tsx` et `lib/fiscal/` **n'existent plus ici**.
`components/dashboard/InvoiceForm.tsx` reste : c'est de la composition d'écran, propre à ce
site.

**⚠️ Clé du compteur : `invoice:counter:barbusse:{année}`** (préfixée par entité). Le socle
reprend l'ancienne clé `invoice:counter:{année}` au premier numéro attribué (`legacyKey`), pour
ne jamais réémettre un numéro ; le paramètre `legacyKey` de `lib/invoice-number.ts` pourra être
retiré une fois 2026 close (historique : docs/journal.md § Factures PDF (LMNP)).

**⚠️ La mention 293B est dans `INVOICE_TEMPLATE`, pas dans le gabarit.** Elle est
obligatoire côté socle, sans valeur par défaut : une autre entité, une autre mention, et une
facture qui porte la mention d'un régime qui n'est pas le sien est irrégulière.

**Le prestataire de paiement se nomme dans `lib/stripe.ts`** (`StripePaymentDetail.method`,
« Carte bancaire via Stripe », exigé par le socle sans le deviner). Traducteurs :
`beds24PaymentToPayload` et `paymentToPayload`. Clés du barème dans la réponse de
`/api/dashboard/taxe-sejour` : `collectivite`, `tauxPourcent`, `plafondParPersonneNuit`,
`tauxDepartemental` (anciens noms : docs/journal.md § Factures PDF (LMNP)).

**Le module fiscal n'a qu'un seul consommateur, et c'est une exception assumée** à la
règle 6 du socle — la SCI d'Albiez est à l'IS et sa comptabilité est chez Indy.fr. La note
est dans `@sejour/socle/lib/fiscal/README.md`.

Émet une facture PDF pour un paiement (virement attendu **ou** paiement Stripe déjà reçu). Deux sources de pré-remplissage : **Beds24** (réservations/inquiries) et **Stripe** (paiements réussis).

### Flux (admin only)

1. Dashboard → **Factures**. Deux onglets :
   - **Beds24** : liste des réservations/inquiries avec filtres (Tous / Inquiries / Direct / Airbnb / Booking / Abritel).
   - **Stripe** : derniers paiements Stripe réussis (90 jours).
2. Clic « Créer une facture » ou saisie d'un ID → page formulaire pré-rempli.
3. Champs éditables : client (company, nom, adresse, email, tél), séjour, montant, date limite (virement) ou **case « Déjà payé »** avec date + méthode + référence (Stripe).
4. Clic « Générer le PDF » → le numéro de facture est alloué (`AAAA-NNN` via Upstash `INCR invoice:counter:barbusse:{year}`) et le PDF est téléchargé.

### Caractéristiques du PDF

- Bannière avec logo SVG (maison rose), « COLIVING BARBUSSE », site web, email.
- Bloc client (raison sociale si entreprise, adresse complète).
- Si le champ `title` Beds24 n'est pas une civilité (M., Mme, etc.), il est utilisé comme raison sociale.
- Mention **« TVA non applicable, art. 293B du CGI »** (LMNP).
- **Bloc paiement conditionnel** :
  - `payload.paid === false` → bloc rose « Paiement par virement » avec IBAN/BIC et n° facture comme libellé de virement. Bandeau rouge « Paiement attendu avant… ».
  - `payload.paid === true` → bloc vert « ✓ Paiement reçu » avec montant, méthode, date, référence Stripe. Bandeau vert « Merci de votre paiement ». La facture vaut reçu.
- `<View wrap={false}>` sur le bloc paiement pour éviter qu'il soit coupé entre deux pages.

### Réservation payée sur une plateforme (socle v3.5.1+)

Airbnb et Booking.com (seulement en « Payments by Booking.com », repéré par l'info
`BOOKINGCOMBANKTRANS`) encaissent pour le compte de l'hôte : le formulaire arrive
**« Déjà payé » coché**, sans IBAN, méthode « Via Airbnb » / « Via Booking.com », référence =
numéro de la plateforme (`apiReference`).

- **Abritel n'en est pas** : le voyageur Abritel **nous** paie par Stripe (échéancier Beds24,
  ou facture Stripe si la carte est refusée) et Abritel prélève sa commission ensuite. La
  réservation reste « à payer » ; la facture acquittée se fait depuis l'onglet **Stripe**, qui
  a la vraie date (82631846 : réservée le 20/02, payée le 22/02).
- **La date proposée est le jour de la réservation** (Paris). Beds24 ne transmet la date du
  débit sur aucun des deux canaux (vérifié sur l'API le 2026-09-25). Un avertissement ambre
  sous le champ dit pourquoi la vérifier, **renforcé pour un séjour à venir** (paiement en
  plusieurs fois peut-être incomplet). Il disparaît dès que la date est modifiée.
- **Arbitrage de l'exploitant (2026-09-25) : toujours pré-remplir**, y compris avant
  l'arrivée. `le-percepteur` recommandait de laisser la date vide dans ce cas ; le contrôle
  repose sur l'avertissement.
- L'avertissement vient de `platformPayment` dans la réponse de `invoices/prefill`
  (`platformPaymentOf(booking, todayParis())`).

**Emails générés** : l'URL de signature est `SITE_URL` (`www.coliving-barbusse.fr`), plus
l'adresse Vercel. Pour une réservation de plateforme, l'email complet invite à réserver en
direct la prochaine fois — **jamais le message court** (collé dans la messagerie de la
plateforme, qui l'interdit), et **jamais vers une adresse relais** (`@guest.booking.com`,
`*.airbnb.*`), qui aboutit dans cette même messagerie. Airbnb ne transmet aucune adresse.

### Taxe de séjour sur la facture (socle v3.6.0)

- **Booking.com et direct** : `price` contient la taxe (« City tax », « Taxe de séjour
  €2,20… »). Le champ **« Dont taxe de séjour »** est pré-rempli depuis les lignes Beds24
  (`touristTaxFromInvoiceItems`), et le PDF l'imprime sur sa propre ligne : **Total HT =
  montant − taxe**, puis TVA 0 %, puis « Taxe de séjour », puis Total TTC (inchangé).
- **Airbnb** : `price` = séjour + commission, **sans taxe** (0 ligne de taxe sur 48
  réservations, vérifié le 2026-09-25) — Airbnb collecte et reverse lui-même. Le champ
  **« Mention taxe de séjour »** est pré-rempli : « Taxe de séjour collectée et reversée
  directement par Airbnb : elle n'est pas incluse dans cette facture. »
- **Acompte / solde** : pas de ventilation (forfait), le champ est masqué.
- **Onglet Stripe** : la taxe n'est ventilée que si le paiement couvre tout le séjour.
  `findBookingByStripeIds` demande désormais `includeInvoiceItems` pour la lire.
- `getStripePayment` accepte enfin un `ch_…` (il remonte au Payment Intent) : la route
  l'annonçait, mais seul un `pi_…` fonctionnait.

À savoir : pour Booking.com, le champ « Demandes du client » arrive avec les métadonnées de
l'OTA (« THIS RESERVATION HAS BEEN PRE-PAID », « Payment charge is EUR … ») — à vider avant
d'émettre, sinon elles s'impriment.

### Acompte et solde (séjours facturés en deux temps)

Un séjour d'entreprise se règle en général par un acompte à la réservation puis un solde
avant l'arrivée. Le champ `kind` de `InvoicePayload` vaut `standard` (défaut), `acompte` ou
`solde` ; le sélecteur est en tête de la section « Montant & paiement » du formulaire.

- **`stayTotal`** (total TTC du séjour) est obligatoire dès que `kind !== "standard"`. Sans lui,
  le client ne peut pas rattacher la facture au séjour.
- **`priorInvoiceNumber` / `priorInvoiceDate` / `priorInvoiceAmount`** : l'acompte rappelé et
  déduit sur la facture de solde. La validation **refuse** un solde dont `acompte + solde`
  ne retombe pas sur `stayTotal` (tolérance 1 centime).
- Le PDF change de titre (`FACTURE D'ACOMPTE` / `FACTURE DE SOLDE`) et facture **en forfait**
  (quantité 1) au lieu du calcul par nuit : sinon un acompte de 30 % sur 6 nuits s'imprimait
  « 6 × 337,65 € », que la comptabilité du client lit comme un séjour à 2 025,90 €.
- Un récapitulatif (total séjour / acompte / reste à régler) s'insère au-dessus du bloc
  Total HT–TVA–Total TTC, l'ensemble en `wrap={false}` pour ne pas se couper au saut de page.
- Les modèles d'email et le message court générés après coup s'adaptent au type de facture.
- Le PDF est rendu en Helvetica : **pas de glyphe pour le signe moins U+2212**, qui
  disparaîtrait sans erreur. Utiliser le tiret ASCII pour les montants négatifs.

### Restrictions

- `/dashboard/invoices/**` et `/api/dashboard/invoices/**` : `proxy.ts` bloque viewer (redirect / 403) — et `invoices/prefill` **revérifie elle-même** : elle renvoie la réservation Beds24 brute, PIN de serrure compris, et ne doit pas dépendre d'un seul point de contrôle.
- Numérotation séquentielle **continue** (obligation légale FR) : le compteur n'est incrémenté qu'à la génération réelle, pas à l'ouverture du formulaire. Le bouton **Aperçu** (`POST …/generate?preview=1`) rend le PDF avec le numéro fictif `PREVIEW_NUMBER` sans toucher au compteur — relire un brouillon ne creuse plus de trou dans la série. La sentinelle est en ASCII pur car elle transite par l'en-tête `X-Invoice-Number`.
- **Dates au jour de Paris (socle v3.8.1, 2026-11-07)** : l'année du numéro (`invoice:counter:barbusse:{année}`), le « Émise le » du PDF, les dates par défaut du formulaire et l'échéance J+3 sont lus au calendrier de Paris. Avant, une facture faite entre 0 h et 1 h (2 h l'été) était datée de la veille, et celle du 1er janvier dans cette heure-là prenait un numéro de l'année précédente. Hors de cette fenêtre nocturne, rien ne change.

## Dashboard Fiscalité LMNP / LMP (`/dashboard/fiscal`)

Estimation indicative de l'imposition (IR + PS/SSI) et du test de bascule LMP,
à partir des résas Beds24 + charges saisies + données foyer. **Ne remplace pas
la déclaration officielle** (faite via LMNP.ai pour ce dossier).

> **La page lit le `Booking`, plus les lignes de facture** (socle `v2.0.0`) : `lib/fiscal.ts`
> fournit `fetchStays: getStays(...).then(soldBookings)`, le module du socle lit `gross` et
> `commission` — même CA que la page de statistiques. **Le défaut est contractuel** (réalisé +
> confirmé) ; la simulation d'année pleine ne s'obtient que par `?projected=true`, et l'écran
> ne l'expose pas. Le conseil « micro-social si recettes < 77 700 € » se compare au
> contractuel, et basculera à mesure que le carnet se remplit. Le bien manuel « Dahlias »
> n'entre dans aucun invariant. Dette : la réponse fiscale ne porte pas le mode projeté.

> **Le taux d'occupation est réalisé** (socle `v3.8.1`) : `occupancyRatio` = nuits réalisées
> ÷ jours observés (1er janvier → aujourd'hui, bornes incluses) ; le carnet à venir n'y entre
> pas. Sur un exercice futur (`?year=2027`), rien n'est « réalisé ». `ecartDeCollecte` est
> ré-exporté par `lib/taxe-sejour.ts` mais **utilisé nulle part** ici.
> Historique et mesures : docs/journal.md § Dashboard Fiscalité LMNP / LMP.

### Contexte utilisateur (fiscalité 2026)

- **Régime** : LMNP au **réel simplifié** (pas de TVA — art. 293B CGI).
- **Tenue comptable / déclaration** : **LMNP.ai** (plateforme en autonomie, liasse 2031 en EDI) — SIREN 535 071 757. Plus d'expert-comptable en cabinet (ex-SAS CONTALIM, dossier clos) → la conformité (échéances, formalités, facturation électronique) est à la charge de l'exploitant.
- **Adresse activité** : à transférer du 23 Allée des Dahlias, 92320 Châtillon (bien vendu) vers 42 rue Henri Barbusse, 72100 Le Mans (bien actif). Via formalites.entreprises.gouv.fr.
- **RP** : Châtillon 92320 (≠ adresse de l'activité).
- **Foyer** : couple marié + 2 enfants = **3 parts fiscales**. TMI 2026 estimée **30 %** (bascule depuis 11 % en 2024).
- **Biens 2026** :
  - `barbusse` (Beds24, mis en service 26/11/2025, première année pleine 2026) : propertyIds [303771, 310268]
  - `dahlias` (manuel, vendu début 2026, CA janvier 1 344,35 €)
- **Premier dépassement du seuil 23 k€** en 2026 → affiliation SSI obligatoire (art. L611-1 CSS).

### Règles fiscales codées

| Règle | Valeur | Source |
|---|---|---|
| Seuil affiliation SSI (meublé tourisme) | 23 000 € recettes annuelles | Art. L611-1 CSS |
| Test LMP | recettes > 23 k€ **ET** recettes > autres revenus d'activité foyer | Art. 155-IV CGI |
| Amortissement LMNP non pro | plafonné au bénéfice avant amort. ; excédent = ARD imputables sans limite de durée sur bénéfices futurs | Art. 39 C CGI |
| Prélèvements sociaux LMNP | 17,2 % sur résultat BIC positif | CGI |
| Cotisations SSI LMP | ~40 % effectif (remplace PS) | Barème SSI 2026 |
| Barème IR 2025 (imposé 2026) | 0/11/30/41/45 % seuils 11 497 / 29 315 / 83 823 / 180 294 | Art. 197 CGI |
| Quotient familial | Plafonné 1 791 €/demi-part | Art. 197-I-2 CGI |
| CFE meublé tourisme classé | Exonération art. 1459-3° CGI, **sauf délibération contraire** | Non vérifié pour Le Mans Métropole — contacter le SIE |

### Extraction du CA brut

Le CA à déclarer en LMNP est le **brut** (avant commissions). Il vient de `Booking.gross`
(`toBooking`), et non d'une reconstitution depuis les `invoiceItems`, qui rendait un net pour
Airbnb (historique : docs/journal.md § Dashboard Fiscalité LMNP / LMP).

**Commissions projetées** : `taux = commissionsRealized / caRealized` (YTD) × projectedCA. Naturellement pondéré par le mix direct / OTA.

### Configuration par année (`data/fiscal/YYYY.json`)

Champs : `annee` ; `biens[]` — `id`, `nom`, `source` (`beds24` | `manuel`), `propertyIds`
(`[303771, 310268]` pour Barbusse), `classeMeubleTourisme`, `amortissementAnnuel`,
`amortissementsReportes` (stock d'ARD en début d'exercice), `chargesDeductibles` (intérêts,
taxe foncière, assurance, CFE, frais comptables, entretien, copro, `autres` — **jamais les
commissions**, calculées automatiquement depuis Beds24), et pour un bien manuel `caHT` /
`vendu` ; `constantes` — `seuilSSIMeubleTourisme`, `tauxPrelevementsSociaux`, `tauxSSIEstime`.
Exemple commenté : docs/journal.md § Dashboard Fiscalité LMNP / LMP.

### UI (`app/(dashboard)/dashboard/fiscal/page.tsx`)

1. **SummaryCards** — 5 KPI : Recettes, Résultat BIC, IR supp, PS/SSI, Impôt total
2. **AmortissementsReportesCard** — chaîne visuelle : Stock entrée → Amort année → ARD imputés → Stock sortie
3. **StatusLMNPvsLMP** — 2 jauges (seuil 23k€ + recettes vs autres revenus)
4. **OrientationsAlerts** — alertes triées par criticité (critical/warning/info) avec actions + liens externes
5. **SimulateurWhatIf** — sliders CA / charges / amortissement avec recalcul temps réel (inclut ARD)
6. **DetailParBien** — tableau : CA, charges manuelles, commissions (% CA), amort déduit, ARD imputés, résultat BIC
7. **TimelineEcheances** — CFE 15/12, 2031-SD mai, DSI URSSAF juin (LMP), acomptes PS (LMNP)

### Données clés du dossier fiscal 2025 (référence)

- Résultat fiscal 2025 : +3 511 € (bénéfice BIC après amortissements plafonnés)
- Amortissement 2025 : 12 168 € (écarté car plafonné au bénéfice avant amort)
- **Stock ARD fin 2025 : 38 007 €** (cumul amortissements non déduits 2023-2025)
- Emprunt CE : 403 872 € au 31/12/2025, intérêts 4 383 €
- Base amortissable Le Mans pleine année (2026) : ~25 800 € (construction 5 % + travaux 10 % + mobilier 20 %)

### Restrictions

- `/dashboard/fiscal/**` et `/api/dashboard/fiscal/**` : `proxy.ts` bloque viewer.
- Le moteur lit l'année demandée (`?year=`, défaut : année en cours), à condition que `data/fiscal/{année}.json` existe — seul `2026.json` existe aujourd'hui.
- Le barème IR coded est celui 2025 (revenus 2025 imposés 2026). À mettre à jour au moment du PLF 2026 définitif.

## Cron Jobs (via cron-job.org)

| Job | URL | Fréquence |
|-----|-----|-----------|
| Automation chauffage | `/api/cron/heating-automation` | `*/15 * * * *` |
| Reset chauffage | `/api/cron/heating-reset` | `0 */4 * * *` |
| Health chauffage | `/api/cron/heating-health` | `*/30 * * * *` |
| Automation ECS | `/api/cron/water-heater-automation` | `0 * * * *` |
| Health ECS | `/api/cron/water-heater-health` | `0 */2 * * *` |
| Notifications check-in | `/api/cron/checkin-notifications` | `*/10 * * * *` |
| Synchro serrure Nuki | `/api/cron/nuki-sync` | `0 * * * *` |
| Keepalive Beds24 | `/api/cron/beds24-keepalive` | `0 4 * * 1` |
| Veille événements | `/api/cron/events-watch` | `0 8 * * 1` |

Authentifiés via header `Authorization: Bearer {CRON_SECRET}`.

Le reset vérifie après application que les devices ont bien pris les changements (températures). Si échec → alerte ntfy.

Crons **Vercel** (déclarés dans `vercel.json`, une fois par jour au plus sur le plan Hobby) : `heating-automation` 7 h et `heating-health` 8 h (en doublon de cron-job.org), `pricing-snapshot` 5 h, `pricing-report` lundi 6 h, `beds24-backup` dimanche 3 h (UTC).

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
- **Anti-doublon** : Redis `checkin:notified:{bookingId}` (TTL 60 jours) — une seule notif par résa, même si le code est retapé.
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
                            # /bookings/messages refuse tout jeton sans la variante -personal.
                            # Les quatre sont des refresh tokens — plus aucun long life depuis le 2026-09-11.
                            # Obtenus via un invite code (Settings → API → Invites) échangé par
                            # scripts/beds24-setup.mjs, soit GET /authentication/setup.
                            # JAMAIS /authentication/token : il consomme le code sans montrer le token.
HEATZY_EMAIL             # Email du compte Heatzy
HEATZY_PASSWORD          # Mot de passe du compte Heatzy
CRON_SECRET              # Secret pour les cron jobs
KV_REST_API_URL          # Upstash Redis (chauffage, crons, factures, pricing, Nuki, déliements)
KV_REST_API_TOKEN        # Noms de l'intégration Vercel, pas les UPSTASH_* de la console
HISTORIQUE_BARBUSSE      # Archive 310268 : JSON gzippé + base64, sans infoItems (voir « Historique archivé »)
NUKI_API_TOKEN           # Nuki Web
NUKI_SMARTLOCK_ID        # Id de la serrure (toujours viser l'id, jamais le nom)
NUKI_SYNC_MODE           # "live" pour écrire ; toute autre valeur = à blanc
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
