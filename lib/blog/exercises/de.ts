import type { ExerciseCatalog } from "./types";

export const EXERCISES_DE: ExerciseCatalog = {
  "back-squat": {
    name: "Back Squat (Kniebeuge mit Langhantel auf dem Rücken)",
    cues: [
      "Stange auf dem oberen Rücken ablegen, nicht auf dem Nacken; Hände fest, Ellbogen unter der Stange.",
      "Füße schulterbreit, Fußspitzen leicht nach außen; Knie in Linie mit den Füßen.",
      "Vor dem Absenken einatmen und den Rumpf anspannen, Brust hoch, Blick geradeaus.",
      "Mindestens so weit absenken, bis der Oberschenkel parallel zum Boden ist, sofern die Mobilität es zulässt, und dann den Boden wegdrücken.",
      "Die Sicherungen des Racks knapp unter der tiefsten Position einstellen.",
    ],
    mistakes: [
      "Knie, die beim Hochkommen nach innen fallen.",
      "Fersen, die abheben, oder Gewicht auf den Fußspitzen.",
      "Runder Rücken in der tiefen Position, mangels Rumpfspannung oder Mobilität.",
      "Zu schnell Gewicht auflegen, auf Kosten der Tiefe.",
    ],
  },
  "front-squat": {
    name: "Front Squat (Frontkniebeuge)",
    cues: [
      "Stange vorne auf den Schultern ablegen, Ellbogen hoch, Finger unter der Stange, ohne sie fest zu umgreifen.",
      "Oberkörper während des gesamten Absenkens so aufrecht wie möglich.",
      "Knie wandern frei nach vorne, in Linie mit den Füßen.",
    ],
    mistakes: [
      "Ellbogen, die absinken: Die Stange rollt nach vorne.",
      "So schwer laden wie beim Back Squat.",
      "Die Stange in den Händen statt auf den Schultern tragen.",
    ],
  },
  "goblet-squat": {
    name: "Goblet Squat",
    cues: [
      "Eine Bumper Plate von 5 oder 10 kg mit beiden Händen vor der Brust halten, oder eine senkrecht gehaltene Kurzhantel, Ellbogen unter dem Gewicht.",
      "Die Bumper Plate ist sofort einsatzbereit, ohne eine Kurzhantel bestücken zu müssen: praktisch, wenn mehrere Personen gleichzeitig trainieren.",
      "Zwischen die Knie absenken, Oberkörper aufrecht, Fersen am Boden.",
      "Ideal, um die Kniebeuge zu lernen oder sich aufzuwärmen.",
    ],
    mistakes: [
      "Das Gewicht entfernt sich von der Brust und zieht den Oberkörper nach vorne.",
      "Zu geringe Tiefe.",
    ],
  },
  "bench-press": {
    name: "Bankdrücken",
    cues: [
      "Im Rack, Sicherungen knapp über der Brust eingestellt, oder mit einem Sicherungspartner.",
      "Schulterblätter zusammen und nach unten gezogen, Füße fest am Boden, Gesäß auf der Bank.",
      "Die Stange kontrolliert zum unteren Brustbereich absenken, Unterarme senkrecht.",
      "Die Stange nach oben und leicht nach hinten drücken.",
    ],
    mistakes: [
      "Die Stange von der Brust abfedern lassen.",
      "Ellbogen im 90°-Winkel komplett vom Körper abgespreizt (Schultern belastet).",
      "Gesäß, das von der Bank abhebt.",
      "Allein schwer drücken, ohne Sicherungen oder Partner.",
    ],
  },
  "incline-bench-press": {
    name: "Schrägbankdrücken",
    cues: [
      "Bank mäßig geneigt (etwa 30°).",
      "Gleiche Regeln wie beim Bankdrücken: Schulterblätter zusammen, Füße fest am Boden.",
      "Die Stange wird zur oberen Brust abgesenkt.",
    ],
    mistakes: [
      "Bank zu steil: Die Übung wird zum Schulterdrücken.",
      "Gewicht zu schwer, um die Kontrolle zu behalten.",
    ],
  },
  "overhead-press": {
    name: "Schulterdrücken im Stehen",
    cues: [
      "Stange startet auf Höhe der Schlüsselbeine, Hände etwas breiter als schulterbreit.",
      "Gesäß und Bauch angespannt: Der Körper bildet eine Einheit.",
      "Den Kopf zurücknehmen, um die Stange vorbeizulassen, und oben den Kopf unter die Stange bringen.",
    ],
    mistakes: [
      "Den unteren Rücken ins Hohlkreuz drücken, um zu stemmen.",
      "Die Stange nach vorne drücken statt senkrecht nach oben.",
      "Unbeabsichtigt Schwung aus den Beinen holen.",
    ],
  },
  deadlift: {
    name: "Kreuzheben",
    cues: [
      "Stange über der Fußmitte, Schienbeine fast an der Stange.",
      "Rücken gerade und angespannt, Schultern leicht vor der Stange, Arme gestreckt.",
      "Mit den Beinen den Boden wegdrücken, die Stange streift beim Hochziehen die Beine.",
      "Aufrecht abschließen, Hüfte gestreckt, ohne sich nach hinten zu lehnen.",
      "Mit Bumper Plates darf man die Stange ruhig kräftig auf den Matten absetzen.",
    ],
    mistakes: [
      "Runder Rücken, vor allem am Ende des Satzes.",
      "Die Stange entfernt sich von den Beinen.",
      "Die Hüfte steigt vor den Schultern.",
      "Überstreckung des Rückens oben in der Bewegung.",
    ],
  },
  "romanian-deadlift": {
    name: "Rumänisches Kreuzheben",
    cues: [
      "Aufrecht starten, Knie leicht gebeugt und fixiert.",
      "Das Gesäß nach hinten schieben, die Stange gleitet an den Oberschenkeln entlang.",
      "So weit absenken, wie der Rücken gerade bleibt, und die Dehnung der hinteren Oberschenkel spüren.",
    ],
    mistakes: [
      "Den Rücken rund machen, um tiefer zu kommen.",
      "Die Knie beugen wie bei einer Kniebeuge.",
      "Die Stange entfernt sich von den Beinen.",
    ],
  },
  "power-clean": {
    name: "Power Clean (Umsetzen)",
    cues: [
      "Startposition wie beim Kreuzheben, Rücken gerade.",
      "Die Stange nah am Körper hochziehen, dann explosive Hüftstreckung.",
      "Die Ellbogen schnell unter die Stange bringen und sie auf den Schultern annehmen, Beine leicht gebeugt.",
      "Zuerst mit der leeren Stange oder leichten Gewichten lernen.",
    ],
    mistakes: [
      "Mit den Armen ziehen statt mit Beinen und Hüfte.",
      "Die Stange wandert weit vor den Körper.",
      "Die Stange mit tiefen Ellbogen annehmen, auf den Handgelenken.",
    ],
  },
  thruster: {
    name: "Thruster",
    cues: [
      "Front Squat, direkt gefolgt von einem Drücken über Kopf, in einer einzigen Bewegung.",
      "Der Druck aus den Beinen bringt die Stange nach oben.",
      "Ellbogen hoch in der tiefen Position, Arme am Ende der Bewegung gestreckt.",
    ],
    mistakes: [
      "Nur mit den Armen drücken, ohne die Beine einzusetzen.",
      "Bei Ermüdung zu flache Kniebeuge.",
      "Oben ins Hohlkreuz gehen.",
    ],
  },
  "pull-up": {
    name: "Klimmzug",
    cues: [
      "Mit gestreckten Armen starten, Schultern aktiv (nicht bis zu den Ohren hängend).",
      "Die Ellbogen Richtung Hüfte ziehen, bis das Kinn über der Stange ist.",
      "Kontrolliert absenken.",
      "Ein Widerstandsband unter den Füßen oder Knien hilft, vollständige Wiederholungen zu schaffen.",
    ],
    mistakes: [
      "Halbe Wiederholungen, ohne die Arme unten zu strecken.",
      "Mit Schwung hochkommen (außer bei bewusstem und beherrschtem Kipping).",
      "Den Hals zur Stange recken, statt den Körper hochzuziehen.",
    ],
  },
  dips: {
    name: "Dips",
    cues: [
      "Arme gestreckt, Schultern tief, Oberkörper leicht nach vorne geneigt.",
      "Absenken, bis die Ellbogen etwa 90° gebeugt sind, nicht darüber hinaus erzwingen.",
      "Hochdrücken, bis die Arme gestreckt sind.",
    ],
    mistakes: [
      "Zu tief absenken, die Schultern rollen nach vorne.",
      "Sich fallen lassen, statt das Absenken zu kontrollieren.",
    ],
  },
  "push-up": {
    name: "Liegestütz",
    cues: [
      "Hände etwas breiter als schulterbreit, Körper vom Kopf bis zu den Fersen in einer Linie.",
      "Ellbogen etwa 45° vom Körper entfernt.",
      "Brust bis zum Boden, dann hochdrücken, bis die Arme gestreckt sind.",
      "Leichter: Hände auf der Box; schwerer: Füße auf der Box.",
    ],
    mistakes: [
      "Hüfte, die durchhängt oder nach oben geht.",
      "Verkürzter Bewegungsumfang.",
    ],
  },
  "seated-cable-row": {
    name: "Rudern am unteren Kabelzug",
    cues: [
      "Sitzend oder stehend vor dem unteren Kabelzug, Rudergriff mit parallelen Griffen, Rücken gerade.",
      "Den Griff zum Bauchnabel ziehen und dabei die Schulterblätter zusammenziehen.",
      "Langsam zurück, Arme gestreckt, ohne den Rücken rund zu machen.",
    ],
    mistakes: [
      "Ziehen, indem man den Oberkörper nach hinten kippt.",
      "Die Schultern hochziehen.",
    ],
  },
  "single-arm-cable-row": {
    name: "Einarmiges Rudern am unteren Kabelzug",
    cues: [
      "Einhandgriff am unteren Kabelzug, ein Fuß vorne, die freie Hand auf dem Oberschenkel abgestützt.",
      "Den Ellbogen zur Hüfte ziehen und das Schulterblatt zusammenziehen, ohne den Oberkörper zu drehen.",
      "Langsam bis zum gestreckten Arm zurück, die Schulter dehnt sich nach vorne.",
      "Mit dem schwächeren Arm beginnen und auf jeder Seite gleich viele Wiederholungen machen.",
    ],
    mistakes: [
      "Den Oberkörper drehen, um mehr Gewicht zu ziehen.",
      "Die Schulter zum Ohr hochziehen.",
    ],
  },
  "lat-pulldown": {
    name: "Latziehen am oberen Kabelzug",
    cues: [
      "Breite Stange, Hände etwas breiter als schulterbreit.",
      "Die Stange zur oberen Brust ziehen, Ellbogen nach unten.",
      "Oberkörper leicht nach hinten geneigt, ohne zu schwingen.",
    ],
    mistakes: [
      "Die Stange hinter den Nacken ziehen.",
      "Sich nach hinten werfen, um mehr Gewicht zu ziehen.",
      "Die Stange unkontrolliert hochgehen lassen.",
    ],
  },
  "triceps-pushdown": {
    name: "Trizepsdrücken am Kabelzug (Seil)",
    cues: [
      "Trizepsseil oder kurze gerade Stange am oberen Kabelzug, Ellbogen eng am Körper.",
      "Nach unten drücken, bis die Arme gestreckt sind, und das Seil am Ende der Bewegung auseinanderziehen.",
      "Nur die Unterarme bewegen sich.",
    ],
    mistakes: [
      "Ellbogen, die nach vorne und hinten wandern.",
      "Sich über das Seil lehnen, um mit dem Körpergewicht zu drücken.",
    ],
  },
  "cable-curl": {
    name: "Bizepscurl am unteren Kabelzug",
    cues: [
      "Stehend vor dem unteren Kabelzug, kurze gerade Stange oder Seil, Ellbogen eng am Körper.",
      "Die Hände zu den Schultern führen, ohne die Ellbogen nach vorne zu schieben, dann langsam bis zu gestreckten Armen absenken.",
      "Der Kabelzug hält die Spannung über die ganze Bewegung, und das Gewicht lässt sich mit den Gusseisenscheiben aufs Kilo genau einstellen.",
      "Mit dem Seil, Daumen nach oben (Hammercurl): Der Unterarm arbeitet mit.",
    ],
    mistakes: [
      "Den Oberkörper nach hinten schwingen, um das Gewicht hochzubringen.",
      "Ellbogen, die nach vorne wandern: Die Schultern übernehmen.",
      "Zu nah am Kabelzug stehen: einen Schritt zurücktreten, damit das Kabel unten gespannt bleibt.",
    ],
  },
  "face-pull": {
    name: "Face Pull",
    cues: [
      "Seil am oberen Kabelzug, auf Gesichtshöhe.",
      "Das Seil zur Stirn ziehen und dabei die Hände auseinanderführen, Ellbogen hoch.",
      "Mit den Daumen nach hinten abschließen, Schulterblätter zusammengezogen. Leichtes Gewicht.",
    ],
    mistakes: [
      "Gewicht zu schwer: Der Oberkörper kippt nach hinten.",
      "Ellbogen, die absinken: Die Übung wird zu einem klassischen Rudern.",
    ],
  },
  "band-external-rotation": {
    name: "Außenrotation mit dem Widerstandsband",
    cues: [
      "Band auf Ellbogenhöhe am Rack befestigt, Ellbogen eng am Körper, 90° gebeugt.",
      "Den Unterarm nach außen drehen, ohne den Ellbogen vom Körper zu lösen.",
      "Langsame Bewegung, leichtes Band, 15 bis 20 Wiederholungen.",
    ],
    mistakes: [
      "Band zu stark.",
      "Ellbogen, der sich vom Körper löst.",
    ],
  },
  "walking-lunge": {
    name: "Walking Lunges (Ausfallschritte im Gehen)",
    cues: [
      "Großer Schritt nach vorne, absenken, bis das hintere Knie fast den Boden berührt.",
      "Vorderes Knie in Linie mit dem Fuß, Oberkörper aufrecht.",
      "Über die vordere Ferse abdrücken, um in den nächsten Schritt zu gehen.",
    ],
    mistakes: [
      "Zu kurzer Schritt: Das vordere Knie schiebt sich weit über die Fußspitze hinaus.",
      "Vorderes Knie, das nach innen fällt.",
      "Mit dem hinteren Knie auf den Boden schlagen.",
    ],
  },
  "lateral-lunge": {
    name: "Seitlicher Ausfallschritt",
    cues: [
      "Großer Schritt zur Seite, sich auf das gebeugte Bein setzen, das andere bleibt gestreckt.",
      "Füße parallel, gebeugtes Knie in Linie mit dem Fuß.",
      "Abdrücken, um zur Mitte zurückzukehren.",
    ],
    mistakes: [
      "Ferse, die auf der gebeugten Seite abhebt.",
      "Runder Rücken.",
    ],
  },
  "step-up": {
    name: "Step-up auf die Box",
    cues: [
      "Den ganzen Fuß auf die Box setzen und nur mit diesem Bein hochdrücken.",
      "Boxhöhe so wählen, dass das Knie etwas über der Hüfte liegt, nicht höher.",
      "Kontrolliert wieder absteigen.",
    ],
    mistakes: [
      "Sich mit dem Bein am Boden abstoßen.",
      "Box zu hoch.",
    ],
  },
  "hip-thrust": {
    name: "Hip Thrust",
    cues: [
      "Oberer Rücken an die Bank gelehnt, Stange in der Hüftbeuge, durch das Nackenpolster geschützt.",
      "Die Hüfte anheben, bis Schultern, Hüfte und Knie eine Linie bilden, dabei das Gesäß anspannen.",
      "Kinn eingezogen, Rippen unten.",
    ],
    mistakes: [
      "Oben ins Hohlkreuz gehen, statt das Gesäß anzuspannen.",
      "Füße zu weit weg oder zu nah.",
    ],
  },
  "calf-raise": {
    name: "Wadenheben im Stehen",
    cues: [
      "So hoch wie möglich auf die Zehenspitzen gehen, eine Sekunde halten.",
      "Langsam absenken, Fersen unter Höhe der Zehenspitzen, wenn man auf einer Hantelscheibe steht.",
    ],
    mistakes: [
      "Ohne Bewegungsumfang federn.",
      "Die Knie beugen, um mitzuhelfen.",
    ],
  },
  "medicine-ball-thruster": {
    name: "Thruster mit dem Medizinball",
    cues: [
      "6 kg schwerer Medizinball, mit beiden Händen vor der Brust gehalten, Ellbogen unter dem Ball.",
      "Volle Kniebeuge, dann hochkommen und den Ball in einer einzigen Bewegung über den Kopf drücken, Arme gestreckt.",
      "Der Druck aus den Beinen bringt den Ball nach oben; beim Absenken den Ball zur Brust zurückführen.",
      "Der Ball wird nicht losgelassen: Im Fitnessraum wird er weder an die Decke noch gegen die Wände geworfen.",
    ],
    mistakes: [
      "Nur mit den Armen drücken, ohne Schwung aus den Beinen.",
      "Bei Ermüdung zu flache Kniebeuge.",
      "Am Ende der Bewegung ins Hohlkreuz gehen, Ball hinter dem Kopf.",
    ],
  },
  "box-jump": {
    name: "Box Jump",
    cues: [
      "Niedrig beginnen (20 bis 30 cm) und die Höhe schrittweise steigern.",
      "Beidbeinig abspringen, mit ganzem Fuß weich landen, Knie in Linie mit den Füßen.",
      "Sich auf der Box vollständig aufrichten, dann heruntersteigen.",
    ],
    mistakes: [
      "Box zu hoch: Landung in tiefer Hocke, Sturzgefahr.",
      "Bei Ermüdung rückwärts herunterspringen (Achillessehnen).",
      "Knie, die bei der Landung nach innen fallen.",
    ],
  },
  "jump-rope": {
    name: "Springseil",
    cues: [
      "Kurze Sprünge auf dem Vorfuß, Knie locker.",
      "Das Seil dreht aus den Handgelenken, Ellbogen nah am Körper.",
      "Mit kurzen Sätzen beginnen.",
    ],
    mistakes: [
      "Zu hoch springen.",
      "Das Seil mit den Armen drehen.",
    ],
  },
  rowing: {
    name: "Rudergerät (Concept2)",
    cues: [
      "Reihenfolge beim Durchzug: Beine, dann Oberkörper, dann Arme; beim Zurückgleiten: Arme, Oberkörper, Beine.",
      "Die Kraft kommt vor allem aus den Beinen.",
      "Rücken gerade, Schultern tief, Griff zu den unteren Rippen gezogen.",
      "Widerstandseinstellung (Damper) bei den meisten Einheiten zwischen 3 und 5.",
    ],
    mistakes: [
      "Mit den Armen ziehen, bevor man mit den Beinen abgedrückt hat.",
      "Damper auf Maximum, im Glauben, härter zu trainieren.",
      "Runder Rücken, hochgezogene Schultern.",
    ],
  },
  plank: {
    name: "Plank (Unterarmstütz)",
    cues: [
      "Auf den Unterarmen abgestützt, Ellbogen unter den Schultern.",
      "Körper in einer Linie, Gesäß und Bauch angespannt.",
      "Normal weiteratmen.",
    ],
    mistakes: [
      "Hüfte, die durchhängt oder nach oben geht.",
      "Die Luft anhalten.",
    ],
  },
  "side-plank": {
    name: "Seitstütz",
    cues: [
      "Ellbogen unter der Schulter, Körper seitlich in einer Linie.",
      "Hüfte oben, den Oberkörper nicht verdrehen.",
    ],
    mistakes: [
      "Hüfte, die absinkt.",
      "Schulter, die in der Stütze einsinkt.",
    ],
  },
  "copenhagen-plank": {
    name: "Copenhagen Plank (Adduktoren)",
    cues: [
      "Seitstütz, das obere Bein auf der Bank: zum Einstieg das Knie auf der Bank, zur Steigerung der Fuß.",
      "Das untere Bein bleibt frei oder angehoben.",
      "Körper in einer Linie, anfangs kurze Haltezeiten (10 bis 20 Sekunden).",
    ],
    mistakes: [
      "Gleich mit dem Fuß als Stütze beginnen: anfangs zu schwer für den Adduktor.",
      "Hüfte, die absinkt.",
    ],
  },
  "dead-bug": {
    name: "Dead Bug",
    cues: [
      "In Rückenlage, Arme zur Decke gestreckt, Knie im 90°-Winkel.",
      "Unterer Rücken während der ganzen Übung fest am Boden.",
      "Langsam einen Arm und das gegenüberliegende Bein strecken, zurückkommen, Seite wechseln.",
    ],
    mistakes: [
      "Unterer Rücken, der sich vom Boden löst.",
      "Zu schnell ausführen.",
    ],
  },
  "pallof-press": {
    name: "Pallof Press (Anti-Rotations-Übung)",
    cues: [
      "Seitlich zum Kabelzug, auf Brusthöhe eingestellt, Einhandgriff mit beiden Händen gehalten.",
      "Die Arme nach vorne strecken und zwei Sekunden halten, ohne den Oberkörper mitdrehen zu lassen.",
      "Füße schulterbreit, Knie leicht gebeugt.",
    ],
    mistakes: [
      "Gewicht zu schwer: Der Oberkörper dreht sich zum Kabelzug.",
      "Sich zur Seite lehnen, um gegenzuhalten.",
    ],
  },
  "farmer-walk": {
    name: "Farmer's Walk",
    cues: [
      "In jeder Hand eine beladene Kurzhantel, mit geradem Rücken aufgenommen.",
      "Aufrecht gehen, Schultern tief, kleine, gleichmäßige Schritte.",
    ],
    mistakes: [
      "Sich zu einer Seite neigen.",
      "Mit Gusseisen beladene Kurzhanteln auf den Boden fallen lassen: Sie werden abgelegt.",
    ],
  },
  "neck-isometrics": {
    name: "Isometrisches Nackentraining",
    cues: [
      "Sitzend oder stehend, die Hand an Stirn, Hinterkopf oder Kopfseite gelegt.",
      "Den Kopf gegen die Hand drücken, ohne ihn zu bewegen, mit etwa halber Kraft, 10 bis 15 Sekunden.",
      "Langsam steigern, nie ruckartig Kraft einsetzen.",
    ],
    mistakes: [
      "Von Anfang an mit maximaler Kraft drücken.",
      "Schnelle Bewegungen oder Rotationen mit Gewicht ausführen.",
    ],
  },
};
