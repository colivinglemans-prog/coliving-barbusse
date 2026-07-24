# Coliving Barbusse

Site vitrine + dashboard privé pour un coliving au Mans (Airbnb, Booking, Abritel).

## Stack

- **Framework** : Next.js 16.1.6 (App Router, React 19, TypeScript)
- **Styling** : Tailwind CSS v4
- **Auth** : JWT via `jose` (HS256, cookie httpOnly, 90 jours)
- **Charts** : Recharts (dashboard)
- **PDF** : `@react-pdf/renderer` (factures LMNP, dashboard)
- **Paiements** : Stripe (lecture seule, utilisée pour générer des factures acquittées)
- **Email** : Resend (alertes chauffage)
- **i18n** : Système custom Context (FR/EN/IT/DE/ES)
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
  page.tsx            # Redirige / vers /fr /en /it /de ou /es selon Accept-Language
  [locale]/           # Site vitrine 5 langues (/fr/*, /en/*, /it/*, /de/*, /es/*)
    layout.tsx        # Wrap I18nProvider avec locale depuis params (SUPPORTED = fr/en/it/de/es)
    page.tsx          # Homepage (metadata/JSON-LD localisés, inclut ReservationCalendar)
    blog/
    chambres/         # Suites + ReservationCalendar
    guide-arrivee/    # Guide voyageurs noindex (accès, Wi-Fi QR, chauffage, checkout)
    seminaires/
    # /fr/reservation supprimée (avril 2026) → redirect 301 vers /fr via middleware (4 locales).
    # Le calendrier de dispo est sur la homepage (#disponibilite) et /chambres.
  (dashboard)/        # Dashboard privé (stats, calendrier, chauffage) — hors [locale]
  api/
    auth/             # Login, logout, me
    availability/     # Disponibilité Beds24 (public)
    dashboard/
      heating/        # GET status radiateurs, POST contrôle mode
        control/      # POST changer mode device/zone/global
        lock/         # GET/POST verrouiller/déverrouiller devices
        summer-mode/  # GET/POST toggle mode été (suspend automation, all stop)
      stats/          # Statistiques revenus
      bookings/       # Réservations Beds24
      calendar/       # Calendrier disponibilité
      properties/     # Propriétés Beds24
      invoices/       # Factures PDF (Beds24 + Stripe)
        prefill/          # GET ?bookingId=… OU ?stripeId=… → payload pré-rempli
        generate/         # POST payload édité → PDF téléchargé
        stripe-payments/  # GET liste des derniers paiements Stripe réussis
      taxe-sejour/    # Taxe de séjour (Le Mans Métropole, trimestres + canaux)
      fiscal/         # Estimation IR + PS/SSI + test LMP
      bookings/[id]/notes/  # POST notes internes (admin only) → Beds24
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
  blog/
    posts.ts          # BLOG_POSTS avec locales = Record<Locale, LocalizedPost> (fr/en/it/de/es) + soldOut + nextEdition
    content/
      fr/             # 15 articles FR (Link hrefs préfixés /fr)
      en/             # 15 articles EN (Link hrefs préfixés /en)
      it/             # 15 articles IT (Link hrefs préfixés /it)
      de/             # 15 articles DE (Link hrefs préfixés /de)
      es/             # 15 articles ES (Link hrefs préfixés /es)
  events.ts           # LE_MANS_EVENTS (calendrier ACO 2026 + Hippodrome) + findEventForStay/findEventOnDay + shortEventLabel
  i18n/               # Traductions FR/EN/IT/DE/ES (dictionaries/, context, types)
  property-info.ts    # PROPERTY_INFO (adresse, check-in/out par locale, Wi-Fi, contact, navigation links)
  auth.ts             # JWT (createToken, verifyToken, setAuthCookie)
  beds24.ts           # Client API Beds24 (cache 5 min)
  heatzy.ts           # Client API Heatzy + logique scheduling
  email.ts            # Alertes email via Resend
  cron-auth.ts        # Vérification CRON_SECRET pour les cron jobs
  calendar-utils.ts   # Utilitaires calendrier
  invoice-config.ts   # Config émetteur facture (INVOICE_* env vars)
  invoice-number.ts   # Numérotation séquentielle annuelle (Upstash INCR)
  invoice-payload.ts  # Type InvoicePayload, pré-remplissage Beds24/Stripe, validation
  invoice-pdf.tsx     # Template React-PDF (bannière logo, LMNP, IBAN ou "payé")
  stripe.ts           # Client Stripe (listRecentPayments, getStripePayment)
  taxe-sejour.ts      # Calcul taxe Le Mans + groupement trimestres/canaux
  fiscal/             # Moteur fiscal LMNP/LMP (dashboard Fiscalité)
    config.ts         # Types + loader JSON annuel + env vars foyer
    revenus.ts        # Agrégation CA brut Beds24 (via invoiceItems) + projection
    commissions.ts    # Extraction CA brut + commissions plateforme depuis invoiceItems
    bic.ts            # Résultat BIC : CA − charges − amort − ARD imputés
    ir.ts             # Barème IR 2025 + quotient familial plafonné
    lmp-test.ts       # Test bascule LMP (art. 155-IV CGI)
    cotisations.ts    # PS 17,2 % ou SSI ~40 % selon régime
    orientations.ts   # Alertes (seuil 23k€, LMP, classement) + échéances
  types.ts            # Types partagés (Beds24, Heatzy, Dashboard)
