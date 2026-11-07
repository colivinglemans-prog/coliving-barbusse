# Factures PDF (LMNP)

> Référence détaillée des factures (socle, flux, PDF, plateformes, taxe de séjour, acompte/solde, restrictions) — complément de [CLAUDE.md](../CLAUDE.md), qui en résume les règles critiques. À lire avant de modifier ou d'expliquer le code de ce sujet.

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
