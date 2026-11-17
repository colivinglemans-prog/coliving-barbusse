import type { ExerciseCatalog } from "./types";

export const EXERCISES_FR: ExerciseCatalog = {
  "back-squat": {
    name: "Back squat (squat barre sur le dos)",
    cues: [
      "Barre posée sur le haut du dos, pas sur la nuque ; mains serrées, coudes sous la barre.",
      "Pieds largeur d'épaules, pointes légèrement ouvertes ; genoux dans l'axe des pieds.",
      "Inspirer et gainer avant de descendre, poitrine haute, regard droit devant.",
      "Descendre au moins jusqu'à la cuisse parallèle au sol si la mobilité le permet, et remonter en poussant le sol.",
      "Régler les sécurités de la cage juste sous la position basse.",
    ],
    mistakes: [
      "Genoux qui rentrent vers l'intérieur à la remontée.",
      "Talons qui décollent ou poids sur la pointe des pieds.",
      "Dos qui s'arrondit en bas, faute de gainage ou de mobilité.",
      "Charger trop vite au détriment de la profondeur.",
    ],
  },
  "front-squat": {
    name: "Squat avant (front squat)",
    cues: [
      "Barre posée sur l'avant des épaules, coudes hauts, doigts sous la barre sans la serrer.",
      "Buste le plus droit possible pendant toute la descente.",
      "Genoux qui avancent librement, dans l'axe des pieds.",
    ],
    mistakes: [
      "Coudes qui tombent : la barre roule vers l'avant.",
      "Charger aussi lourd qu'au back squat.",
      "Porter la barre dans les mains au lieu des épaules.",
    ],
  },
  "goblet-squat": {
    name: "Goblet squat",
    cues: [
      "Un bumper de 5 ou 10 kg tenu à deux mains contre la poitrine, ou un haltère tenu verticalement, coudes sous la charge.",
      "Le bumper est prêt tout de suite, sans monter d'haltère : pratique quand plusieurs personnes s'entraînent en même temps.",
      "Descendre entre les genoux, buste droit, talons au sol.",
      "Idéal pour apprendre le squat ou pour s'échauffer.",
    ],
    mistakes: [
      "Charge qui s'éloigne de la poitrine et tire le buste vers l'avant.",
      "Descente trop courte.",
    ],
  },
  "bench-press": {
    name: "Développé couché",
    cues: [
      "Dans la cage, sécurités réglées juste au-dessus de la poitrine, ou avec un pareur.",
      "Omoplates serrées et basses, pieds bien ancrés au sol, fesses sur le banc.",
      "Descendre la barre sous contrôle vers le bas des pectoraux, avant-bras verticaux.",
      "Pousser la barre vers le haut et légèrement vers l'arrière.",
    ],
    mistakes: [
      "Faire rebondir la barre sur la poitrine.",
      "Coudes complètement écartés à 90° du corps (épaules exposées).",
      "Fesses qui décollent du banc.",
      "Charger lourd seul sans sécurités ni pareur.",
    ],
  },
  "incline-bench-press": {
    name: "Développé couché incliné",
    cues: [
      "Banc incliné modérément (environ 30°).",
      "Mêmes règles qu'au développé couché : omoplates serrées, pieds ancrés.",
      "Barre qui descend vers le haut de la poitrine.",
    ],
    mistakes: [
      "Banc trop redressé : l'exercice devient un développé militaire.",
      "Charge trop lourde pour garder le contrôle.",
    ],
  },
  "overhead-press": {
    name: "Développé militaire debout",
    cues: [
      "Barre partant des clavicules, mains un peu plus larges que les épaules.",
      "Fessiers et abdominaux serrés : le corps forme un bloc.",
      "Reculer la tête pour laisser passer la barre, puis passer la tête sous la barre en haut.",
    ],
    mistakes: [
      "Cambrer le bas du dos pour pousser.",
      "Pousser la barre devant soi au lieu de la monter à la verticale.",
      "S'aider des jambes sans le vouloir.",
    ],
  },
  deadlift: {
    name: "Soulevé de terre",
    cues: [
      "Barre au-dessus du milieu du pied, tibias presque contre la barre.",
      "Dos plat et gainé, épaules légèrement devant la barre, bras tendus.",
      "Pousser le sol avec les jambes, la barre frôle les jambes en montant.",
      "Finir debout, hanches tendues, sans se pencher en arrière.",
      "Avec des bumpers, on peut reposer la barre franchement sur les dalles.",
    ],
    mistakes: [
      "Dos qui s'arrondit, surtout en fin de série.",
      "Barre qui s'éloigne des jambes.",
      "Hanches qui montent avant les épaules.",
      "Hyperextension du dos en haut du mouvement.",
    ],
  },
  "romanian-deadlift": {
    name: "Soulevé de terre jambes tendues (roumain)",
    cues: [
      "Partir debout, genoux légèrement fléchis et fixes.",
      "Pousser les fesses vers l'arrière, la barre glisse le long des cuisses.",
      "Descendre tant que le dos reste plat, en sentant l'étirement des ischio-jambiers.",
    ],
    mistakes: [
      "Arrondir le dos pour aller plus bas.",
      "Plier les genoux comme pour un squat.",
      "Barre qui s'éloigne des jambes.",
    ],
  },
  "power-clean": {
    name: "Power clean (épaulé en puissance)",
    cues: [
      "Position de départ du soulevé de terre, dos plat.",
      "Monter la barre près du corps, puis extension explosive des hanches.",
      "Passer les coudes vite sous la barre et la recevoir sur les épaules, jambes légèrement fléchies.",
      "Apprendre d'abord avec la barre à vide ou des charges légères.",
    ],
    mistakes: [
      "Tirer avec les bras au lieu des jambes et des hanches.",
      "Barre qui part loin devant le corps.",
      "Recevoir la barre coudes bas, sur les poignets.",
    ],
  },
  thruster: {
    name: "Thruster",
    cues: [
      "Squat avant enchaîné avec un développé au-dessus de la tête, en un seul mouvement.",
      "La poussée des jambes lance la barre vers le haut.",
      "Coudes hauts en bas du squat, bras tendus en fin de mouvement.",
    ],
    mistakes: [
      "Développer avec les bras seulement, sans utiliser les jambes.",
      "Squat trop court sous la fatigue.",
      "Cambrer le dos en haut.",
    ],
  },
  "pull-up": {
    name: "Traction",
    cues: [
      "Partir bras tendus, épaules engagées (pas suspendues dans les oreilles).",
      "Tirer les coudes vers les hanches jusqu'au menton au-dessus de la barre.",
      "Redescendre sous contrôle.",
      "Un élastique passé sous les pieds ou les genoux aide à faire des répétitions complètes.",
    ],
    mistakes: [
      "Demi-répétitions sans tendre les bras en bas.",
      "Se balancer pour monter (sauf en kipping volontaire et maîtrisé).",
      "Tendre le cou vers la barre au lieu de monter le corps.",
    ],
  },
  dips: {
    name: "Dips",
    cues: [
      "Bras tendus, épaules basses, buste légèrement penché en avant.",
      "Descendre jusqu'aux coudes à environ 90°, sans forcer au-delà.",
      "Pousser jusqu'aux bras tendus.",
    ],
    mistakes: [
      "Descendre trop bas, épaules qui roulent vers l'avant.",
      "Se laisser tomber au lieu de contrôler la descente.",
    ],
  },
  "push-up": {
    name: "Pompe",
    cues: [
      "Mains un peu plus larges que les épaules, corps aligné de la tête aux talons.",
      "Coudes à environ 45° du corps.",
      "Poitrine jusqu'au sol, puis pousser jusqu'aux bras tendus.",
      "Plus facile : mains sur la box ; plus dur : pieds sur la box.",
    ],
    mistakes: [
      "Hanches qui s'affaissent ou qui montent.",
      "Amplitude réduite.",
    ],
  },
  "seated-cable-row": {
    name: "Tirage horizontal à la poulie basse",
    cues: [
      "Assis ou debout face à la poulie basse, poignée de tirage à prises parallèles, dos droit.",
      "Tirer la poignée vers le nombril en serrant les omoplates.",
      "Revenir lentement, bras tendus, sans arrondir le dos.",
    ],
    mistakes: [
      "Tirer en basculant le buste en arrière.",
      "Hausser les épaules.",
    ],
  },
  "single-arm-cable-row": {
    name: "Rowing à un bras à la poulie basse",
    cues: [
      "Poignée simple sur la poulie basse, un pied en avant, la main libre en appui sur la cuisse.",
      "Tirer le coude vers la hanche en serrant l'omoplate, sans tourner le buste.",
      "Revenir lentement jusqu'au bras tendu, épaule qui s'étire vers l'avant.",
      "Commencer par le bras le plus faible, et faire le même nombre de répétitions de chaque côté.",
    ],
    mistakes: [
      "Tourner le buste pour tirer plus lourd.",
      "Hausser l'épaule vers l'oreille.",
    ],
  },
  "lat-pulldown": {
    name: "Tirage vertical à la poulie haute",
    cues: [
      "Barre large, mains un peu plus larges que les épaules.",
      "Tirer la barre vers le haut de la poitrine, coudes vers le bas.",
      "Buste légèrement incliné en arrière, sans balancer.",
    ],
    mistakes: [
      "Tirer la barre derrière la nuque.",
      "Se jeter en arrière pour tirer plus lourd.",
      "Remonter la barre sans contrôle.",
    ],
  },
  "triceps-pushdown": {
    name: "Extension des triceps à la poulie (corde)",
    cues: [
      "Corde à triceps ou barre droite courte sur la poulie haute, coudes collés au corps.",
      "Pousser vers le bas jusqu'aux bras tendus en écartant la corde en fin de mouvement.",
      "Seuls les avant-bras bougent.",
    ],
    mistakes: [
      "Coudes qui avancent et reculent.",
      "Se pencher sur la corde pour pousser avec le poids du corps.",
    ],
  },
  "cable-curl": {
    name: "Curl biceps à la poulie basse",
    cues: [
      "Debout face à la poulie basse, barre droite courte ou corde, coudes collés au corps.",
      "Monter les mains vers les épaules sans avancer les coudes, redescendre lentement jusqu'aux bras tendus.",
      "La poulie garde la tension tout le long du mouvement, et la charge se règle au kilo près avec les disques en fonte.",
      "Avec la corde, pouces vers le haut (curl marteau) : l'avant-bras travaille aussi.",
    ],
    mistakes: [
      "Balancer le buste en arrière pour monter la charge.",
      "Coudes qui avancent : les épaules prennent le relais.",
      "Remonter trop près de la poulie : se reculer d'un pas pour garder le câble tendu en bas.",
    ],
  },
  "face-pull": {
    name: "Face pull (tirage visage)",
    cues: [
      "Corde sur la poulie haute, à hauteur du visage.",
      "Tirer la corde vers le front en écartant les mains, coudes hauts.",
      "Finir pouces vers l'arrière, omoplates serrées. Charge légère.",
    ],
    mistakes: [
      "Charge trop lourde : le buste part en arrière.",
      "Coudes qui tombent : l'exercice devient un tirage classique.",
    ],
  },
  "band-external-rotation": {
    name: "Rotation externe à l'élastique",
    cues: [
      "Élastique accroché à la cage à hauteur du coude, coude collé au corps, plié à 90°.",
      "Tourner l'avant-bras vers l'extérieur sans décoller le coude.",
      "Mouvement lent, élastique léger, de 15 à 20 répétitions.",
    ],
    mistakes: [
      "Élastique trop dur.",
      "Coude qui se décolle du corps.",
    ],
  },
  "walking-lunge": {
    name: "Fentes marchées",
    cues: [
      "Grand pas en avant, descendre jusqu'à ce que le genou arrière frôle le sol.",
      "Genou avant dans l'axe du pied, buste droit.",
      "Pousser sur le talon avant pour enchaîner le pas suivant.",
    ],
    mistakes: [
      "Pas trop court : le genou avant dépasse largement la pointe du pied.",
      "Genou avant qui rentre vers l'intérieur.",
      "Taper le genou arrière au sol.",
    ],
  },
  "lateral-lunge": {
    name: "Fente latérale",
    cues: [
      "Grand pas sur le côté, s'asseoir sur la jambe qui fléchit, l'autre reste tendue.",
      "Pieds parallèles, genou fléchi dans l'axe du pied.",
      "Pousser pour revenir au centre.",
    ],
    mistakes: [
      "Talon qui décolle du côté fléchi.",
      "Dos qui s'arrondit.",
    ],
  },
  "step-up": {
    name: "Step-up sur la box",
    cues: [
      "Pied entier posé sur la box, monter en poussant sur cette jambe seulement.",
      "Hauteur de box qui laisse le genou un peu au-dessus de la hanche, pas plus.",
      "Redescendre sous contrôle.",
    ],
    mistakes: [
      "S'élancer avec la jambe restée au sol.",
      "Box trop haute.",
    ],
  },
  "hip-thrust": {
    name: "Hip thrust",
    cues: [
      "Haut du dos appuyé sur le banc, barre sur le pli de la hanche, protégée par le manchon.",
      "Monter les hanches jusqu'à l'alignement épaules-hanches-genoux, en serrant les fessiers.",
      "Menton rentré, côtes basses.",
    ],
    mistakes: [
      "Cambrer le bas du dos en haut au lieu de serrer les fessiers.",
      "Pieds trop loin ou trop près.",
    ],
  },
  "calf-raise": {
    name: "Mollets debout",
    cues: [
      "Monter le plus haut possible sur la pointe des pieds, tenir une seconde.",
      "Redescendre lentement, talons en dessous du niveau de la pointe si l'on est sur un disque.",
    ],
    mistakes: [
      "Rebondir sans amplitude.",
      "Plier les genoux pour s'aider.",
    ],
  },
  "medicine-ball-thruster": {
    name: "Thruster à la médecine-ball",
    cues: [
      "Médecine-ball de 6 kg tenue à deux mains contre la poitrine, coudes sous le ballon.",
      "Squat complet, puis remonter en poussant le ballon au-dessus de la tête, bras tendus, d'un seul mouvement.",
      "La poussée des jambes fait monter le ballon ; ramener le ballon à la poitrine en redescendant.",
      "On ne lâche pas le ballon : dans la salle, il ne se lance ni au plafond ni contre les murs.",
    ],
    mistakes: [
      "Pousser avec les bras seulement, sans l'élan des jambes.",
      "Squat trop court sous la fatigue.",
      "Cambrer le dos, ballon en arrière de la tête, en fin de mouvement.",
    ],
  },
  "box-jump": {
    name: "Box jump",
    cues: [
      "Commencer bas (20 à 30 cm) et monter la hauteur progressivement.",
      "Sauter à deux pieds, se réceptionner pieds entiers, genoux dans l'axe, en douceur.",
      "Se relever complètement sur la box, puis redescendre en marchant.",
    ],
    mistakes: [
      "Box trop haute : réception en squat profond, risque de chute.",
      "Redescendre en sautant à l'arrière, sous la fatigue (tendons d'Achille).",
      "Genoux qui rentrent à la réception.",
    ],
  },
  "jump-rope": {
    name: "Corde à sauter",
    cues: [
      "Sauts courts sur l'avant du pied, genoux souples.",
      "La corde tourne avec les poignets, coudes près du corps.",
      "Commencer par des séries courtes.",
    ],
    mistakes: [
      "Sauter trop haut.",
      "Faire tourner la corde avec les bras.",
    ],
  },
  rowing: {
    name: "Rameur (Concept2)",
    cues: [
      "Ordre de la poussée : jambes, puis buste, puis bras ; au retour : bras, buste, jambes.",
      "La force vient surtout des jambes.",
      "Dos droit, épaules basses, poignée tirée vers le bas des côtes.",
      "Réglage de résistance (damper) entre 3 et 5 pour la plupart des séances.",
    ],
    mistakes: [
      "Tirer avec les bras avant d'avoir poussé avec les jambes.",
      "Damper au maximum en pensant travailler plus.",
      "Dos arrondi, épaules haussées.",
    ],
  },
  plank: {
    name: "Planche (gainage ventral)",
    cues: [
      "En appui sur les avant-bras, coudes sous les épaules.",
      "Corps aligné, fessiers et abdominaux serrés.",
      "Respirer normalement.",
    ],
    mistakes: [
      "Hanches qui s'affaissent ou qui montent.",
      "Bloquer sa respiration.",
    ],
  },
  "side-plank": {
    name: "Planche latérale",
    cues: [
      "Coude sous l'épaule, corps aligné de profil.",
      "Hanches hautes, ne pas tourner le buste.",
    ],
    mistakes: [
      "Hanche qui tombe.",
      "Épaule qui s'affaisse dans l'appui.",
    ],
  },
  "copenhagen-plank": {
    name: "Planche Copenhague (adducteurs)",
    cues: [
      "Planche latérale, jambe du dessus posée sur le banc : le genou sur le banc pour débuter, le pied pour progresser.",
      "La jambe du dessous reste libre ou soulevée.",
      "Corps aligné, temps courts au début (10 à 20 secondes).",
    ],
    mistakes: [
      "Commencer en appui sur le pied : trop dur pour l'adducteur au début.",
      "Hanche qui tombe.",
    ],
  },
  "dead-bug": {
    name: "Dead bug",
    cues: [
      "Sur le dos, bras tendus vers le plafond, genoux à 90°.",
      "Bas du dos plaqué au sol pendant tout l'exercice.",
      "Tendre un bras et la jambe opposée lentement, revenir, changer de côté.",
    ],
    mistakes: [
      "Bas du dos qui se décolle.",
      "Aller trop vite.",
    ],
  },
  "pallof-press": {
    name: "Pallof press (gainage anti-rotation)",
    cues: [
      "De profil par rapport à la poulie réglée à hauteur de poitrine, poignée simple tenue à deux mains.",
      "Tendre les bras devant soi et tenir deux secondes sans laisser le buste tourner.",
      "Pieds largeur d'épaules, genoux légèrement fléchis.",
    ],
    mistakes: [
      "Charge trop lourde : le buste tourne vers la poulie.",
      "Se pencher pour résister.",
    ],
  },
  "farmer-walk": {
    name: "Marche du fermier",
    cues: [
      "Un haltère chargé dans chaque main, ramassé dos plat.",
      "Marcher droit, épaules basses, petits pas réguliers.",
    ],
    mistakes: [
      "Se pencher d'un côté.",
      "Lâcher des haltères chargés en fonte au sol : les reposer.",
    ],
  },
  "neck-isometrics": {
    name: "Cou en isométrie",
    cues: [
      "Assis ou debout, la main posée contre le front, l'arrière ou le côté de la tête.",
      "Pousser la tête contre la main sans bouger, environ à mi-force, 10 à 15 secondes.",
      "Progresser lentement, sans jamais forcer brutalement.",
    ],
    mistakes: [
      "Pousser au maximum dès le début.",
      "Faire des mouvements rapides ou des rotations avec charge.",
    ],
  },
};
