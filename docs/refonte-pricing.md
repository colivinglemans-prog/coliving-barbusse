# Refonte du pricing multi-canal — Coliving Barbusse

## Contexte & priorité absolue

**Priorité n°1** : les voyageurs arrivent souvent via Airbnb puis cherchent le direct → **le direct doit
TOUJOURS être moins cher qu'Airbnb**, pour toute occupation et toute durée. Aujourd'hui non garanti.

Problèmes mesurés (dates 20→22 juil. 2026, 2 nuits) :

| | 9 pers | 16-20 pers |
|---|---|---|
| **Direct** | **1 485 €** (le moins cher ✓) | 18p : 1 865 / ~16p : 1 781 |
| Booking | 1 540 € | **1 540 € (figé)** |
| Abritel | 1 562 € | **1 562 € (figé)** |
| Airbnb | 1 564 € | 16+ : 1 778 € (plafonné 16) |

1. **Booking & Abritel ne facturent rien pour les pers. en plus** (9 = 20) → fuite gros groupes.
2. **Le direct n'est pas toujours le moins cher** : OK à 9p/2n, mais sur 7 nuits il passe au-dessus
   d'Airbnb (cause = remise durée non répliquée, **pas** le niveau du %).
3. **Frais incohérents entre canaux** (révélé par le décodage des prix réels, 9p/2n) :

   | Canal | Hébergement | Ménage | Linge | Total |
   |---|---|---|---|---|
   | Airbnb | 1 094 (×1,0) | **350** | 90 (10×9, fondu dans le tarif) | 1 564 |
   | Booking | **1 258 (×1,15 ✓)** | 250 | **0** | ~1 543 |
   | Abritel | 1 094 **(×1,0)** | 250 | 180 (20×9) | ~1 557 |
   | Direct | 1 094 | 250 | 180 (20×9), −5% | 1 485 |

   → Le **×1,15 Booking EST bien appliqué** (accom 1 258 = 1 094×1,15) ; Booking paraît moins cher
   qu'Airbnb juste parce qu'Airbnb facture ménage 350 + linge, Booking ménage 250 sans linge.
   **Abritel est à ×1** (accom 1 094) → à passer à ×1,15. Ménage (350 vs 250) et linge (10/20/0)
   divergent par canal.
4. **−5% direct appliqué aussi sur la taxe** (conformité) ; **taxe directe non conforme** (forfait
   2,20€ au lieu de **2,75% plafond 4,40** = barème Le Mans, déjà appliqué par Booking).

