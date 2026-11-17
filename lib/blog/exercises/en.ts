import type { ExerciseCatalog } from "./types";

export const EXERCISES_EN: ExerciseCatalog = {
  "back-squat": {
    name: "Back squat",
    cues: [
      "Bar resting on your upper back, not on your neck; tight grip, elbows under the bar.",
      "Feet shoulder-width apart, toes slightly turned out; knees tracking over your feet.",
      "Breathe in and brace before you go down, chest up, eyes straight ahead.",
      "Go down at least until your thighs are parallel to the floor if your mobility allows, and drive back up by pushing the floor away.",
      "Set the rack's safety bars just below your bottom position.",
    ],
    mistakes: [
      "Knees caving inwards on the way up.",
      "Heels lifting or weight shifting onto your toes.",
      "Back rounding at the bottom, for lack of bracing or mobility.",
      "Adding weight too quickly at the expense of depth.",
    ],
  },
  "front-squat": {
    name: "Front squat",
    cues: [
      "Bar resting on the front of your shoulders, elbows high, fingers under the bar without gripping it.",
      "Torso as upright as possible throughout the descent.",
      "Knees free to travel forwards, tracking over your feet.",
    ],
    mistakes: [
      "Elbows dropping: the bar rolls forwards.",
      "Loading as heavy as for the back squat.",
      "Holding the bar in your hands instead of on your shoulders.",
    ],
  },
  "goblet-squat": {
    name: "Goblet squat",
    cues: [
      "A 5 or 10 kg bumper plate held in both hands against your chest, or a dumbbell held vertically, elbows under the weight.",
      "The bumper is ready straight away, with no dumbbell to load: handy when several people are training at the same time.",
      "Sit down between your knees, torso upright, heels on the floor.",
      "Ideal for learning the squat or for warming up.",
    ],
    mistakes: [
      "The weight drifting away from your chest and pulling your torso forwards.",
      "Not going deep enough.",
    ],
  },
  "bench-press": {
    name: "Bench press",
    cues: [
      "In the rack, with the safety bars set just above your chest, or with a spotter.",
      "Shoulder blades squeezed together and down, feet firmly planted, glutes on the bench.",
      "Lower the bar under control towards your lower chest, forearms vertical.",
      "Press the bar up and slightly back.",
    ],
    mistakes: [
      "Bouncing the bar off your chest.",
      "Elbows flared out at 90° from your body (shoulders exposed).",
      "Glutes lifting off the bench.",
      "Going heavy alone with no safety bars or spotter.",
    ],
  },
  "incline-bench-press": {
    name: "Incline bench press",
    cues: [
      "Bench at a moderate incline (around 30°).",
      "Same rules as the bench press: shoulder blades squeezed, feet planted.",
      "Bar comes down towards your upper chest.",
    ],
    mistakes: [
      "Bench too upright: the exercise turns into an overhead press.",
      "Weight too heavy to stay in control.",
    ],
  },
  "overhead-press": {
    name: "Standing overhead press",
    cues: [
      "Bar starting from your collarbones, hands slightly wider than your shoulders.",
      "Glutes and abs tight: your body moves as one block.",
      "Pull your head back to let the bar past, then bring your head through under the bar at the top.",
    ],
    mistakes: [
      "Arching your lower back to push.",
      "Pressing the bar out in front of you instead of straight up.",
      "Using your legs without meaning to.",
    ],
  },
  deadlift: {
    name: "Deadlift",
    cues: [
      "Bar over the middle of your foot, shins almost touching the bar.",
      "Back flat and braced, shoulders slightly in front of the bar, arms straight.",
      "Push the floor away with your legs, the bar brushing your legs on the way up.",
      "Finish standing tall, hips locked out, without leaning back.",
      "With bumper plates, you can set the bar down firmly on the tiles.",
    ],
    mistakes: [
      "Back rounding, especially at the end of a set.",
      "Bar drifting away from your legs.",
      "Hips rising before your shoulders.",
      "Hyperextending your back at the top of the lift.",
    ],
  },
  "romanian-deadlift": {
    name: "Romanian deadlift",
    cues: [
      "Start standing, knees slightly bent and fixed.",
      "Push your hips back, the bar sliding down your thighs.",
      "Go down as long as your back stays flat, feeling the stretch in your hamstrings.",
    ],
    mistakes: [
      "Rounding your back to go lower.",
      "Bending your knees as in a squat.",
      "Bar drifting away from your legs.",
    ],
  },
  "power-clean": {
    name: "Power clean",
    cues: [
      "Deadlift starting position, back flat.",
      "Bring the bar up close to your body, then explosively extend your hips.",
      "Get your elbows under the bar fast and catch it on your shoulders, legs slightly bent.",
      "Learn it first with an empty bar or light weights.",
    ],
    mistakes: [
      "Pulling with your arms instead of your legs and hips.",
      "Bar swinging far out in front of your body.",
      "Catching the bar with low elbows, on your wrists.",
    ],
  },
  thruster: {
    name: "Thruster",
    cues: [
      "A front squat flowing into an overhead press, in one single movement.",
      "The drive from your legs launches the bar upwards.",
      "Elbows high at the bottom of the squat, arms locked out at the end of the movement.",
    ],
    mistakes: [
      "Pressing with your arms alone, without using your legs.",
      "Squat getting shallower as you tire.",
      "Arching your back at the top.",
    ],
  },
  "pull-up": {
    name: "Pull-up",
    cues: [
      "Start from straight arms, shoulders engaged (not hanging up by your ears).",
      "Drive your elbows towards your hips until your chin is over the bar.",
      "Lower yourself under control.",
      "A resistance band looped under your feet or knees helps you do full reps.",
    ],
    mistakes: [
      "Half reps without straightening your arms at the bottom.",
      "Swinging to get up (unless it's deliberate, controlled kipping).",
      "Craning your neck towards the bar instead of lifting your body.",
    ],
  },
  dips: {
    name: "Dips",
    cues: [
      "Arms straight, shoulders down, torso leaning slightly forwards.",
      "Go down until your elbows are at about 90°, without forcing any further.",
      "Push back up to straight arms.",
    ],
    mistakes: [
      "Going too low, shoulders rolling forwards.",
      "Dropping down instead of controlling the descent.",
    ],
  },
  "push-up": {
    name: "Push-up",
    cues: [
      "Hands slightly wider than your shoulders, body in a straight line from head to heels.",
      "Elbows at about 45° from your body.",
      "Chest to the floor, then push up to straight arms.",
      "Easier: hands on the box; harder: feet on the box.",
    ],
    mistakes: [
      "Hips sagging or piking up.",
      "Short range of motion.",
    ],
  },
  "seated-cable-row": {
    name: "Seated cable row (low pulley)",
    cues: [
      "Sitting or standing facing the low pulley, neutral-grip row handle, back straight.",
      "Pull the handle towards your navel, squeezing your shoulder blades together.",
      "Return slowly to straight arms, without rounding your back.",
    ],
    mistakes: [
      "Pulling by rocking your torso backwards.",
      "Shrugging your shoulders.",
    ],
  },
  "single-arm-cable-row": {
    name: "Single-arm cable row (low pulley)",
    cues: [
      "Single handle on the low pulley, one foot forward, your free hand resting on your thigh.",
      "Drive your elbow towards your hip, squeezing your shoulder blade, without twisting your torso.",
      "Return slowly to a straight arm, letting your shoulder stretch forwards.",
      "Start with your weaker arm, and do the same number of reps on each side.",
    ],
    mistakes: [
      "Twisting your torso to pull heavier.",
      "Shrugging your shoulder up towards your ear.",
    ],
  },
  "lat-pulldown": {
    name: "Lat pulldown (high pulley)",
    cues: [
      "Wide bar, hands slightly wider than your shoulders.",
      "Pull the bar to your upper chest, elbows driving down.",
      "Torso leaning back slightly, without swinging.",
    ],
    mistakes: [
      "Pulling the bar behind your neck.",
      "Throwing yourself back to pull heavier.",
      "Letting the bar fly back up without control.",
    ],
  },
  "triceps-pushdown": {
    name: "Cable triceps pushdown (rope)",
    cues: [
      "Triceps rope or short straight bar on the high pulley, elbows tucked into your sides.",
      "Push down to straight arms, spreading the rope apart at the end of the movement.",
      "Only your forearms move.",
    ],
    mistakes: [
      "Elbows drifting forwards and back.",
      "Leaning over the rope to push with your bodyweight.",
    ],
  },
  "cable-curl": {
    name: "Cable biceps curl (low pulley)",
    cues: [
      "Standing facing the low pulley, short straight bar or rope, elbows tucked into your sides.",
      "Bring your hands up towards your shoulders without moving your elbows forwards, then lower slowly to straight arms.",
      "The pulley keeps tension throughout the movement, and the cast-iron plates let you adjust the weight to the nearest kilo.",
      "With the rope, thumbs up (hammer curl): your forearms work too.",
    ],
    mistakes: [
      "Swinging your torso back to lift the weight.",
      "Elbows moving forwards: your shoulders take over.",
      "Standing too close to the pulley: take a step back to keep the cable taut at the bottom.",
    ],
  },
  "face-pull": {
    name: "Face pull",
    cues: [
      "Rope on the high pulley, at face height.",
      "Pull the rope towards your forehead, spreading your hands apart, elbows high.",
      "Finish with your thumbs pointing back, shoulder blades squeezed. Light weight.",
    ],
    mistakes: [
      "Weight too heavy: your torso leans back.",
      "Elbows dropping: the exercise turns into a standard row.",
    ],
  },
  "band-external-rotation": {
    name: "Band external rotation",
    cues: [
      "Band attached to the rack at elbow height, elbow tucked into your side, bent at 90°.",
      "Rotate your forearm outwards without your elbow leaving your side.",
      "Slow movement, light band, 15 to 20 reps.",
    ],
    mistakes: [
      "Band too strong.",
      "Elbow coming away from your body.",
    ],
  },
  "walking-lunge": {
    name: "Walking lunges",
    cues: [
      "Take a big step forward and go down until your back knee nearly touches the floor.",
      "Front knee tracking over your foot, torso upright.",
      "Push through your front heel to move into the next step.",
    ],
    mistakes: [
      "Step too short: your front knee goes well past your toes.",
      "Front knee caving inwards.",
      "Banging your back knee on the floor.",
    ],
  },
  "lateral-lunge": {
    name: "Lateral lunge",
    cues: [
      "Take a big step to the side and sit into the bending leg, the other leg staying straight.",
      "Feet parallel, bent knee tracking over your foot.",
      "Push back to the centre.",
    ],
    mistakes: [
      "Heel lifting on the bent side.",
      "Back rounding.",
    ],
  },
  "step-up": {
    name: "Box step-up",
    cues: [
      "Whole foot on the box, step up by pushing through that leg only.",
      "A box height that puts your knee slightly above your hip, no more.",
      "Step back down under control.",
    ],
    mistakes: [
      "Pushing off with the leg left on the floor.",
      "Box too high.",
    ],
  },
  "hip-thrust": {
    name: "Hip thrust",
    cues: [
      "Upper back resting against the bench, bar in the crease of your hips, protected by the pad.",
      "Drive your hips up until your shoulders, hips and knees are in line, squeezing your glutes.",
      "Chin tucked, ribs down.",
    ],
    mistakes: [
      "Arching your lower back at the top instead of squeezing your glutes.",
      "Feet too far away or too close.",
    ],
  },
  "calf-raise": {
    name: "Standing calf raise",
    cues: [
      "Rise as high as you can onto your toes and hold for a second.",
      "Lower slowly, heels dropping below your toes if you are standing on a plate.",
    ],
    mistakes: [
      "Bouncing with no range of motion.",
      "Bending your knees to help.",
    ],
  },
  "medicine-ball-thruster": {
    name: "Medicine ball thruster",
    cues: [
      "6 kg medicine ball held in both hands against your chest, elbows under the ball.",
      "Full squat, then drive up pushing the ball overhead to straight arms, in one movement.",
      "The drive from your legs sends the ball up; bring the ball back to your chest as you go down.",
      "Don't let go of the ball: in the gym, it is never thrown at the ceiling or against the walls.",
    ],
    mistakes: [
      "Pushing with your arms alone, without the drive from your legs.",
      "Squat getting shallower as you tire.",
      "Arching your back, ball behind your head, at the end of the movement.",
    ],
  },
  "box-jump": {
    name: "Box jump",
    cues: [
      "Start low (20 to 30 cm) and raise the height gradually.",
      "Jump off both feet and land softly with your whole foot, knees tracking over your feet.",
      "Stand up fully on the box, then step back down.",
    ],
    mistakes: [
      "Box too high: you land in a deep squat and risk falling.",
      "Jumping back down off the box when tired (Achilles tendons).",
      "Knees caving in on landing.",
    ],
  },
  "jump-rope": {
    name: "Jump rope",
    cues: [
      "Small jumps on the balls of your feet, knees soft.",
      "The rope turns with your wrists, elbows close to your body.",
      "Start with short sets.",
    ],
    mistakes: [
      "Jumping too high.",
      "Turning the rope with your arms.",
    ],
  },
  rowing: {
    name: "Rowing machine (Concept2)",
    cues: [
      "Order of the drive: legs, then torso, then arms; on the recovery: arms, torso, legs.",
      "The power comes mostly from your legs.",
      "Back straight, shoulders down, handle pulled to your lower ribs.",
      "Resistance setting (damper) between 3 and 5 for most sessions.",
    ],
    mistakes: [
      "Pulling with your arms before driving with your legs.",
      "Damper on maximum, thinking you are working harder.",
      "Rounded back, shoulders shrugged.",
    ],
  },
  plank: {
    name: "Plank",
    cues: [
      "Resting on your forearms, elbows under your shoulders.",
      "Body in a straight line, glutes and abs tight.",
      "Breathe normally.",
    ],
    mistakes: [
      "Hips sagging or piking up.",
      "Holding your breath.",
    ],
  },
  "side-plank": {
    name: "Side plank",
    cues: [
      "Elbow under your shoulder, body in a straight line, side-on.",
      "Hips high, don't let your torso rotate.",
    ],
    mistakes: [
      "Hip dropping.",
      "Shoulder sagging into the support.",
    ],
  },
  "copenhagen-plank": {
    name: "Copenhagen plank (adductors)",
    cues: [
      "Side plank with your top leg resting on the bench: knee on the bench to start, foot to progress.",
      "Your bottom leg stays free or lifted.",
      "Body in a straight line, short holds to begin with (10 to 20 seconds).",
    ],
    mistakes: [
      "Starting with your foot on the bench: too hard for the adductor at first.",
      "Hip dropping.",
    ],
  },
  "dead-bug": {
    name: "Dead bug",
    cues: [
      "On your back, arms reaching up to the ceiling, knees at 90°.",
      "Lower back pressed into the floor throughout the exercise.",
      "Slowly extend one arm and the opposite leg, return, switch sides.",
    ],
    mistakes: [
      "Lower back lifting off the floor.",
      "Going too fast.",
    ],
  },
  "pallof-press": {
    name: "Pallof press (anti-rotation core)",
    cues: [
      "Side-on to the pulley set at chest height, single handle held in both hands.",
      "Press your arms out in front of you and hold for two seconds without letting your torso rotate.",
      "Feet shoulder-width apart, knees slightly bent.",
    ],
    mistakes: [
      "Weight too heavy: your torso rotates towards the pulley.",
      "Leaning away to resist.",
    ],
  },
  "farmer-walk": {
    name: "Farmer's walk",
    cues: [
      "A loaded dumbbell in each hand, picked up with a flat back.",
      "Walk tall, shoulders down, small steady steps.",
    ],
    mistakes: [
      "Leaning to one side.",
      "Dropping dumbbells loaded with cast-iron plates on the floor: set them down.",
    ],
  },
  "neck-isometrics": {
    name: "Neck isometrics",
    cues: [
      "Sitting or standing, hand placed against your forehead, the back or the side of your head.",
      "Push your head into your hand without moving, at about half effort, for 10 to 15 seconds.",
      "Progress slowly, never forcing abruptly.",
    ],
    mistakes: [
      "Pushing as hard as possible from the start.",
      "Making quick movements or rotations under load.",
    ],
  },
};
