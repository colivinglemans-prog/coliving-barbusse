# Eau chaude — Cozytouch (ballon thermodynamique Atlantic ÉGÉO 250 L)

> Référence détaillée du ballon d'eau chaude (API Overkiz, modes, commandes, states, automation) — complément de [CLAUDE.md](../CLAUDE.md), qui en résume les règles critiques. À lire avant de modifier ou d'expliquer le code de ce sujet.

## Cozytouch (Ballon thermodynamique Atlantic)

- **API** : Overkiz (`https://ha110-1.overkiz.com/enduser-mobile-web/enduserAPI`)
- **Auth** : 3 étapes (Atlantic token → JWT → Overkiz session JSESSIONID)
- **Client ID** : constant dans `lib/cozytouch.ts`
- **Session** : cachée en Redis (TTL 8h) + in-memory (60s), retry sur 401
- **Device** : `modbuslink:AtlanticDomesticHotWaterProductionMBLComponent`
- **Device URL** : `modbuslink://1908-1459-2296/1#1`, sensor `#2`

### Configuration physique

- Ballon thermo **Atlantic ÉGÉO 250 L** (vertical, PAC **sur air ambiant**, connecté Cozytouch) **en série** avec un ballon classique Chauffeo 300L (ref 022122)

### Modèle : Atlantic ÉGÉO 250 L

Faits de la notice d'installation et d'utilisation ÉGÉO (édition octobre 2021, [manualslib](https://www.manualslib.com/manual/2601849/Atlantic-Egeo.html), p. 13, 23-25, 43) et de la [notice simplifiée](https://cdn.shopify.com/s/files/1/0517/1894/6971/files/notice-simplifiee-utilisateur-egeo.pdf) (relevés le 2026-11-07). Ce qui n'y figure pas est marqué *non vérifié*.

| Caractéristique | Valeur |
|---|---|
| PAC | 450 W absorbés max, R290 |
| Appoint électrique | **1 800 W** |
| COP | **2,66** (air à 15 °C, eau de 10 à 53 °C, EN 16147) |
| Temps de chauffe 250 L | **4 h 34** (10 → 53 °C, air à 15 °C) |
| V40 | 336,6 L |
| **Plage d'air de la PAC** | **8 à 35 °C** (tableau technique) — 5 à 35 °C ailleurs dans la notice, contradiction non levée. Local conseillé > 5 °C toute l'année |

Modes de la notice (ÉGÉO connecté) :

- **ECO+** (`autoMode`) : consigne ajustée **seule entre 50 et 65 °C** selon les consommations passées, PAC privilégiée, **appoint possible « en soutien »**. L'apprentissage sur les jours précédents se prête mal à une location (semaine vide → consigne basse le jour d'arrivée) — *déduit*.
- **MANUEL** : consigne réglable 50–62 °C, « PAC seule » privilégiée, appoint « si les températures d'air sont hors plage ou les consommations importantes… en fin de chauffe ». La notice ne décrit pas d'« ECO actif / inactif » : la correspondance `manualEcoActive` = PAC seule et `manualEcoInactive` = appoint autorisé vient de l'intégration Overkiz de Home Assistant (`manualEcoInactive` classé « electric ») — *non vérifié sur l'ÉGÉO*. La notice simplifiée (version à molette) donne un mode ECO à **54 °C**.
- **ABSENCE** : eau maintenue à 15–20 °C par la PAC, boost désactivé.
- **BOOST** : **uniquement par l'application Cozytouch**, « chauffe jusqu'à la quantité d'eau chaude maximale ». PAC + appoint, durée et arrêt automatique : *non vérifiés*.

Conséquences pour le pilotage :

- ⚠️ **Garage non chauffé** : sous **8 °C d'air** (cas fréquent l'hiver au Mans), la PAC s'arrête et **tout passe à l'appoint de 1 800 W**. La PAC tourne d'elle-même dès que l'air repasse au-dessus du seuil : un boost à midi n'y ajoute que l'appoint.
- Remonter 250 L de 15 à 55 °C, c'est environ 11,6 kWh : environ 4,4 kWh à la PAC (COP 2,66), 11,6 kWh à l'appoint.
- La notice ne mentionne **ni anti-légionelle, ni sonde du milieu**. Le state `modbuslink:MiddleWaterTemperatureState` est remonté par l'API, mais sa présence sur l'ÉGÉO est à confirmer sur la carte du dashboard (« Milieu : … °C »). Elle sert au contrôle « PAC à l'arrêt ».
- Contrôle annuel recommandé par la notice : mesure de puissance de l'appoint électrique.

### Journal horaire (`lib/water-heater-log.ts`)

