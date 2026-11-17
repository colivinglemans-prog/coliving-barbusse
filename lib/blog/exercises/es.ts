import type { ExerciseCatalog } from "./types";

export const EXERCISES_ES: ExerciseCatalog = {
  "back-squat": {
    name: "Back squat (sentadilla con barra en la espalda)",
    cues: [
      "Barra apoyada en la parte alta de la espalda, no sobre la nuca; agarre cerrado, codos bajo la barra.",
      "Pies a la anchura de los hombros, puntas ligeramente abiertas; rodillas alineadas con los pies.",
      "Inspirar y bloquear el core antes de bajar, pecho arriba, mirada al frente.",
      "Bajar al menos hasta que el muslo quede paralelo al suelo si la movilidad lo permite, y subir empujando el suelo.",
      "Ajustar los topes de seguridad de la jaula justo por debajo de la posición baja.",
    ],
    mistakes: [
      "Rodillas que se van hacia dentro al subir.",
      "Talones que se levantan o peso sobre la punta de los pies.",
      "Espalda que se redondea abajo, por falta de bloqueo del core o de movilidad.",
      "Cargar demasiado rápido a costa de la profundidad.",
    ],
  },
  "front-squat": {
    name: "Sentadilla frontal (front squat)",
    cues: [
      "Barra apoyada en la parte delantera de los hombros, codos altos, dedos bajo la barra sin apretarla.",
      "Tronco lo más recto posible durante toda la bajada.",
      "Rodillas que avanzan libremente, alineadas con los pies.",
    ],
    mistakes: [
      "Codos que caen: la barra rueda hacia delante.",
      "Cargar tanto como en el back squat.",
      "Sujetar la barra con las manos en lugar de llevarla sobre los hombros.",
    ],
  },
  "goblet-squat": {
    name: "Goblet squat",
    cues: [
      "Un disco bumper de 5 o 10 kg sujeto con las dos manos contra el pecho, o una mancuerna sujeta en vertical, codos bajo la carga.",
      "El bumper está listo al instante, sin montar una mancuerna: práctico cuando varias personas entrenan a la vez.",
      "Bajar entre las rodillas, tronco recto, talones en el suelo.",
      "Ideal para aprender la sentadilla o para calentar.",
    ],
    mistakes: [
      "Carga que se aleja del pecho y tira del tronco hacia delante.",
      "Bajada demasiado corta.",
    ],
  },
  "bench-press": {
    name: "Press de banca",
    cues: [
      "Dentro de la jaula, con los topes ajustados justo por encima del pecho, o con alguien que asista.",
      "Escápulas juntas y abajo, pies bien firmes en el suelo, glúteos sobre el banco.",
      "Bajar la barra con control hacia la parte baja de los pectorales, antebrazos verticales.",
      "Empujar la barra hacia arriba y ligeramente hacia atrás.",
    ],
    mistakes: [
      "Hacer rebotar la barra en el pecho.",
      "Codos totalmente abiertos a 90° del cuerpo (hombros expuestos).",
      "Glúteos que se despegan del banco.",
      "Cargar pesado a solas sin topes ni nadie que asista.",
    ],
  },
  "incline-bench-press": {
    name: "Press de banca inclinado",
    cues: [
      "Banco con una inclinación moderada (unos 30°).",
      "Mismas reglas que en el press de banca: escápulas juntas, pies firmes.",
      "Barra que baja hacia la parte alta del pecho.",
    ],
    mistakes: [
      "Banco demasiado vertical: el ejercicio se convierte en un press militar.",
      "Carga demasiado pesada para mantener el control.",
    ],
  },
  "overhead-press": {
    name: "Press militar de pie",
    cues: [
      "Barra que parte de las clavículas, manos algo más abiertas que los hombros.",
      "Glúteos y abdominales apretados: el cuerpo forma un bloque.",
      "Retrasar la cabeza para dejar pasar la barra y luego meter la cabeza bajo la barra arriba.",
    ],
    mistakes: [
      "Arquear la zona lumbar para empujar.",
      "Empujar la barra hacia delante en lugar de subirla en vertical.",
      "Ayudarse con las piernas sin querer.",
    ],
  },
  deadlift: {
    name: "Peso muerto",
    cues: [
      "Barra sobre la mitad del pie, tibias casi pegadas a la barra.",
      "Espalda recta y bloqueada, hombros ligeramente por delante de la barra, brazos estirados.",
      "Empujar el suelo con las piernas; la barra roza las piernas al subir.",
      "Terminar de pie, caderas extendidas, sin echarse hacia atrás.",
      "Con discos bumper, se puede soltar la barra con decisión sobre las losetas.",
    ],
    mistakes: [
      "Espalda que se redondea, sobre todo al final de la serie.",
      "Barra que se aleja de las piernas.",
      "Caderas que suben antes que los hombros.",
      "Hiperextensión de la espalda al final del movimiento.",
    ],
  },
  "romanian-deadlift": {
    name: "Peso muerto rumano",
    cues: [
      "Empezar de pie, rodillas ligeramente flexionadas y fijas.",
      "Llevar los glúteos hacia atrás; la barra se desliza a lo largo de los muslos.",
      "Bajar mientras la espalda siga recta, notando el estiramiento de los isquiotibiales.",
    ],
    mistakes: [
      "Redondear la espalda para bajar más.",
      "Flexionar las rodillas como en una sentadilla.",
      "Barra que se aleja de las piernas.",
    ],
  },
  "power-clean": {
    name: "Power clean (cargada de potencia)",
    cues: [
      "Posición de salida del peso muerto, espalda recta.",
      "Subir la barra pegada al cuerpo y luego extender las caderas de forma explosiva.",
      "Meter rápido los codos bajo la barra y recibirla sobre los hombros, piernas ligeramente flexionadas.",
      "Aprender primero con la barra vacía o con cargas ligeras.",
    ],
    mistakes: [
      "Tirar con los brazos en lugar de con las piernas y las caderas.",
      "Barra que se va lejos por delante del cuerpo.",
      "Recibir la barra con los codos bajos, sobre las muñecas.",
    ],
  },
  thruster: {
    name: "Thruster",
    cues: [
      "Sentadilla frontal encadenada con un press por encima de la cabeza, en un solo movimiento.",
      "El impulso de las piernas lanza la barra hacia arriba.",
      "Codos altos abajo en la sentadilla, brazos estirados al final del movimiento.",
    ],
    mistakes: [
      "Empujar solo con los brazos, sin usar las piernas.",
      "Sentadilla demasiado corta por la fatiga.",
      "Arquear la espalda arriba.",
    ],
  },
  "pull-up": {
    name: "Dominada",
    cues: [
      "Empezar con los brazos estirados y los hombros activos (no colgados hasta las orejas).",
      "Llevar los codos hacia las caderas hasta pasar la barbilla por encima de la barra.",
      "Bajar con control.",
      "Una banda elástica bajo los pies o las rodillas ayuda a hacer repeticiones completas.",
    ],
    mistakes: [
      "Medias repeticiones sin estirar los brazos abajo.",
      "Balancearse para subir (salvo en kipping voluntario y controlado).",
      "Estirar el cuello hacia la barra en lugar de subir el cuerpo.",
    ],
  },
  dips: {
    name: "Fondos (dips)",
    cues: [
      "Brazos estirados, hombros abajo, tronco ligeramente inclinado hacia delante.",
      "Bajar hasta que los codos estén a unos 90°, sin forzar más allá.",
      "Empujar hasta estirar los brazos.",
    ],
    mistakes: [
      "Bajar demasiado, con los hombros que ruedan hacia delante.",
      "Dejarse caer en lugar de controlar la bajada.",
    ],
  },
  "push-up": {
    name: "Flexión",
    cues: [
      "Manos algo más abiertas que los hombros, cuerpo alineado de la cabeza a los talones.",
      "Codos a unos 45° del cuerpo.",
      "Pecho hasta el suelo y luego empujar hasta estirar los brazos.",
      "Más fácil: manos sobre el cajón; más difícil: pies sobre el cajón.",
    ],
    mistakes: [
      "Caderas que se hunden o que suben.",
      "Recorrido incompleto.",
    ],
  },
  "seated-cable-row": {
    name: "Remo horizontal en polea baja",
    cues: [
      "Sentado o de pie frente a la polea baja, maneral de agarre neutro, espalda recta.",
      "Tirar del maneral hacia el ombligo juntando las escápulas.",
      "Volver despacio hasta estirar los brazos, sin redondear la espalda.",
    ],
    mistakes: [
      "Tirar echando el tronco hacia atrás.",
      "Encoger los hombros.",
    ],
  },
  "single-arm-cable-row": {
    name: "Remo a una mano en polea baja",
    cues: [
      "Maneral simple en la polea baja, un pie adelantado, la mano libre apoyada en el muslo.",
      "Llevar el codo hacia la cadera juntando la escápula, sin girar el tronco.",
      "Volver despacio hasta estirar el brazo, con el hombro que se estira hacia delante.",
      "Empezar por el brazo más débil y hacer el mismo número de repeticiones con cada lado.",
    ],
    mistakes: [
      "Girar el tronco para tirar más peso.",
      "Subir el hombro hacia la oreja.",
    ],
  },
  "lat-pulldown": {
    name: "Jalón al pecho en polea alta",
    cues: [
      "Barra larga, manos algo más abiertas que los hombros.",
      "Llevar la barra hacia la parte alta del pecho, codos hacia abajo.",
      "Tronco ligeramente inclinado hacia atrás, sin balancearse.",
    ],
    mistakes: [
      "Llevar la barra detrás de la nuca.",
      "Echarse hacia atrás para tirar más peso.",
      "Dejar subir la barra sin control.",
    ],
  },
  "triceps-pushdown": {
    name: "Extensión de tríceps en polea (cuerda)",
    cues: [
      "Cuerda de tríceps o barra recta corta en la polea alta, codos pegados al cuerpo.",
      "Empujar hacia abajo hasta estirar los brazos, separando la cuerda al final del movimiento.",
      "Solo se mueven los antebrazos.",
    ],
    mistakes: [
      "Codos que van hacia delante y hacia atrás.",
      "Inclinarse sobre la cuerda para empujar con el peso del cuerpo.",
    ],
  },
  "cable-curl": {
    name: "Curl de bíceps en polea baja",
    cues: [
      "De pie frente a la polea baja, barra recta corta o cuerda, codos pegados al cuerpo.",
      "Subir las manos hacia los hombros sin adelantar los codos, bajar despacio hasta estirar los brazos.",
      "La polea mantiene la tensión durante todo el movimiento, y la carga se ajusta kilo a kilo con los discos de hierro.",
      "Con la cuerda, pulgares hacia arriba (curl martillo): el antebrazo también trabaja.",
    ],
    mistakes: [
      "Balancear el tronco hacia atrás para subir la carga.",
      "Codos que avanzan: los hombros toman el relevo.",
      "Ponerse demasiado cerca de la polea: retroceder un paso para mantener el cable tenso abajo.",
    ],
  },
  "face-pull": {
    name: "Face pull (jalón a la cara)",
    cues: [
      "Cuerda en la polea alta, a la altura de la cara.",
      "Llevar la cuerda hacia la frente separando las manos, codos altos.",
      "Terminar con los pulgares hacia atrás, escápulas juntas. Carga ligera.",
    ],
    mistakes: [
      "Carga demasiado pesada: el tronco se va hacia atrás.",
      "Codos que caen: el ejercicio se convierte en un remo clásico.",
    ],
  },
  "band-external-rotation": {
    name: "Rotación externa con banda elástica",
    cues: [
      "Banda enganchada a la jaula a la altura del codo, codo pegado al cuerpo y flexionado a 90°.",
      "Girar el antebrazo hacia fuera sin despegar el codo.",
      "Movimiento lento, banda ligera, de 15 a 20 repeticiones.",
    ],
    mistakes: [
      "Banda demasiado dura.",
      "Codo que se despega del cuerpo.",
    ],
  },
  "walking-lunge": {
    name: "Zancadas caminando",
    cues: [
      "Paso largo hacia delante, bajar hasta que la rodilla de atrás roce el suelo.",
      "Rodilla delantera alineada con el pie, tronco recto.",
      "Empujar con el talón delantero para encadenar el paso siguiente.",
    ],
    mistakes: [
      "Paso demasiado corto: la rodilla delantera sobrepasa con creces la punta del pie.",
      "Rodilla delantera que se va hacia dentro.",
      "Golpear el suelo con la rodilla de atrás.",
    ],
  },
  "lateral-lunge": {
    name: "Zancada lateral",
    cues: [
      "Paso largo hacia un lado, sentarse sobre la pierna que se flexiona; la otra se queda estirada.",
      "Pies paralelos, rodilla flexionada alineada con el pie.",
      "Empujar para volver al centro.",
    ],
    mistakes: [
      "Talón que se levanta en el lado flexionado.",
      "Espalda que se redondea.",
    ],
  },
  "step-up": {
    name: "Step-up al cajón",
    cues: [
      "Pie entero apoyado en el cajón, subir empujando solo con esa pierna.",
      "Altura del cajón que deje la rodilla un poco por encima de la cadera, no más.",
      "Bajar con control.",
    ],
    mistakes: [
      "Impulsarse con la pierna que se queda en el suelo.",
      "Cajón demasiado alto.",
    ],
  },
  "hip-thrust": {
    name: "Hip thrust",
    cues: [
      "Parte alta de la espalda apoyada en el banco, barra sobre el pliegue de la cadera, protegida con la funda.",
      "Subir las caderas hasta alinear hombros, caderas y rodillas, apretando los glúteos.",
      "Barbilla recogida, costillas abajo.",
    ],
    mistakes: [
      "Arquear la zona lumbar arriba en lugar de apretar los glúteos.",
      "Pies demasiado lejos o demasiado cerca.",
    ],
  },
  "calf-raise": {
    name: "Elevación de gemelos de pie",
    cues: [
      "Subir lo más alto posible de puntillas y mantener un segundo.",
      "Bajar despacio, con los talones por debajo de la punta si se está sobre un disco.",
    ],
    mistakes: [
      "Rebotar sin recorrido.",
      "Flexionar las rodillas para ayudarse.",
    ],
  },
  "medicine-ball-thruster": {
    name: "Thruster con balón medicinal",
    cues: [
      "Balón medicinal de 6 kg sujeto con las dos manos contra el pecho, codos bajo el balón.",
      "Sentadilla completa y luego subir empujando el balón por encima de la cabeza, brazos estirados, en un solo movimiento.",
      "El impulso de las piernas hace subir el balón; devolver el balón al pecho al bajar.",
      "El balón no se suelta: en la sala no se lanza ni al techo ni contra las paredes.",
    ],
    mistakes: [
      "Empujar solo con los brazos, sin el impulso de las piernas.",
      "Sentadilla demasiado corta por la fatiga.",
      "Arquear la espalda, con el balón por detrás de la cabeza, al final del movimiento.",
    ],
  },
  "box-jump": {
    name: "Box jump",
    cues: [
      "Empezar bajo (20 a 30 cm) y subir la altura poco a poco.",
      "Saltar con los dos pies y aterrizar con el pie entero, rodillas alineadas, con suavidad.",
      "Ponerse completamente de pie sobre el cajón y luego bajar caminando.",
    ],
    mistakes: [
      "Cajón demasiado alto: aterrizaje en sentadilla profunda, riesgo de caída.",
      "Bajar saltando hacia atrás con la fatiga (tendones de Aquiles).",
      "Rodillas que se van hacia dentro al aterrizar.",
    ],
  },
  "jump-rope": {
    name: "Comba",
    cues: [
      "Saltos cortos sobre la parte delantera del pie, rodillas flexibles.",
      "La comba gira con las muñecas, codos cerca del cuerpo.",
      "Empezar con series cortas.",
    ],
    mistakes: [
      "Saltar demasiado alto.",
      "Hacer girar la comba con los brazos.",
    ],
  },
  rowing: {
    name: "Remo ergómetro (Concept2)",
    cues: [
      "Orden del empuje: piernas, luego tronco, luego brazos; a la vuelta: brazos, tronco, piernas.",
      "La fuerza sale sobre todo de las piernas.",
      "Espalda recta, hombros abajo, maneral llevado hacia la parte baja de las costillas.",
      "Ajuste de resistencia (damper) entre 3 y 5 para la mayoría de las sesiones.",
    ],
    mistakes: [
      "Tirar con los brazos antes de haber empujado con las piernas.",
      "Damper al máximo pensando que se trabaja más.",
      "Espalda redondeada, hombros encogidos.",
    ],
  },
  plank: {
    name: "Plancha (core frontal)",
    cues: [
      "Apoyado sobre los antebrazos, codos bajo los hombros.",
      "Cuerpo alineado, glúteos y abdominales apretados.",
      "Respirar con normalidad.",
    ],
    mistakes: [
      "Caderas que se hunden o que suben.",
      "Bloquear la respiración.",
    ],
  },
  "side-plank": {
    name: "Plancha lateral",
    cues: [
      "Codo bajo el hombro, cuerpo alineado de perfil.",
      "Caderas altas, sin girar el tronco.",
    ],
    mistakes: [
      "Cadera que cae.",
      "Hombro que se hunde en el apoyo.",
    ],
  },
  "copenhagen-plank": {
    name: "Plancha Copenhague (aductores)",
    cues: [
      "Plancha lateral con la pierna de arriba apoyada en el banco: la rodilla sobre el banco para empezar, el pie para progresar.",
      "La pierna de abajo queda libre o levantada.",
      "Cuerpo alineado, tiempos cortos al principio (10 a 20 segundos).",
    ],
    mistakes: [
      "Empezar apoyando el pie: demasiado duro para el aductor al principio.",
      "Cadera que cae.",
    ],
  },
  "dead-bug": {
    name: "Dead bug",
    cues: [
      "Boca arriba, brazos estirados hacia el techo, rodillas a 90°.",
      "Zona lumbar pegada al suelo durante todo el ejercicio.",
      "Estirar despacio un brazo y la pierna contraria, volver y cambiar de lado.",
    ],
    mistakes: [
      "Zona lumbar que se despega.",
      "Ir demasiado rápido.",
    ],
  },
  "pallof-press": {
    name: "Pallof press (core antirrotación)",
    cues: [
      "De perfil respecto a la polea ajustada a la altura del pecho, maneral simple sujeto con las dos manos.",
      "Estirar los brazos al frente y mantener dos segundos sin dejar que el tronco gire.",
      "Pies a la anchura de los hombros, rodillas ligeramente flexionadas.",
    ],
    mistakes: [
      "Carga demasiado pesada: el tronco gira hacia la polea.",
      "Inclinarse para resistir.",
    ],
  },
  "farmer-walk": {
    name: "Paseo del granjero",
    cues: [
      "Una mancuerna cargada en cada mano, recogida del suelo con la espalda recta.",
      "Caminar erguido, hombros abajo, pasos cortos y regulares.",
    ],
    mistakes: [
      "Inclinarse hacia un lado.",
      "Soltar en el suelo mancuernas cargadas con discos de hierro: hay que dejarlas con cuidado.",
    ],
  },
  "neck-isometrics": {
    name: "Cuello en isometría",
    cues: [
      "Sentado o de pie, con la mano apoyada contra la frente, la nuca o el lado de la cabeza.",
      "Empujar la cabeza contra la mano sin moverse, a media fuerza aproximadamente, de 10 a 15 segundos.",
      "Progresar despacio, sin forzar nunca de golpe.",
    ],
    mistakes: [
      "Empujar al máximo desde el principio.",
      "Hacer movimientos rápidos o rotaciones con carga.",
    ],
  },
};