data/
  reviews.json        # 22 avis (21 Airbnb + 1 Abritel/Vrbo). Champs: text + hostReply optionnel + sourceLang + translations/hostReplyTranslations pré-générées par DeepL
  heatzy-zones.json   # Config zones radiateurs + mapping Beds24
  fiscal/
    2026.json         # Config annuelle : biens (Barbusse + Dahlias vendu), amortissements, ARD, charges
public/images/
  house/              # 12 photos de la maison
  rooms/              # 9 dossiers chambre (chambre-1 à chambre-9)
middleware.ts         # Auth JWT + 301 redirects anciennes URLs vers /fr/*
vercel.json           # Config Vercel (crons quotidiens)
```

## Conventions

- **Langue de communication** : Français
- **Path alias** : `@/*` pointe vers la racine du projet
- **Images** : toujours optimisées avant commit — resize max 1920px + JPEG qualité 82 (mozjpeg). Script : `node scripts/compress-images.mjs` (traite `public/images/*` > 400 KB, convertit PNG → JPG). **À lancer systématiquement à chaque nouvel ajout de photo.** Mettre à jour les refs `.png` → `.jpg` dans le code si conversion.
- **Images externes** : Airbnb CDN (`a0.muscache.com`) configuré dans `next.config.ts`
- **Rôles auth** : `admin` (accès complet) et `viewer` (calendrier + chauffage lecture/contrôle)
- **Photos** : triées par ordre alphabétique des noms de fichiers
- **Capacité** : **20 personnes** (9 chambres doubles ; chambres 8 et 9 avec clic-clac 1 place en plus). Source : `PROPERTY_INFO.maxGuests` + clé i18n `sleeping.doubleBedSofa` (rendue pour les chambres d'index ≥ 7 dans `SleepingArrangement`).
- **Zoom photo** : composant partagé [components/public/Lightbox.tsx](components/public/Lightbox.tsx) (plein écran, clavier ←/→/Échap, swipe tactile, scroll lock). Utilisé par SleepingArrangement (par chambre), CommonSpaces, Garden. La galerie d'accueil PhotoGallery garde sa propre implémentation historique.
- **Commits** : penser à commit/push régulièrement
- **Deploy** : `npx vercel --prod` (auto-deploy GitHub cassé)

## i18n (5 langues : fr / en / it / de / es)

- `Locale` type : `"fr" | "en" | "it" | "de" | "es"` ([lib/i18n/types.ts](lib/i18n/types.ts))
- Dictionnaires dans `lib/i18n/dictionaries/{fr,en,it,de,es}.ts` — structure typée par `Dictionary`. Toute nouvelle clé doit être ajoutée aux 5 dicos.
- Layout `app/[locale]/layout.tsx` valide la locale contre `SUPPORTED = ["fr", "en", "it", "de", "es"]`.
- Root `app/page.tsx` redirige `/` vers la locale détectée via `Accept-Language` (fallback `fr`).
- Header (`components/Header.tsx`) : dropdown 5 langues + swap pathname `/{old}/...` → `/{new}/...`.
- Blog : `BLOG_POSTS.locales` typé `Record<Locale, LocalizedPost>` — chaque post doit avoir les 5 metadata. Le composant article est résolu via `CONTENT[slug][locale]` dans `app/[locale]/blog/[slug]/page.tsx`.
- Pages avec T object local (seminaires, guide-arrivee, chambres) : maintenir les 5 entrées dans le `Record<Locale, ...>`.
- **Liens vers Beds24** : l'URL `booking2.php` doit porter `&lang=${locale}` pour que la page de paiement ET les Auto Actions soient dans la bonne langue. Les codes `Locale` (fr/en/it/de/es) sont déjà au format ISO 639-1 attendu par Beds24, pas de mapping nécessaire. Voir [components/public/ReservationCalendar.tsx](components/public/ReservationCalendar.tsx). Prérequis Beds24 : langues activées sur la booking page (Settings → Properties → Booking Page → Languages).
- Quand on ajoute une 6ᵉ locale : étendre `Locale`, créer le dico, étendre `SUPPORTED` + `LOCALES` Header + `generateStaticParams` slug, ajouter au root redirect, créer les 15 articles de blog + traduire `BLOG_POSTS.locales` + tous les T objects + `PROPERTY_INFO.checkIn/checkOut` + middleware regex `/reservation`. Toutes les `alternates.languages` (homepage, blog index, slug, chambres, seminaires, guide-arrivee) doivent inclure la nouvelle locale.

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

**Côté site** : badge « −7% en réservation directe » dans
[ReservationCalendar.tsx](components/public/ReservationCalendar.tsx) (clé i18n `calendar.directDiscount`,
5 langues). **Détail complet (plan + config Beds24 + résultats vérifiés)** : [docs/refonte-pricing.md](docs/refonte-pricing.md).

## Beds24 API (v2)

Deux tokens coexistent, selon le besoin en écriture :

**`BEDS24_API_TOKEN`** — Long life token (read-only, ~91 jours)
- Les long life tokens Beds24 ne supportent **que les scopes read** (limitation plateforme).
- Généré via *Beds24 → Settings → Account → API → Long life token* avec les scopes :
  - `read:bookings`, `read:bookings-personal`, `read:bookings-financial`
  - `read:inventory` (requis pour `/inventory/rooms/availability` — calendrier public, dispo)
  - `read:properties` (requis pour `/properties`)
- Utilisé directement dans le header `token:` par `beds24Fetch()` ([lib/beds24.ts](lib/beds24.ts)).

**`BEDS24_REFRESH_TOKEN`** — Refresh token (utilisé uniquement pour les writes)
- Obtenu via un *Invite code* (à usage unique, ~20 min de validité) avec scopes read + `write:bookings`.
- Échange invite code → refresh token via `scripts/beds24-setup.mjs <INVITE_CODE>` OU via curl direct :
  ```bash
  curl -H 'code: <INVITE_CODE>' -H 'deviceName: coliving-barbusse' \
    https://api.beds24.com/v2/authentication/setup
  ```
- À chaque write, `getBeds24WriteToken()` échange le refresh token contre un access token (24h, caché en mémoire) via `/authentication/token`.
- Utilisé uniquement par `updateBookingNotes()` (édition notes internes Beds24 depuis le dashboard).

**Vérifier les scopes d'un token** :
```bash
curl -H 'token: <TOKEN>' https://api.beds24.com/v2/authentication/details
```

**Vercel** : les deux tokens doivent être configurés sur Production + Development (Preview est bloqué par le wrapper plugin Vercel — non critique vu le workflow `vercel --prod` direct).

### Historique archivé (propriété "à la chambre" supprimée)

La propriété **310268** ("Coliving Henri Barbusse", location à la chambre) a été supprimée du compte
Beds24 (coût d'abonnement) — l'activité est désormais **maison entière uniquement** (303771). Ses
réservations n'existent donc plus dans l'API. On les conserve pour les dashboards + le moteur fiscal via
un merge transparent :

- **Sauvegarde** : `scripts/beds24-backup.mjs` aspire tout le compte par API et écrit deux fichiers :
  - `data/beds24-raw-backup.json` — dump brut intégral (disaster recovery, **non lu au runtime**).
  - `data/bookings-archive.json` — sous-ensemble `propertyId ∈ ARCHIVED_PROPERTY_IDS` (310268),
    **lu au runtime**. Lancer : `node --env-file=.env.local scripts/beds24-backup.mjs`.
- **Merge** : [lib/bookings-archive.ts](lib/bookings-archive.ts) (`getArchivedBookings()`, `ARCHIVED_PROPERTY_IDS`)
  est appelé par `getBookings()` ([lib/beds24.ts](lib/beds24.ts)) : dédup par `id`, **le live gagne**, on
  n'injecte que les résas archivées absentes du live et matchant les mêmes filtres (dates + statuts).
  Tant que la propriété existe, ses résas live écrasent les archivées (zéro doublon) ; une fois supprimée,
  l'archive prend le relais **sans changement de code**. Tous les consommateurs en héritent (stats classe
  310268 en `type:"room"`, fiscal garde `310268` dans `propertyIds` de `data/fiscal/2026.json`).
- Endpoints d'inventaire (`getAvailability`/`getDailyPrices`/`getMinStay`) et `updateBookingNotes` ne
  concernent pas l'archive (historique en lecture seule).
- **Ré-exécuter le backup** si de nouvelles résas 310268 apparaissent avant la suppression définitive.

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

## Dashboard stats (`/dashboard`)

- **Statuts exclus** : la route stats filtre `cancelled`/`black` (`EXCLUDED_STATUSES`, cohérent avec `lib/bookings.ts` / `lib/fiscal`). Sans ça, les blocages propriétaire à 0 € et annulations faussaient revenus, TJM et occupation.
- **StatsCards** (9 cartes, indicateurs standard du secteur). Les métriques par nuitée sont affichées **maison entière uniquement** (`SplitMetric.house`) ; l'API calcule toujours `global`/`house`/`room` (utilisés ailleurs, ex. tri `topBookings`).
  - **Revenus totaux** = CA brut (Σ `b.price`).
  - **Occupation moyenne** = taux calendaire **réalisé (YTD)** : nuits vendues ÷ nuits disponibles sur la partie *écoulée* de la période (`[from, min(to, today)]`, 9 chambres × jours). Corrige l'ancien biais qui excluait du dénominateur les mois sans réservation (taux gonflé) sans pour autant compter les mois futurs invendus. Helper `occupiedRoomNightsInWindow`.
  - **TJM** = revenu ÷ nuits *vendues* (prix moyen d'une nuit occupée).
  - **RevPAR** = TJM × taux d'occupation = revenu ÷ nuits *disponibles* (intègre les nuits vides, toujours ≤ TJM).
  - **Résas directes** = % des résas en direct (0 commission) ; sous-titre = part du CA correspondante.
  - **Occ. 90 j (à venir)** = occupancy on the books : occupation des 90 prochains jours déjà réservée. **Fetch dédié** `[today-30, today+90]` indépendant de la période sélectionnée, exclut `cancelled`/`black`.
- **RevenueProjection annuelle** :
  - Bloc "garanti" : réalisé + confirmé = total, avec barre progress
  - 3 scénarios : Minimum garanti / Tendance actuelle (TJM moyen) / Pricing dynamique (prix BeyondPricing × taux occupation)
  - Pricing dynamique via `getDailyPrices` (Beds24 `/inventory/rooms/calendar?includePrices`)
- **RevenueChart** : Recharts `ComposedChart` par mois — barres réalisé/prévu (axe gauche) + **ligne RevPAR mensuel** (axe droit violet). RevPAR mensuel = (réalisé + réservé) ÷ jours du mois (`MonthRevenue.revpar`).
- **BookingsTable** (2 tableaux) :
  - Réservations récentes : triées par **date de réservation** (bookingTime) avec colonne "Réservée"
  - Meilleures réservations (TJM) : triées par TJM avec colonne **Événement** (badge indigo via `findEventForStay`)
  - Colonne "Type" supprimée (toujours maison)
- **ChannelPieChart** : revenus par canal (Airbnb, Booking, Abritel, Direct)
- **OccupancyGauge** : jauge circulaire de taux d'occupation

## Dashboard calendrier (`/dashboard/calendar`)

- **Grille mois** avec navigation prev/next, jour férié marqué, aujourd'hui en rose
- **Événements Le Mans** : affichés en **barres continues indigo** au-dessus des barres de réservation (une seule fois par event, même sur plusieurs jours). Label court via `shortEventLabel`, nom complet en tooltip. Plusieurs events qui overlappent → lanes séparés.
- **Barres de réservation** : couleur par canal (admin), demi-cellules pour checkout/check-in → permet aux résas back-to-back (même jour) de partager une ligne
- **Indicateur 📝** sur la barre quand la résa a une note interne (visible admin ET viewer)
- **Popup réservation** : dates, **heure d'arrivée** (`arrivalTime`), nuits, voyageurs, prix/canal (admin)
  - Admin : titre/société + email (mailto) + téléphone (tel) cliquables + édition inline des notes internes (Beds24)
  - Viewer : notes en lecture seule (fond ambre), reste visible le 📝, l'heure d'arrivée et les remarques voyageur
  - **Remarque voyageur** (`comments`) affichée uniquement pour le canal `Direct` (sur Airbnb/Booking/Abritel ce champ contient des métadonnées OTA inutiles : "prepaid", rate codes…)
  - Événement associé affiché en bas (badge indigo)
  - Mobile : `max-h-[calc(100vh-2rem)] overflow-y-auto` pour garder le popup dans l'écran
- **Toggle admin/viewer** : bouton prévisualiser la vue viewer (comme /heating)

### Notes internes (ménage, infos)

- Stockées dans le champ `notes` de Beds24 (non imprimé sur factures, contrairement à `comments`).
- API : `POST /api/dashboard/bookings/[id]/notes` (admin only via JWT) → `updateBookingNotes()` dans [lib/beds24.ts](lib/beds24.ts) utilise le **refresh token** (`BEDS24_REFRESH_TOKEN`) car les long life tokens Beds24 ne supportent pas `write:bookings`.
- Le state `bookings` côté page calendrier est mis à jour via la callback `onNotesUpdated` pour éviter un refetch.

## Événements Le Mans (`lib/events.ts`)

- `LE_MANS_EVENTS` : 20+ événements du circuit (2025-2027) : 24h Moto, MotoGP, SWS Karting, 24h du Mans, Le Mans Classic, 24h Rollers, 24h Camions, Rotax, Mini OGP, Superbike, Rallye Sarthe, 23H60, 24h Vélo, Porsche/F4, Championnat Monde Karting KZ, Euro IAME, Marathon, Slalom ACO, TTE, Fun Cup, Hunaudières Réunions hippiques
- `findEventForStay(arrival, departure)` : retourne le nom du 1er événement qui overlap (±2 jours margin). Utilisé dans stats + calendrier popup
- `findEventOnDay(dateStr)` : retourne l'événement qui contient ce jour (sans margin). Utilisé dans calendrier
- `shortEventLabel(name)` : label court pour affichage compact (ex: "24h Mans", "MotoGP", "Classic")

## Blog sold-out

- Flag manuel `soldOut: true` dans `posts.ts` par article
- Si soldOut : grayscale image + badge "Complet" + trié en bas de liste + bandeau article "Rendez-vous pour l'édition {nextEdition}"
- Pas d'auto-détection Beds24 (Turbopack avait des issues de compilation)

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

- Vercel tourne en **UTC** → toute la logique horaire utilise `lib/time.ts` (Europe/Paris)
- Fonctions : `currentHourParis()`, `todayParis()`, `tomorrowParis()`, `nowParis()`
- **Ne jamais utiliser** `new Date().getHours()` ou `toISOString().split("T")[0]` directement

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

**Cron de santé** `water-heater-health` (toutes les 2h) : alerte email si dérive mode/consigne/boost, ballon hors ligne, ou sous-chauffe (`bottomTemp < consigne - 8°C` avec occupation).

## Factures PDF (LMNP)

Émet une facture PDF pour un paiement (virement attendu **ou** paiement Stripe déjà reçu). Deux sources de pré-remplissage : **Beds24** (réservations/inquiries) et **Stripe** (paiements réussis).

### Flux (admin only)

1. Dashboard → **Factures**. Deux onglets :
   - **Beds24** : liste des réservations/inquiries avec filtres (Tous / Inquiries / Direct / Airbnb / Booking / Abritel).
   - **Stripe** : derniers paiements Stripe réussis (90 jours).
2. Clic « Créer une facture » ou saisie d'un ID → page formulaire pré-rempli.
3. Champs éditables : client (company, nom, adresse, email, tél), séjour, montant, date limite (virement) ou **case « Déjà payé »** avec date + méthode + référence (Stripe).
4. Clic « Générer le PDF » → le numéro de facture est alloué (`AAAA-NNN` via Upstash `INCR invoice:counter:{year}`) et le PDF est téléchargé.

### Caractéristiques du PDF

- Bannière avec logo SVG (maison rose), « COLIVING BARBUSSE », site web, email.
- Bloc client (raison sociale si entreprise, adresse complète).
- Si le champ `title` Beds24 n'est pas une civilité (M., Mme, etc.), il est utilisé comme raison sociale.
- Mention **« TVA non applicable, art. 293B du CGI »** (LMNP).
- **Bloc paiement conditionnel** :
  - `payload.paid === false` → bloc rose « Paiement par virement » avec IBAN/BIC et n° facture comme libellé de virement. Bandeau rouge « Paiement attendu avant… ».
  - `payload.paid === true` → bloc vert « ✓ Paiement reçu » avec montant, méthode, date, référence Stripe. Bandeau vert « Merci de votre paiement ». La facture vaut reçu.
- `<View wrap={false}>` sur le bloc paiement pour éviter qu'il soit coupé entre deux pages.

### Restrictions

- `/dashboard/invoices/**` et `/api/dashboard/invoices/**` : middleware bloque viewer (redirect / 403).
- Numérotation séquentielle **continue** (obligation légale FR) : le compteur n'est incrémenté qu'à la génération réelle, pas à l'ouverture du formulaire.

## Dashboard Fiscalité LMNP / LMP (`/dashboard/fiscal`)

Estimation indicative de l'imposition (IR + PS/SSI) et du test de bascule LMP,
à partir des résas Beds24 + charges saisies + données foyer. **Ne remplace pas
le travail du comptable** (SAS CONTALIM pour ce dossier).

### Contexte utilisateur (fiscalité 2026)

- **Régime** : LMNP au **réel simplifié** (pas de TVA — art. 293B CGI).
- **Comptable** : SAS CONTALIM (Ruy-Montceau 38300) — dossier 260083, SIREN 535 071 757.
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

### Extraction CA brut depuis Beds24 (important)

Le CA à déclarer fiscalement en LMNP est le **brut** (avant déduction des commissions Airbnb/Booking). Beds24 retourne un champ `price` dont la sémantique varie (net ou brut) selon la config, donc le moteur fiscal reconstruit le CA depuis les `invoiceItems` :

- **Inclus dans le CA** : toutes les lignes positives ET négatives (remises) qui ne sont **ni taxe**, **ni commission**, **ni info**
- **Exclu du CA** :
  - Taxes de séjour / additionnelles (regex `\btax(es?)?\b` — collectées/reversées par plateforme)
  - Commissions (`Host Fee`, `commission`, `service fee`, `channel fee`, `platform fee`) — traitées séparément comme charge
  - Lignes informatives (`Expected Payout`, `Total`, `Balance`, `Grand Total`)
- **Fallback** : `b.price` si `invoiceItems` absent (résa directe ancienne sans détail)

Exemple résa Airbnb (83154502) : Base 2 550 + Linen 160 + Cleaning 350 = **3 060 € CA**, Host Fee **−569,16 € commission**, taxes 43,82 € exclues.

Exemple résa Direct (85615323) : Σ(daily rates) + Ménage 250 + Draps 140 **− Réduction RD −677,02 €** (incluse car remise commerciale non-commission, non-taxe).

**Commissions projetées** : `taux = commissionsRealized / caRealized` (YTD) × projectedCA. Naturellement pondéré par le mix direct / OTA.

### Configuration par année (`data/fiscal/YYYY.json`)

```json
{
  "annee": 2026,
  "biens": [
    {
      "id": "barbusse",
      "nom": "Coliving Barbusse",
      "source": "beds24",
      "propertyIds": [303771, 310268],
      "classeMeubleTourisme": false,
      "amortissementAnnuel": 25800,
      "amortissementsReportes": 38007,       // Stock ARD début exercice
      "chargesDeductibles": {
        "interetsEmprunt": 4400,
        "taxeFonciere": 1400,
        "assurance": 4600,                   // PNO + assurance prêt
        "cfe": 400,
        "fraisComptable": 800,
        "entretien": 2000,
        "chargesCopro": 0,
        "autres": 0                          // NE PAS y mettre les commissions (auto depuis Beds24)
      }
    },
    {
      "id": "dahlias",
      "nom": "Appartement Dahlias (vendu)",
      "source": "manuel",
      "caHT": 1344.35,
      "vendu": true,
      ...
    }
  ],
  "constantes": {
    "seuilSSIMeubleTourisme": 23000,
    "tauxPrelevementsSociaux": 0.172,
    "tauxSSIEstime": 0.40
  }
}
```

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

- `/dashboard/fiscal/**` et `/api/dashboard/fiscal/**` : middleware bloque viewer.
- Le moteur ne gère que l'année en cours + config JSON correspondante.
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

Authentifiés via header `Authorization: Bearer {CRON_SECRET}`.

Le reset vérifie après application que les devices ont bien pris les changements (températures). Si échec → email alerte.

### Notifications check-in (push ntfy.sh)

Détecte l'utilisation du code Nuki par un voyageur via la serrure connectée et envoie une notification push.

- **Détection** : Beds24 ajoute un `infoItems[]` avec `code = "CHECKIN"` quand le voyageur tape son code Nuki. L'horodatage est dans `createTime` (ISO UTC) — **le champ `text` est vide**. La date affichée dans l'UI Beds24 vient de `createTime` formatté en local.
- **Cron** : `/api/cron/checkin-notifications` toutes les 10 min, fenêtre arrivées J-3 → J+1.
- **Anti-doublon** : Redis `checkin:notified:{bookingId}` (TTL 60 jours) — une seule notif par résa, même si le code est retapé.
- **Service push** : ntfy.sh (gratuit, topic privé non-devinable). Variable `NTFY_TOPIC` = URL complète (ex `https://ntfy.sh/coliving-barbusse-xxxxx`). Subscribe au topic depuis l'app ntfy mobile.
- **Helper** : `sendNtfy(message, { title, priority, tags, click })` dans [lib/ntfy.ts](lib/ntfy.ts). Encode automatiquement le titre en RFC 2047 pour les emojis/accents (les headers ntfy doivent être ASCII).
- **Kill switch** : `CHECKIN_NOTIFICATIONS_ENABLED=false` désactive sans redéployer (le cron retourne `{ skipped: "disabled" }`).
- **Statuts ignorés** : `cancelled`, `black`.
- **Domaine canonique pour les crons externes** : `https://www.coliving-barbusse.fr/api/cron/...` (le 308 redirect de `coliving-barbusse.fr` → `www.` drop le header `Authorization` → 401).

## Variables d'environnement

```
DASHBOARD_PASSWORD       # Mot de passe admin
DASHBOARD_PASSWORD_VIEWER # Mot de passe viewer (calendrier + chauffage)
DASHBOARD_PASSWORD_VIEWER_* # Mots de passe viewer nommés, même accès (ex: DASHBOARD_PASSWORD_VIEWER_Sylvie)
DASHBOARD_SECRET         # Secret JWT (HS256)
BEDS24_API_TOKEN         # Long life token Beds24 (read-only, scopes read:bookings*)
BEDS24_REFRESH_TOKEN     # Refresh token Beds24 (long life, scope write:bookings) pour l'édition des notes.
                         # Obtenu via: invite code (Settings → API → Invites) → scripts/beds24-setup.mjs
                         # Les long life tokens ne supportent que les scopes read.
HEATZY_EMAIL             # Email du compte Heatzy
HEATZY_PASSWORD          # Mot de passe du compte Heatzy
CRON_SECRET              # Secret pour les cron jobs
RESEND_API_KEY           # Clé API Resend (emails)
ALERT_EMAIL              # Email destination des alertes chauffage
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

# Notifications push (cron check-in)
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
