/**
 * Fiches d'exercices des articles « salle de sport » : points clés, erreurs fréquentes,
 * vidéo. Une liste de clés unique ; chaque langue fournit un `Record<ExerciseKey, …>`, ce qui
 * fait échouer la compilation si une fiche manque dans une langue.
 */
export const EXERCISE_KEYS = [
  "back-squat",
  "front-squat",
  "goblet-squat",
  "bench-press",
  "incline-bench-press",
  "overhead-press",
  "deadlift",
  "romanian-deadlift",
  "power-clean",
  "thruster",
  "pull-up",
  "dips",
  "push-up",
  "seated-cable-row",
  "single-arm-cable-row",
  "lat-pulldown",
  "triceps-pushdown",
  "cable-curl",
  "face-pull",
  "band-external-rotation",
  "walking-lunge",
  "lateral-lunge",
  "step-up",
  "hip-thrust",
  "calf-raise",
  "medicine-ball-thruster",
  "box-jump",
  "jump-rope",
  "rowing",
  "plank",
  "side-plank",
  "copenhagen-plank",
  "dead-bug",
  "pallof-press",
  "farmer-walk",
  "neck-isometrics",
] as const;

export type ExerciseKey = (typeof EXERCISE_KEYS)[number];

export interface ExerciseCopy {
  /** Nom de l'exercice dans la langue de la page. */
  name: string;
  /** À faire : efficacité et sécurité. */
  cues: string[];
  /** Erreurs fréquentes. */
  mistakes: string[];
}

export type ExerciseCatalog = Record<ExerciseKey, ExerciseCopy>;

export interface ExerciseVideo {
  url: string;
  /** Langue de la vidéo (`fr` ou `en`) : une vidéo dans une autre langue que la page est signalée. */
  lang: "fr" | "en";
}