> Calé : commissions **toutes « incluses » (payées par l'hôte)** — Airbnb 15,5% · Booking 17% ·
> Abritel/VRBO 15%. Markup canal : Airbnb +0% · Booking & Abritel +15%. Prix piloté par **Beyond
> Pricing**. Direct via Stripe ≈ 0 commission. Suppl. personne au-delà de 9 : **+10€/pers/nuit linéaire**
> jusqu'à 20. Plafonds d'occupation : Airbnb **16** (seul à contraindre), Booking **30**, VRBO/Abritel
> **99**, Direct **20** → tous peuvent vendre un groupe de 20 sauf Airbnb.

---

## Correctif n°1 — remises durée (le vrai bug du « direct pas toujours moins cher »)

Toutes commissions incluses → le prix affiché = ce que paie le voyageur. Donc `direct = (1−remise) ×
Airbnb` : **le direct est moins cher dès que la remise > 0**, *à condition de répliquer les paliers
durée d'Airbnb*. Le bug vient d'un **−5% plat sans paliers** face au −10%@7j d'Airbnb.

→ **Le direct mirrore les paliers durée d'Airbnb (−10%@7j, −30%@28j)** et la **remise directe se cumule
par-dessus**. Le niveau de remise n'est qu'un **levier de conversion** :

| Remise directe | Net hôte direct | vs Airbnb (0,845) |
|---|---|---|
| 5% | 0,936 | +10,8% |
| **7% (recommandé)** | 0,916 | +8,4% |

7% (≈105€ sur 1 500€) convertit mieux les curieux venus d'Airbnb, à coût de marge négligeable.
**Net/canal** : Airbnb **0,845** (réf.) · Direct −7% **0,916** ✓ · Booking +15% **0,955** · Abritel
+15% **0,978**. Direct > Airbnb, Booking/Abritel premium.

---

## Correctif n°2 — faire scaler l'occupation sur Booking/VRBO (vérifié doc Beds24)

Beds24 envoie les prix selon **2 modes** réglables sur la connexion de chaque canal :

| Canal | Mode **« Occupancy Prices »** | Mode **« Per Day Prices »** |
|---|---|---|
| Airbnb | ✅ extra person price **will send** | ⚠️ négatif requis |
| Booking | ✅ extra person price **will send** | ⚠️ négatif requis |
| VRBO/HomeAway | ✅ occupancies **automatically calculated** | ⚠️ négatif requis |

Booking/VRBO figés = ils sont en **« Per Day Prices »**. **Solution : les basculer en « Occupancy
Prices ».** Ton réglage actuel **`Price For = up to 9` + `Extra Person = +10€`** (positif, linéaire
jusqu'à 20) se propage alors à tous les canaux. **Aucun extra-person négatif, aucune re-base de Beyond
Pricing.** Activer aussi *Daily Price Strategy → « Allow Lower Prices »*.

Sources : [Occupancy Based Prices](https://co-reception.com/wiki/index.php/Occupancy_Based_Prices),
[Setting Prices for Booking Channels](https://co-reception.com/wiki/index.php/Setting_Prices_for_Booking_Channels).

**Garder le direct ouvert à 20** (ne pas le brider à 16) : c'est ton seul canal aussi souple ; un 20 qui
ne peut pas réserver sur Airbnb (cap 16) est poussé vers le direct, le plus rentable.

---

## Grille proposée

### 1. Occupation
`Price For = up to 9` + Extra Person **+10€/pers/nuit** (linéaire jusqu'à 20), **mode Occupancy Prices
sur tous les canaux**. Airbnb s'arrête à 16 (cap plateforme) ; Booking/VRBO/Direct vont à 20.

### 2. Markup par canal (connexion canal)

| Canal | Markup | Note |
|---|---|---|
| Airbnb | +0% | base = prix Airbnb |
| **Direct** | base **−7%** (discount booking page, **hors taxe**) + paliers durée d'Airbnb | toujours le moins cher |
| **Abritel/VRBO** | **+15%** *(était +0%)* | premium |
| Booking | +15% — **✓ appliqué** (confirmé par décodage : accom ×1,15) | premium |
| HomeToGo | **+15%** | OTA à commission |

### 3. Frais — **harmonisés sur tous les canaux** (décidé), centralisés Beds24

| Frais | Valeur (ajustable au coût réel) | Avant |
|---|---|---|
| Ménage / séjour | **280 €** partout | Airbnb 350 fondu / autres 250 |
| Linge / voyageur | **15 €** partout | Airbnb 10 / direct & Abritel 20 / **Booking 0** |
| Taxe de séjour | **forfait ~2,00-2,20 €/adulte/nuit** (cf. note ⚠️) | direct 2,20 forfait ; Abritel 3% |

⚠️ **Taxe de séjour & plafond** : barème Le Mans = 2,75% (2,5%×1,10) **plafonné 4,40 €/pers/nuit**. Beds24
**ne sait pas appliquer le plafond** → ne PAS mettre 2,75% sur le direct (sur-collecte au-dessus du plafond
aux prix élevés + rend le direct plus cher qu'Airbnb qui plafonne). Garder un **forfait bas** : au prix
fort on collecte moins que le dû et on absorbe la différence (assumé, garde direct < Airbnb). Airbnb/Booking
plafonnent nativement. Le dashboard `/taxe-sejour` calcule le montant légal exact pour la déclaration.

- **Airbnb** : cesser de fondre le ménage 350 € dans le tarif/nuit → ménage explicite 280 € + linge 15.
- **Booking** : **ajouter le linge** (0 aujourd'hui) → 15 €/voyageur.
- Frais égaux partout → garantit `direct < Airbnb` **frais compris**, pas seulement sur l'hébergement.

### 4. Remises durée — **centralisées dans Beds24, poussées à tous les canaux** (vérifié)

Configurer les paliers durée comme **rates/Offers avec min-stay** (ton système Offers + colonne
Channels) en **mode Occupancy Prices** → ils se propagent à **Airbnb, Booking ET VRBO** (« prices for
different length of stay will send »). **Ne PAS utiliser l'onglet « Discounts »** (referrer/direct-only,
« not sent to the channels »).

**Airbnb accepte des paliers durée personnalisés (4 jours, etc.)**, pas seulement 7/28 → la grille peut
être **uniforme sur tous les canaux** :

| Durée | Grille (tous canaux, via Offers) | Direct |
|---|---|---|
| 4-6 nuits | −8% | + −7% par-dessus |
| 7+ nuits | −10% | + −7% |
| 28+ nuits | −30% | + −7% |

La **remise directe −7%** = **discount « referrer » direct-only** (Beds24 confirme : non envoyé aux
canaux) → s'applique uniquement en direct, par-dessus la grille → `direct = 0,93 × prix canal` à toute
durée et toute occupation. VRBO reçoit tout automatiquement (tu n'as rien à y configurer).

---

## Vérification chiffrée (base ≈ 547 €/nuit, 9 pers)

- **9 pers, 7 nuits** (cassé) : direct 547×0,9×0,93×7 = **3 205 €** < Airbnb 547×0,9×7 = 3 446 € ✓
  (aujourd'hui −5% plat : 3 637 €, *plus cher*).
- **9 pers, 3 nuits** : direct 547×0,93×3 = 1 526 +frais < Airbnb 1 641 +frais ✓ ; net direct ≫ Airbnb.
- **20 pers** : +110€/nuit (11×10) sur tous les canaux une fois en Occupancy Prices → fin de la fuite.

---

## Ce qu'il faut modifier

### A. Beds24
1. **Occupation** : passer **Booking & VRBO en mode « Occupancy Prices »** (Airbnb l'est déjà) ; garder
   `up to 9` + Extra Person +10€ ; *Daily Price Strategy = Allow Lower Prices*. **Direct ouvert à 20.**
2. **Markup** : Abritel/VRBO +0%→**+15%** ; HomeToGo →+15% ; vérifier **Booking +15%** réellement actif.
3. **Discount réservation directe** : −5% → **−7%**, type **« referrer » direct-only** (non poussé aux
   canaux), **hors ligne taxe de séjour**.
4. **Paliers durée** : configurer en **Offers/rates avec min-stay** (PAS l'onglet Discounts) en mode
   Occupancy Prices → poussés à Airbnb/Booking/VRBO. Grille uniforme 4-6n −8% / 7j −10% / 28j −30%
   (Airbnb accepte les paliers perso). Le −7% direct se cumule par-dessus.
5. **Fees** : ménage 280, linge 15/voy., identiques tous canaux (ajouter le linge sur Booking).
6. **City tax** : garder un **forfait bas** sur le direct (Beds24 ne gère pas le plafond 4,40 → un % sur-
   collecterait aux prix élevés). Idem prudence pour `CITYTAXPERCENTSTAY` VRBO/Abritel (% non plafonné).

### B. Plateformes (idéalement plus rien à y faire — tout vient de Beds24)
- **Booking** : vérifier markup +15% actif ; confirmer que la grille durée/occupation s'affiche.
- **Airbnb** : accepte les paliers durée perso (4j+) ; vérifier qu'ils s'affichent ; taxe collecte auto.
  **VRBO** : rien à configurer (tout vient de Beds24 en mode Occupancy Prices).

### C. Code (optionnel)
1. Badge **« −7% en réservation directe »** dans
   [ReservationCalendar.tsx](coliving-barbusse/components/public/ReservationCalendar.tsx) + 5 dicos
   `lib/i18n/dictionaries/`.
2. Documenter la politique dans [CLAUDE.md](coliving-barbusse/CLAUDE.md) + mémoire projet.

---

## Vérification
- **Garde-fou** : pour toute date/occupation, `prix_direct = 0,93 × prix_Airbnb` et `frais` égaux.
- **3 dates** (≈260/522/1576) × **occupations** (9/16/20) × **durées** (3/5/8 nuits) : booking page Beds24
  vs Airbnb → direct toujours le moins cher.
- **Occupancy Prices** : après bascule, devis 9 vs 20 sur Booking **et** VRBO → prix différents (+110€
  à 20). C'est le test qui valide la fin de la fuite.
- **Taxe** : résa directe test = même taxe que `computeTaxeSejour` (`/dashboard/taxe-sejour`).
- **Badge** : `npm run dev` (5 langues), `npx tsc --noEmit`, `npm run lint`.

---

## Réalisation & résultats vérifiés (juin 2026)

**Statut : refonte déployée et validée sur tous les canaux.**

### Configuration Beds24 effectuée
- **Occupation** : `Price For = up to 9` + Extra Person +10 € ; mode **Occupancy Prices** activé sur
  Booking & VRBO ; *Allow Lower Prices* actif ; `maxPeople` porté à **20**.
- **Markup** : Abritel/VRBO **+15 %** (était +0 %) ; Booking **+15 %** (confirmé via export) ; Airbnb +0 %.
- **Remise directe** : −5 % → **−7 %**, type Upsell « **obligatory %** » (hors taxe de séjour).
- **Frais** (mécanismes distincts par destination) :
  - **Direct** : ménage via Upsell « Obligatory Cleaning » **280** (le champ chambre `cleaningFee` sert à
    l'export canaux mais **ne s'affiche pas** sur la booking page) + linge via Upsell « Draps/Serviettes »
    **15/pers**.
  - **Airbnb** : Specific Content `CLEANINGFEE=280` + `LINENFEEPERSON=15` (⚠️ tarif Airbnb verrouillé/géré
    par Beds24 ; le live peut garder l'ancien 350+10 tant que la synchro n'a pas poussé — non bloquant).
  - **VRBO** : `CLEANINGFEE=280` + `SUPPLEMENTPERSON=15` (joue le rôle du linge) + `CITYTAXPERCENTSTAY=2,75`.
- **Paliers durée** : price rules min-stay **4j −8 % / 7j −10 % / 28j −30 %** créées **à la main dans l'UI**
  (la création via API v2 laissait des règles « fantômes » non fonctionnelles — erreur interne sur
  `bookingPage`). Poussées à tous les canaux via le mode Occupancy Prices.

### Résultats vérifiés (séjour 3→10 août, 7 nuits, brut 3 755 €)

| Canal | 9 pers | 16-20 pers (occ.) |
|---|---|---|
| **Direct** | **3 696,53 €** | 4 556 € (18p) |
| Airbnb | 3 911,93 € | 4 485 € (16p, cap) |
| VRBO | 4 283 € | 5 195 € (18p) |
| Booking | 4 362 € | 5 205 € (20p) |

- ✅ **Direct le moins cher** à 9 pers (Direct < Airbnb < VRBO < Booking) et **plus rentable** partout.
- ✅ **Scaling 9 ≠ 20** confirmé sur Direct, VRBO, Booking (après propagation). Airbnb plafonné à 16.
- ✅ **Paliers durée vérifiés** : direct 7 nuits = brut × 0,90 × 0,93 ; 28 nuits = brut × 0,70 × 0,93.
  Airbnb 28 nuits = **−30 %** (cumul « prix mois moyen » déjà décoté + ligne « économies » résiduelle).
- ✅ **Avant/après Airbnb** (5/9/16 pers) : écart total **±1 %** → pas de choc client.

### Points connus / non bloquants
- **Edge case 17-20 pers** : Airbnb plafonne à 16 → un groupe 17-20 ne peut réserver qu'en **direct**
  (qui devient alors un peu plus cher que l'Airbnb-affiché-16, mais c'est le seul canal possible).
  Inhérent : Beds24 ne sait pas aplatir le supplément linéaire à partir de 16.
- **Frais Airbnb** : extranet verrouillé (tarif géré par Beds24) ; le ménage/linge live peut rester sur
  l'ancien 350+10 tant que la synchro Beds24 n'a pas poussé 280+15 (écart ~25 € qui **favorise le direct**).
- **Taxe de séjour** : forfait bas conservé sur direct/VRBO (Beds24 ne gère pas le plafond 4,40 ; un %
  sur-collecterait aux prix élevés et rendrait le direct plus cher qu'Airbnb).
- **Price rules « fantômes »** API : résolues (recréées à la main).
