# Fiscalité LMNP / LMP

> Référence détaillée du dashboard fiscal (règles codées, configuration par année, UI, contexte, restrictions) — complément de [CLAUDE.md](../CLAUDE.md), qui en résume les règles critiques. À lire avant de modifier ou d'expliquer le code de ce sujet.

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
