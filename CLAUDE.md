# Coliving Barbusse

Site vitrine + dashboard privé pour un coliving au Mans (Airbnb, Booking, Abritel).

## Stack

- **Framework** : Next.js 16.1.6 (App Router, React 19, TypeScript)
- **Styling** : Tailwind CSS v4
- **Auth** : JWT via `jose` (HS256, cookie httpOnly, 90 jours) — mécanique dans `@sejour/socle`
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
    guide-arrivee/    # Guide voyageurs noindex (accès, Wi-Fi QR, chauffage, café, lits d'appoint, checkout)
    seminaires/
    # /fr/reservation supprimée (avril 2026) → redirect 301 vers /fr via proxy.ts (5 locales).
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
      bookings/[id]/notes/      # POST notes internes (admin only) → Beds24
      bookings/[id]/nuki-code/  # GET code serrure (admin only) ← infoItems NUKI_PIN
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
    posts.ts          # BLOG_POSTS avec locales = Record<Locale, LocalizedPost> (fr/en/it/de/es) + soldOut + nextEdition + supersededBy
    content/
      fr/             # 20 articles FR (Link hrefs préfixés /fr)
      en/             # 20 articles EN (Link hrefs préfixés /en)
      it/             # 20 articles IT (Link hrefs préfixés /it)
      de/             # 20 articles DE (Link hrefs préfixés /de)
      es/             # 20 articles ES (Link hrefs préfixés /es)
  events.ts           # LE_MANS_EVENTS (calendrier ACO 2026 + Hippodrome) + findEventForStay/findEventOnDay + shortEventLabel
  # periodes.ts, calendar-utils.ts, channel.ts, cron-auth.ts, ntfy.ts et time.ts vivent
  # désormais dans @sejour/socle — voir sa CLAUDE.md.
  i18n/               # Traductions FR/EN/IT/DE/ES (dictionaries/, context, types)
  property-info.ts    # PROPERTY_INFO (adresse, check-in/out par locale, Wi-Fi, contact, navigation links)
  auth.ts             # Configuration locale de @sejour/socle/lib/auth : rôles, préfixes
                      # de mots de passe, `guard` de route. N'importe PAS next/headers
                      # (proxy.ts tourne en edge) : les cookies sont dans le socle.
  beds24.ts           # Client API Beds24 (cache Next.js 60s : next.revalidate)
  heatzy.ts           # Client API Heatzy + logique scheduling
  email.ts            # Alertes email via Resend
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
proxy.ts              # Ex-middleware.ts (nom de Next 16). Configure createDashboardProxy
                      # du socle : redirections legacy (5 locales), cookie, bornage viewer.