Depuis le 2026-11-07, `water-heater-automation` ajoute à chaque passage réel une entrée à la liste Redis `barbusse:water-heater:log` (plus récente en tête, 60 jours au plus) : personnes, profil, mode, consigne, boost, heure de pic et Absence (depuis le 9/11), sondes bas et milieu, eau restante, douches, puissances PAC et appoint, **compteurs cumulés d'heures PAC et appoint** (`HeatPumpOperatingTimeState`, `ElectricBoosterOperatingTimeState`), consommation, commandes appliquées. L'écart des compteurs entre deux entrées donne qui a chauffé dans l'heure. But : décider des profils (ECO actif 55 °C partout ? boosts de midi ?) sur une à deux semaines de mesures, pas sur la notice.
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

Profil calculé à partir du nombre de personnes présentes (somme `numAdult + numChild` sur les bookings actifs + arrivants du jour dès 11h + partants du jour jusqu’à 11h, cf. `countGuests`) :

| Profil | Personnes | Hors pic | Heures de pic (4 h 45-7 h, 16 h 45-22 h) |
|---|---|---|---|
| `vacant` | 0 | Éco 50 °C | Éco 50 °C |
| `low` | 1–4 | Éco 55 °C | **Absence** |
| `normal` | 5–8 | Éco 55 °C | **Absence** |
| `high` | 9–12 | Éco 55 °C | **Absence** |
| `xl` | 13+ | Éco 55 °C | **Absence** |

Jamais de boost automatique. **Pourquoi l'Absence** (mesures du 9/11 au soir, compteur `core:ElectricEnergyConsumptionState`) : en **Éco** (`manualEcoActive`), le thermo consommait ≈ 2,1 kW toute la soirée — **l'appoint tourne aussi en Éco** ; PAC seule ≈ 300 W ; appoint seul 1 800 W. En **Absence** (`setAbsenceMode on`), compteur figé 10 à 15 min après la commande : **seul interrupteur qui coupe la chauffe**. Les états de puissance (`PowerHeatPumpState` ≈ 1 000 W, c'est la chaleur produite ; `PowerHeatElectricalState` = 1 800 W) et `HeatingStatusState` restent figés : ne pas s'y fier. L'Absence est posée à 16 h 45 et 4 h 45 pour agir aux pics de 17 h et 5 h.

**Logique** :
- Ballon dans un garage non chauffé → COP meilleur en journée (air ambiant chaud), mauvais la nuit (≈ 1 mesuré la nuit du 8 au 9/11). L'appoint ne remplace jamais une PAC qui tourne : le 9/11, il a chauffé seul 7 h pendant que la PAC était bloquée (≈ 8 kWh de plus qu'à la PAC).
- Plafond 60°C → reste en PAC pure (au-delà, la résistance électrique prend le relais : coût ×3).
- Pré-chauffe check-in : à partir de 11h (heure du check-out), le profil cible est appliqué pour que le ballon soit chargé à l'arrivée (17h). Deux réservations enchaînées le même jour ne repassent jamais en éco.
- **Délestage (2026-11-09)** : trois coupures en trois soirs à 9 kVA avec 14 voyageurs ; l'appoint tournait le soir et la nuit avec la cuisine, les radiateurs en confort et le ballon classique 300 L (résistance, sans heures creuses), qui couvre désormais seul les pics du soir.
- Boost de rattrapage (6h–9h, 17h–22h, ajouté le 7/11) : **supprimé le 9/11** — il enclenchait l'appoint en plein pic du soir.
- Cron toutes les 15 min ; ordre : boost off et Absence on d'abord, mode et consigne, Absence off en dernier. Le journal note `peak` et `absence`. Boost, Éco+ et Performance manuels refusés (409) aux heures de pic, sauf admin qui force (l'automation reprend la main au passage suivant).
- Statuts `cancelled` et `black` exclus du comptage (helper partagé `lib/bookings.ts`).

**Cron de santé** `water-heater-health` (toutes les 2h) : Absence manquante au pic ou restée hors pic, boost actif, mode ou consigne divergents, **PAC à l'arrêt** (compteur immobile 2 h, eau 5 °C sous la consigne, aucune Absence dans l'intervalle), sonde du milieu absente, ballon hors ligne. Un constat n’alerte que s’il était déjà là au contrôle précédent, **une seule fois** tant qu’il dure, et le retour à la normale part en priorité 1 (règle commune des alertes, `reportAlerts`, état `barbusse:alert:water-heater-health`, depuis le 2026-11-10 — il repartait toutes les 2 h). Les erreurs des crons `water-heater-health` et `water-heater-automation` passent par `reportCronRun` (deux passages en erreur avant l’alerte).
