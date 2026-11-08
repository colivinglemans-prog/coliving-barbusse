# Auto-actions Beds24 — textes de référence (Coliving Barbusse)

> Créé le 2026-11-08 (chantier « Blog, guide et parcours voyageur », Lot 4). Les textes des
> auto-actions vivent dans Beds24 et n'étaient versionnés nulle part : ce fichier en est la
> référence. **Modifier ici d'abord, puis recopier dans Beds24** (SETTINGS > GUEST MANAGEMENT >
> AUTO ACTIONS). Les gabarits Beds24 de la maison n'existent qu'en **français et en anglais** :
> les autres langues reçoivent l'anglais.

## Règles communes

- **Signatures à ne jamais changer** : l'en-tête « Bienvenue au Coliving » / « Welcome to
  Coliving » (arrivée) et l'ouverture « Le depart approche » / « Your departure is approaching »
  (départ). Le dashboard les lit dans le fil pour savoir qu'un message est déjà parti
  (`SIGNATURES`, `lib/guest-messages.ts`).
- **Jamais le guide d'arrivée ni le code** dans la confirmation : le guide affiche le Wi-Fi, et le
  code part avec le message d'arrivée (la synchronisation le pose dès la réservation).
- **Avis** : jamais « si vous avez aimé », jamais « 5 étoiles », aucune contrepartie (règles
  Airbnb, Booking, Google). Jamais « moins cher qu'Airbnb » dans un message à un voyageur d'une
  plateforme.
- **Liens** : ancres fixes du blog, jamais renommées — `#evenements`, `#groupes`,
  `#pendant-le-sejour`. Booking.com peut filtrer les liens externes : à vérifier dans le fil.

## 1. Confirmation de réservation — bloc à ajouter

À ajouter à la fin du message de confirmation existant, avant la signature.

### Français

```
PRÉPARER VOTRE SÉJOUR
Nos articles pour tout le groupe (restos, courses, visites) :
https://www.coliving-barbusse.fr/fr/blog#pendant-le-sejour
Vous venez pour un événement du circuit ? Dates, accès, conseils :
https://www.coliving-barbusse.fr/fr/blog#evenements
Vous recevrez le guide d'arrivée et votre code quelques jours avant l'arrivée.
```

### English

```
PLANNING YOUR STAY
Our articles for the whole group (restaurants, shops, sights):
https://www.coliving-barbusse.fr/en/blog#pendant-le-sejour
Coming for an event at the circuit? Dates, access, tips:
https://www.coliving-barbusse.fr/en/blog#evenements
You will receive the arrival guide and your door code a few days before arrival.
```

## 2. Lendemain de l'arrivée, vers 10 h — ⚠️ NE PAS CRÉER

> **Abandonné le 2026-11-08 (décision de l'hôte)** : ce message est fondu dans le « lendemain de
> l'arrivée » de l'outil maison (`lib/messages/templates.ts`, `bien-installe`, 9h, lien « autour de
> la maison » compris). L'auto-action « bien installé » existante part déjà ce jour-là : en créer
> une seconde ferait **deux messages le même matin**. S'il a été créé malgré tout, le désactiver ; son
> texte reste reconnu par le moteur (empreinte « Tout se passe bien à la maison »). Texte gardé
> pour mémoire.

Déclencheur proposé : 1 jour après l'arrivée, 10:00. Le message qui pèse le plus sur les avis : il
fait remonter un souci en privé avant qu'il devienne public.

### Français

```
Bonjour [GUESTFIRSTNAME],
Tout se passe bien à la maison ? Pour tout le groupe, nos adresses autour de la maison :
https://www.coliving-barbusse.fr/fr/blog#pendant-le-sejour
Un souci, une question ? Écrivez-nous ici ou sur WhatsApp (+33 6 20 92 10 05), on s'en occupe.
Alexandre
```

### English

```
Hello [GUESTFIRSTNAME],
Is everything going well at the house? For the whole group, our tips around the house:
https://www.coliving-barbusse.fr/en/blog#pendant-le-sejour
Any problem or question? Message us here or on WhatsApp (+33 6 20 92 10 05) and we will sort it.
Alexandre
```

## 3. « Before checkout » — ligne à ajouter

Garder le texte actuel (ouverture « Le depart approche » intacte) et ajouter, avant la formule de
fin, la même ligne que le message de départ du dashboard (`DEPARTURE_TEMPLATES`) et de l'outil
maison (`depart`). Elle vaut pour tous les canaux, directes comprises.

**Pas** de ligne « la plateforme vous proposera de laisser un commentaire » (décision de l'hôte du
2026-11-08) : le message d'avis du lendemain du départ le fait déjà, et elle serait fausse pour une
réservation directe.

### Français

```
Une remarque, une suggestion ? Dites-le-nous directement : https://wa.me/33620921005
```

### English

```
Any comment or suggestion? Tell us directly: https://wa.me/33620921005
```

Variable prénom : `[GUESTFIRSTNAME]`, jamais `[GUESTSFIRSTNAMES]` (vide → « Hello , »).