vercel.json           # Config Vercel (crons quotidiens)
```

## Conventions

- **Langue de communication** : Français
- **Path alias** : `@/*` pointe vers la racine du projet
- **Images** : toujours optimisées avant commit — resize max 1920px + JPEG qualité 82 (mozjpeg). Script : `node scripts/compress-images.mjs` (traite `public/images/*` > 400 KB, convertit PNG → JPG). **À lancer systématiquement à chaque nouvel ajout de photo.** Mettre à jour les refs `.png` → `.jpg` dans le code si conversion.
- **Images externes** : Airbnb CDN (`a0.muscache.com`) configuré dans `next.config.ts`
- **Droits photo** : ne jamais committer une image sans licence claire. Les photos de presse des organisateurs (ACO, Porsche Club Motorsport France) et les previews Getty/stock sont protégées — vérifier les métadonnées XMP (`dc:rights`, `xmpRights:Marked`) avant usage. Sources sûres : Wikimedia Commons (CC BY / CC BY-SA), Unsplash, ou nos propres photos. Une licence à attribution **exige** de remplir `BlogPostMeta.imageCredit` (auteur + page source + licence) : le crédit est rendu en légende sous la photo de l'article, avec le libellé localisé `PHOTO_CREDIT_LABEL`.
- **Rôles auth** : `admin` (accès complet) et `viewer` (calendrier + chauffage lecture/contrôle).
  Mécanique dans `@sejour/socle/lib/auth` — voir sa CLAUDE.md, section « Lot 1 ».
  **Un jeton illisible vaut `viewer`, jamais `admin`** : le `catch` de `getTokenRole`
  retombait sur `"admin"`, ce qui faisait d'un jeton invalide un passe-droit.
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
- Quand on ajoute une 6ᵉ locale : étendre `Locale`, créer le dico, étendre `SUPPORTED` + `LOCALES` Header + `generateStaticParams` slug, ajouter au root redirect, créer les 20 articles de blog + traduire `BLOG_POSTS.locales` + tous les T objects + `PROPERTY_INFO.checkIn/checkOut` + middleware regex `/reservation`. Toutes les `alternates.languages` (homepage, blog index, slug, chambres, seminaires, guide-arrivee) doivent inclure la nouvelle locale. `app/sitemap.ts` a sa propre liste `locales` (5 langues + `x-default` sur le FR via le helper `languagesFor`) : l'étendre aussi, sinon les URLs de la nouvelle locale ne sont pas soumises à Google.

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

## Cloisonnement du dashboard

Trois portes, dans cet ordre. Aucune n'est suffisante seule.

| Porte | Où | Ce qu'elle fait |
|---|---|---|
| `proxy.ts` | racine | Cookie exigé sur `/dashboard` et `/api/dashboard`. **Liste blanche** des chemins ouverts à `viewer` — l'ancien middleware tenait une liste noire de quatre préfixes, et c'est ainsi que `bookings` est resté ouvert. |
| `guard` de route | `@/lib/auth` | `guard.denyNonAdmin(req)` en tête des routes sensibles : `invoices/prefill`, `bookings/[id]/notes`, `bookings/[id]/nuki-code`. |
| DTO | `@sejour/socle/lib/booking-dto` | `/api/dashboard/bookings` projette vers `BookingListItem` (15 champs) ou `AdminBookingListItem` (+`price`, `email`, `mobile`, `phone`, `country`). |

**La fuite fermée le 2026-09-11.** `/api/dashboard/bookings` n'avait aucun contrôle de rôle et
renvoyait l'objet Beds24 intégral. Mesuré en `viewer` sur
`?arrivalFrom=2025-01-01&arrivalTo=2026-06-30` : **73 clés et 37 `NUKI_PIN` avant, 15 clés et
0 après**. Les 37 PIN venaient de `data/bookings-archive.json` — 37 de ses 42 lignes en
portent un — et **pas** de l'API : Beds24 ne renvoie `infoItems` que si on les demande.

**Deux corrections, pas une.**

1. À la source : `getBookings()` dépouille les réservations archivées de leurs `infoItems` et
   `invoiceItems` quand l'appelant ne les a pas demandés — symétrie avec l'API, où ce qu'on
   n'a pas demandé n'est pas là.
2. À la sortie : le DTO en liste blanche, qui protège aussi des champs que Beds24 ajoutera.

⚠️ **`includeInfoItems: true` reste légitime à trois endroits** : `getBookingById` (donc
`nuki-code` et `invoices/prefill`, toutes deux admin-only), `findBookingByStripeIds` (matching
`STRIPEPAYMENT`), et le cron `checkin-notifications`, dont c'est la raison d'être — il lit le
code `CHECKIN`. Ce cron est derrière `CRON_SECRET` et n'envoie que vers ntfy.

## Beds24 API (v2)

**Trois tokens depuis le 2026-09-11 — un par chemin, pas par verbe.** Rotation complète après
la découverte de quatre secrets en clair dans `.claude/settings.json`.

| Variable | `deviceName` | Scopes | Chemin servi |
|---|---|---|---|
| `BEDS24_PUBLIC_REFRESH_TOKEN` | `coliving-barbusse-public-2026-09` | `read:inventory`, `read:properties` | `/api/availability`, vitrine |
| `BEDS24_READ_REFRESH_TOKEN` | `coliving-barbusse-lecture-2026-09b` | + `read:bookings`, `read:bookings-personal`, `read:bookings-financial` | dashboard, factures, fiscal |
| `BEDS24_REFRESH_TOKEN` | `coliving-barbusse-ecriture-2026-09` | `read:bookings`, `write:bookings` | consignes de ménage |

Vérifiés contre l'API, pas supposés : le public reçoit `401` sur `/bookings`, la lecture ne
peut pas écrire, l'écriture ne voit ni `price`, ni `commission`, ni `invoiceItems`.

**Pourquoi la page publique a le sien.** `/api/availability` est le point d'entrée le plus
exposé du site, et il ne consulte que l'inventaire. Le servir avec le jeton du dashboard
revenait à poser `read:bookings-personal` et `read:bookings-financial` là où arrive un visiteur
anonyme. Sur 401, le repli va vers le jeton de **lecture** — jamais vers l'écriture.

**Plus aucun long life token.** `BEDS24_API_TOKEN` a été retiré le 2026-09-11. Un long life ne
porte que des scopes read (limitation plateforme), ce qui force de toute façon un second jeton
pour l'écriture ; et sa durée de vie ne se laisse pas établir — celui d'avant, créé le 24/04,
affichait encore 90 jours restants 140 jours plus tard, alors que la documentation annonce
90 jours fermes. Un refresh token meurt après 30 jours sans usage, mais l'échéance glisse à
chaque échange, et le cron keepalive entretient les trois plutôt que de parier sur le trafic.

⚠️ **`vercel env add --force` ne remplace pas toujours une variable `Secret` existante**, et
échoue en silence si l'on masque sa sortie. Pour une rotation : `vercel env rm` puis
`vercel env add`. L'âge affiché par `vercel env ls` est la date de **création**, pas de mise à
jour — il ne prouve rien. La seule vérification qui tranche est le keepalive, qui échange
réellement chaque jeton et nomme celui qui échoue.

**Le refresh token s'obtient ainsi :**
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
- **Événements Le Mans** : un **libellé coloré souligné d'un filet de 3 px** (`EVENT_LINE` / `EVENT_TEXT`), au-dessus des barres de réservation (une seule fois par event, même sur plusieurs jours). Label court via `shortEventLabel`, nom complet en tooltip. Plusieurs events qui overlappent → lanes séparés.
  - **Un événement n'est pas une réservation, et ne se dessine pas comme elle.** Les deux étaient des pilules pleines à texte blanc, de hauteurs voisines (20 px contre 24), et l'indigo saturé pesait autant que le `#003580` de Booking juste en dessous. Pas d'aplat, texte coloré, trait fin : trois différences cumulées valent mieux qu'un écart de teinte, la lecture tenant alors aussi en niveaux de gris et pour un daltonien.
  - Le filet remplace l'arrondi comme signal de continuation : il **se retire de 3 px du côté où l'événement s'arrête vraiment** et file jusqu'au bord de la semaine quand il continue. C'est aussi ce qui sépare deux événements qui s'enchaînent (« Classic » puis « 24h Rollers » début juillet).
  - **Pas de demi-cellules pour un événement**, contrairement aux réservations : un événement occupe des journées entières, là où une résa libère la maison le matin de son départ. Un événement d'un seul jour — « Marathon », une réunion hippique — se réduirait d'ailleurs à rien si on lui retirait une demi-case de chaque côté.
- **Barres de réservation** : couleur par canal (admin), demi-cellules pour checkout/check-in → permet aux résas back-to-back (même jour) de partager une ligne
- **Vacances scolaires et fêtes** : une rangée de filets **au-dessus des événements**. L'ordre se lit du plus large au plus précis en descendant — les bandes durent des semaines, les événements des jours, les séjours des nuits.
  - **Trois couleurs, et la zone B à part** : ambre pour les vacances de la **zone B (Le Mans)**, émeraude pour les zones A / C, rose pour les fêtes. C'est l'information utile au **ménage** : quand les écoles du Mans ferment, la personne qui vient nettoyer a ses propres enfants à la maison. Les vacances des deux autres zones remplissent le logement sans rien changer à sa disponibilité ; celles de la zone B, si. Les fêtes gardent le rose sans se poser la question — Noël et le Jour de l'An concernent les trois zones.
  - **Le test de zone lit `band.zones`, jamais `band.sources`.** Après l'absorption d'un week-end de bascule, `sources` contient la zone *sortante*, absente du libellé. Cas réel : février 2025, « Hiver A+C » a la zone B dans ses `sources` — lire `sources` aurait peint la bande en ambre et annoncé au ménage des vacances du Mans qui n'existaient pas.
  - **Pas de placement en lanes** : `bandesPeriodes` ne produit jamais deux bandes qui se chevauchent, une seule ligne suffit. C'est l'inverse des événements du circuit, qui peuvent être simultanés (« Le Mans Classic » et « 24h Rollers » début juillet) et réclament des lanes.
  - **Demi-cellules, comme les séjours** — et contrairement aux événements : une composition de zones prend effet à la moitié de son premier jour et cesse à la moitié du jour où elle change, d'où une fin portée au *lendemain* du dernier jour de la composition.
  - **L'émeraude est une divergence assumée avec Albiez**, où les vacances sont en indigo. Ici l'indigo est déjà la couleur du badge « Événement » dans les stats et la popup : la convention dépasse le calendrier, c'est aux vacances de céder. Les fêtes gardent le rose des deux tableaux de bord.
- **Filets de colonnes** : une couche hors flux (`absolute inset-0 grid grid-cols-7`) et non des bordures de cases. Une case ne couvre que la ligne des numéros : le trait s'arrêtait avant les barres et on ne pouvait pas aligner la fin d'un séjour sur son jour. Ce ne peut pas être des éléments de grille étendus sur `grid-row: 1 / -1` — le placement automatique refuse les cellules occupées et repousserait les sept cases en deuxième ligne. Placée *avant* les barres dans le DOM, la couche passe au-dessus des fonds de cases et en dessous des séjours, donc ne coupe aucune pilule. Hiérarchie : `gray-300` pour l'en-tête des jours, `gray-200` pour la grille.
- **Légende** : l'entrée « Événement circuit » s'affiche quel que soit le rôle. Les filets sont apparus dans la grille, ils doivent être nommés même en vue viewer, où les couleurs de canal sont masquées.
- **Réservations non confirmées** (`UNCONFIRMED_STATUSES` = `new`, `request`, `inquiry`) : **absentes de la vue viewer**, et en **ardoise rayée** (`#94a3b8` + hachures 45°) avec un marqueur `?` en vue admin, au lieu de la couleur du canal. Le planning du ménage doit dire les nuits vendues, pas les nuits peut-être vendues — quelqu'un qui se déplace pour une réservation qui n'a jamais existé s'est déplacé pour rien. Les rayures parce que la couleur seule ne suffit pas : le canal « Autre » est déjà en gris et la vue viewer peint tout en `#FF385C`. La popup explique le statut quand il n'est pas `confirmed`.
  - ✅ **C'est désormais une seconde ceinture, plus le seul contrôle.** `/api/dashboard/bookings` vérifie le rôle et **retire les provisoires de la réponse** avant de l'envoyer : un viewer reçoit 50 réservations là où l'admin en reçoit 55. Le filtre du composant reste, il sert la « vue viewer » de l'admin, qui prévisualise avec des données complètes. Les constantes vivent dans `@sejour/socle/lib/booking-status`.
- **Options commerciales** (`HELD_STATUSES` = `black`) : **même sort que les non confirmées** — absentes de la vue viewer, ardoise rayée en admin — mais étiquetées **« OPTION »** au lieu de « ? ». Beds24 appelle `black` un blocage ; l'usage ici est commercial. L'option Spartner Travel du 31 mai au 14 juin 2027 est une affaire à 21 718 € sur les 24 Heures, saisie à la main pour tenir les dates pendant la négociation : ni une nuit vendue, ni une demande de renseignement.
  - Le libellé d'une barre retombe sur `company` puis `title` quand prénom et nom sont vides — c'est le cas des options saisies à la main. « Spartner Travel » vaut mieux que « · 1 voy. », ce que l'ancien libellé affichait. `title` en dernier car Beds24 y met la civilité aussi souvent que le nom de société.
  - `cancelled` n'est traité nulle part : l'API Beds24 n'en renvoie pas sur nos fenêtres. Si cela changeait, une annulée s'afficherait comme une réservation ordinaire.
- **Indicateur 📝** sur la barre quand la résa a une note interne (visible admin ET viewer)
- **Popup réservation** : dates, **heure d'arrivée** (`arrivalTime`), nuits, voyageurs, prix/canal (admin)
  - Admin : titre/société + email (mailto) + téléphone (tel) cliquables + édition inline des notes internes (Beds24)
  - Viewer : notes en lecture seule (fond ambre), reste visible le 📝, l'heure d'arrivée et les remarques voyageur
  - **Remarque voyageur** (`comments`) affichée uniquement pour le canal `Direct` (sur Airbnb/Booking/Abritel ce champ contient des métadonnées OTA inutiles : "prepaid", rate codes…)
  - Événement associé affiché en bas (badge indigo)
  - Mobile : `max-h-[calc(100vh-2rem)] overflow-y-auto` pour garder le popup dans l'écran
- **Toggle admin/viewer** : bouton prévisualiser la vue viewer (comme /heating). `isAdmin` et `showChannels` sont des **dépendances du `useMemo` des barres** : ils décident quelles réservations entrent dans la liste et de quelle couleur. Ils manquaient, et basculer en « Vue viewer » gardait donc les barres du rendu précédent — les couleurs de canal restaient affichées.

### Vacances scolaires (`@sejour/socle/lib/periodes`)

Le module et sa donnée **ont quitté ce dépôt** : ils vivent dans `@sejour/socle`, qui remplace
la copie manuelle entretenue jusqu'ici entre Albiez et Le Mans. La regénération se lance
désormais depuis le socle (`node scripts/build-vacances.mjs [année_de_début]`). Ce qui suit
décrit ce que le calendrier du dashboard en fait ici.

- **Import direct dans le composant**, comme `LE_MANS_EVENTS` — pas via l'API. Albiez, lui,
  filtre au mois côté serveur. Ici le calendrier est déjà un composant client qui embarque
  ses données d'événements ; ajouter 15 Ko de JSON à un bundle de dashboard privé ne
  justifiait pas une route et trois props de plus.

**Une seule bande à la fois.** Peindre une barre par ligne de données donnait quatre barres
empilées la semaine de Noël (« Noël », « Noël A », « Noël B », « Noël C ») pour une seule
information : tout le monde est en vacances. `bandesPeriodes` parcourt le mois jour par jour,
fusionne les zones d'une même période dans le libellé, et ne coupe que là où la composition
change — c'est ce découpage qui porte l'information, le nombre de zones en vacances mesurant
la pression sur la demande.

**`zones` n'est pas `sources`.** `zones` porte les lettres des zones qui composent le libellé
affiché ; `sources` porte les périodes pour l'infobulle, zone sortante d'une bascule absorbée
comprise. Pour savoir si une zone donnée est en vacances sur la bande telle qu'elle
s'affiche — le test de la zone B ci-dessus — c'est `zones` qu'il faut lire.

**Le week-end de bascule ne produit pas de bande.** Les vacances durent seize jours du samedi
au dimanche et les zones démarrent de sept en sept : deux zones qui se relaient se chevauchent
*toujours* exactement deux jours, le dernier week-end de l'une étant le premier de l'autre. Ce
chevauchement ne dit pas que trois zones partent ensemble, il dit que l'une rentre quand
l'autre part — et il fabriquait une bande de deux jours coincée entre les deux vraies
(« PRINTEMPS A+B+C » les 18-19 avril 2026, entre « A+B » et « B+C »). `fusionnerBascules` la
donne à la bande suivante, qui démarre au samedi de bascule. Sur 2025-2028 cela retire cinq
bandes, toutes samedi→dimanche. Le test est **étroit à dessein** — au plus deux jours, deux
voisines contiguës de même type, une composition sur-ensemble *strict* des deux — pour qu'un
« ASCENSION A+B+C » d'un seul jour, dont le ministère ne publie que la date de début
(`finNonPubliee`), y survive. Les périodes absorbées restent dans `sources` : le libellé
simplifie, l'infobulle dit toute la vérité, zone sortante comprise.

### Notes internes (ménage, infos)

- Stockées dans le champ `notes` de Beds24 (non imprimé sur factures, contrairement à `comments`).
- API : `POST /api/dashboard/bookings/[id]/notes` (admin only via JWT) → `updateBookingNotes()` dans [lib/beds24.ts](lib/beds24.ts) utilise le **refresh token** (`BEDS24_REFRESH_TOKEN`) car les long life tokens Beds24 ne supportent pas `write:bookings`.
- Le state `bookings` côté page calendrier est mis à jour via la callback `onNotesUpdated` pour éviter un refetch.

### Partage voyageur (lien du guide + code serrure)

Bloc dans la popup de réservation du calendrier — [components/dashboard/GuestShareBlock.tsx](components/dashboard/GuestShareBlock.tsx). Copie en un clic du lien du guide et d'un message prêt à envoyer dans les 5 langues, plus le code de la serrure.

- **Rendu uniquement si `isAdmin`** (prop passée par la page calendrier depuis `effectiveRole`, donc masqué aussi en « Vue viewer »).
- **Code Nuki** : Beds24 dépose le PIN 6 chiffres dans `infoItems[]` sous `code = "NUKI_PIN"` (champ `text`), environ **6 jours avant l'arrivée** seulement → prévoir l'état « Pas encore généré ». Lu via `GET /api/dashboard/bookings/[id]/nuki-code` (admin only via JWT, re-vérifié dans la route car le middleware ne bloque pas viewer sur `/api/dashboard/bookings`). Route dédiée volontairement : le calendrier charge ~19 mois de résas, hors de question d'y faire transiter les PIN. **Ne jamais logger le PIN — le dépôt est public.**
- **URL et langues** : `guideUrl()` / `guestLocaleFromCountry()` dans [lib/site.ts](lib/site.ts) ; modèles de message dans [lib/guest-messages.ts](lib/guest-messages.ts) (vouvoiement FR/DE, tutoiement IT/ES, comme le guide).
- **Presse-papier** : le dashboard est utilisé en mode « app » sur mobile, où `navigator.clipboard` peut être refusé → repli sur un champ sélectionnable, jamais d'échec silencieux.

## Événements Le Mans (`lib/events.ts`)

- `LE_MANS_EVENTS` : 20+ événements du circuit (2025-2027) : 24h Moto, MotoGP, SWS Karting, 24h du Mans, Le Mans Classic, 24h Rollers, 24h Camions, Rotax, Mini OGP, Superbike, Rallye Sarthe, 23H60, 24h Vélo, Porsche Sprint Challenge, Championnat Monde Karting KZ, Euro IAME, Marathon, Slalom ACO, TTE, Fun Cup, Hunaudières Réunions hippiques
- `findEventForStay(arrival, departure)` : retourne le nom du 1er événement qui overlap (±2 jours margin). Utilisé dans stats + calendrier popup
- `findEventOnDay(dateStr)` : retourne l'événement qui contient ce jour (sans margin). Utilisé dans calendrier
- `shortEventLabel(name)` : label court pour affichage compact (ex: "24h Mans", "MotoGP", "Classic")
- `getEventByName(name)` : retrouve un événement par son nom exact. Utilisé par les articles de blog
- `stayWindowForEvent(ev)` : fenêtre de séjour conseillée (veille du début → lendemain de la fin), au format `[checkIn, checkOut[` de Beds24

## Blog : CTA de réservation sur les articles d'événement

`components/public/EventBookingCTA.tsx` affiche un bloc de réservation en fin d'article.
Il existe parce que le contenu seul ne convertissait pas : le seul chemin vers la
réservation était un lien texte noyé dans le dernier paragraphe, puis retour sur la home,
re-scroll jusqu'au calendrier et ressaisie des dates.

- Activé par le champ `event` de `BlogPostMeta` (`posts.ts`), qui doit reprendre **le nom
  exact** d'une entrée de `LE_MANS_EVENTS`. Sans ce champ, aucun CTA n'est rendu.
- **Ne renseigner `event` que si les dates sont officielles.** MotoGP 2027 en est
  volontairement dépourvu (dates « à confirmer » côté FIM/Dorna).
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
  recensés dans `CONTENT` de `app/[locale]/blog/[slug]/page.tsx` (imports statiques)
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

## Dashboard Fiscalité LMNP / LMP (`/dashboard/fiscal`)

Estimation indicative de l'imposition (IR + PS/SSI) et du test de bascule LMP,
à partir des résas Beds24 + charges saisies + données foyer. **Ne remplace pas
la déclaration officielle** (faite via LMNP.ai pour ce dossier).

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

- `/dashboard/fiscal/**` et `/api/dashboard/fiscal/**` : `proxy.ts` bloque viewer.
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
| Keepalive Beds24 | `/api/cron/beds24-keepalive` | `0 4 * * 1` |

Authentifiés via header `Authorization: Bearer {CRON_SECRET}`.

Le reset vérifie après application que les devices ont bien pris les changements (températures). Si échec → email alerte.

### Keepalive Beds24 (refresh token)

Beds24 **invalide un refresh token qui n'a pas servi depuis 30 jours** (`401 Token not valid`).

Le cron `/api/cron/beds24-keepalive` force l'échange des **trois** refresh tokens chaque lundi
4 h, hors cache — c'est l'échange qui repousse l'échéance, pas la lecture d'un access token
encore valide gardé en mémoire. Aucun des trois ne s'entretient seul de façon fiable :

- **écriture** : ne sert qu'aux consignes de ménage, bien trop rare.
- **lecture** : le dashboard n'est ouvert que par intermittence, et le cache de 60 s des
  réponses espace encore les échanges.
- **publique** : on pourrait la croire entretenue par le trafic, mais une saison creuse ne
  prévient pas.

Les trois sont tentés même si le premier échoue — un jeton mort ne doit pas en entraîner un
second — et chaque échec déclenche un email d'alerte (`sendBeds24Alert`) nommant les scopes
exacts à régénérer pour cette voie-là.

⚠️ **Deux des trois morts seraient silencieuses.** Si le jeton public meurt, le repli vers la
lecture prend le relais : le tunnel continue de fonctionner, en ayant reperdu la séparation des
privilèges, sans que rien ne le signale à l'écran. Seul le keepalive rend cette dégradation
visible. C'est sa vraie raison d'être, plus encore que l'expiration.

**Régénérer le refresh token** (si l'alerte tombe, ou en cas de `401 Token not valid`) :

1. Beds24 > SETTINGS > ACCOUNT > ACCESS > générer un invite code avec les scopes `read:bookings` et `write:bookings` (le token de lecture actuel n'a **que** des scopes read, il ne peut pas écrire).
2. `curl -H "code: <INVITE>" -H "deviceName: coliving-dashboard" https://api.beds24.com/v2/authentication/setup`
3. Copier le champ `refreshToken` dans `BEDS24_REFRESH_TOKEN` (`.env.local` + Vercel).
4. `npx vercel --prod`

L'invite code est à usage unique et valable 24 h.

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
BEDS24_PUBLIC_REFRESH_TOKEN # Page publique : read:inventory, read:properties. Rien d'autre.
BEDS24_READ_REFRESH_TOKEN   # Dashboard, factures, fiscal : + read:bookings & -personal & -financial.
                            # Aussi utilisé par scripts/beds24-backup.mjs.
BEDS24_REFRESH_TOKEN        # Consignes de ménage : read:bookings, write:bookings. Ne voit pas l'argent.
                            # Les trois sont des refresh tokens — plus aucun long life depuis le 2026-09-11.
                            # Obtenus via un invite code (Settings → API → Invites) échangé par
                            # scripts/beds24-setup.mjs, soit GET /authentication/setup.
                            # JAMAIS /authentication/token : il consomme le code sans montrer le token.
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
