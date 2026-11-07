# Eau chaude — Cozytouch (ballon thermodynamique Atlantic)

> Référence détaillée du ballon d'eau chaude (API Overkiz, modes, commandes, states, automation) — complément de [CLAUDE.md](../CLAUDE.md), qui en résume les règles critiques. À lire avant de modifier ou d'expliquer le code de ce sujet.

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
