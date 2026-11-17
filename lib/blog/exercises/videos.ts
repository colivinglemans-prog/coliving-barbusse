import type { ExerciseKey } from "./types";

/**
 * Vidéos de démonstration, une en français et une en anglais quand elles existent.
 * Toutes vérifiées le 2026-11-17 par l'oEmbed de YouTube (la vidéo existe et s'intègre).
 * Les pages en italien, allemand et espagnol affichent la vidéo anglaise, signalée comme telle.
 * Pas de vidéo : l'exercice s'affiche sans lien plutôt qu'avec un lien non vérifié.
 */
export const EXERCISE_VIDEOS: Partial<Record<ExerciseKey, { fr?: string; en?: string }>> = {
  "back-squat": {
    fr: "https://www.youtube.com/watch?v=Dr41gZwfTfM",
    en: "https://www.youtube.com/watch?v=7v_V6xiA_AA",
  },
  "front-squat": {
    fr: "https://www.youtube.com/watch?v=H_d6oaCKG0U",
    en: "https://www.youtube.com/watch?v=7pyxT5hqmQY",
  },
  "goblet-squat": {
    fr: "https://www.youtube.com/watch?v=u9xM9NQ7tNw",
    en: "https://www.youtube.com/watch?v=gCESNsDsbqk",
  },
  "bench-press": {
    fr: "https://www.youtube.com/watch?v=feWp7jZopI8",
    en: "https://www.youtube.com/watch?v=vcBig73ojpE",
  },
  "incline-bench-press": {
    fr: "https://www.youtube.com/watch?v=RQ7U42i2DH4",
    en: "https://www.youtube.com/watch?v=SrqOu55lrYU",
  },
  "overhead-press": {
    fr: "https://www.youtube.com/watch?v=WmwFNLeuHd8",
    en: "https://www.youtube.com/watch?v=wol7Hko8RhY",
  },
  deadlift: {
    fr: "https://www.youtube.com/watch?v=gNdZuaYZz7E",
    en: "https://www.youtube.com/watch?v=p2OPUi4xGrM",
  },
  "romanian-deadlift": {
    fr: "https://www.youtube.com/watch?v=83MFpxS0778",
    en: "https://www.youtube.com/watch?v=_oyxCn2iSjU",
  },
  "power-clean": {
    fr: "https://www.youtube.com/watch?v=isIkJbkbyQU",
    en: "https://www.youtube.com/watch?v=0aP3tgKZcHQ",
  },
  "pull-up": {
    fr: "https://www.youtube.com/watch?v=b6KgEsSnhaY",
    en: "https://www.youtube.com/watch?v=eGo4IYlbE5g",
  },
  dips: {
    fr: "https://www.youtube.com/watch?v=Dbih-r0vMmw",
    en: "https://www.youtube.com/watch?v=yN6Q1UI_xkE",
  },
  "push-up": {
    fr: "https://www.youtube.com/watch?v=jgJHg3rAOVg",
    en: "https://www.youtube.com/watch?v=IODxDxX7oi4",
  },
  "seated-cable-row": {
    fr: "https://www.youtube.com/watch?v=w2Q7LbkhtLI",
    en: "https://www.youtube.com/watch?v=vwHG9Jfu4sw",
  },
  "single-arm-cable-row": {
    fr: "https://www.youtube.com/watch?v=5DGxizj5fnY",
    en: "https://www.youtube.com/watch?v=NwyhyKyFgf4",
  },
  "lat-pulldown": {
    fr: "https://www.youtube.com/watch?v=QCt8kf-4imI",
    en: "https://www.youtube.com/watch?v=SALxEARiMkw",
  },
  "triceps-pushdown": {
    fr: "https://www.youtube.com/watch?v=ADRve8qqC1U",
    en: "https://www.youtube.com/watch?v=kiuVA0gs3EI",
  },
  "face-pull": {
    fr: "https://www.youtube.com/watch?v=kzGT_XjDqY8",
    en: "https://www.youtube.com/watch?v=eFxMixk_qPQ",
  },
  "band-external-rotation": {
    fr: "https://www.youtube.com/watch?v=kINm0qxgSTE",
    en: "https://www.youtube.com/watch?v=y8WKcz0vqzg",
  },
  "walking-lunge": {
    fr: "https://www.youtube.com/watch?v=T7j9efz104k",
    en: "https://www.youtube.com/watch?v=Pbmj6xPo-Hw",
  },
  "step-up": {
    fr: "https://www.youtube.com/watch?v=6yF-VaStT_E",
    en: "https://www.youtube.com/watch?v=vs87hPGdnCc",
  },
  "hip-thrust": {
    fr: "https://www.youtube.com/watch?v=IMPB5EMTcqI",
    en: "https://www.youtube.com/watch?v=LM8XHLYJoYs",
  },
  "calf-raise": {
    fr: "https://www.youtube.com/watch?v=jevKoGaDpLQ",
    en: "https://www.youtube.com/watch?v=k8ipHzKeAkQ",
  },
  "medicine-ball-thruster": {
    en: "https://www.youtube.com/watch?v=RnguPxo2Pt8",
  },
  "box-jump": {
    fr: "https://www.youtube.com/watch?v=hLFw24pSiog",
    en: "https://www.youtube.com/watch?v=NBY9-kTuHEk",
  },
  "jump-rope": {
    fr: "https://www.youtube.com/watch?v=Xs7WRkXECJ4",
    en: "https://www.youtube.com/watch?v=kDOGb9C5kp0",
  },
  rowing: {
    fr: "https://www.youtube.com/watch?v=iaDN7GcK9vY",
    en: "https://www.youtube.com/watch?v=4zWu1yuJ0_g",
  },
  plank: {
    fr: "https://www.youtube.com/watch?v=mzr_rCdiDLU",
    en: "https://www.youtube.com/watch?v=6LqqeBtFn9M",
  },
  "side-plank": {
    fr: "https://www.youtube.com/watch?v=hAWS7C17uJY",
    en: "https://www.youtube.com/watch?v=N_s9em1xTqU",
  },
  "copenhagen-plank": {
    fr: "https://www.youtube.com/watch?v=-l0hvf5Oduk",
    en: "https://www.youtube.com/watch?v=YRRnnZsRs9U",
  },
  "dead-bug": {
    fr: "https://www.youtube.com/watch?v=H5Wy9OlBrs0",
    en: "https://www.youtube.com/watch?v=GbSC02oU3To",
  },
  "pallof-press": {
    fr: "https://www.youtube.com/watch?v=Pz95Wgyt9MA",
    en: "https://www.youtube.com/watch?v=5_8d8vHgZvU",
  },
  "farmer-walk": {
    fr: "https://www.youtube.com/watch?v=j6U2zZsn45A",
    en: "https://www.youtube.com/watch?v=NH7Xv-7NQNQ",
  },
  "cable-curl": {
    fr: "https://www.youtube.com/watch?v=Pc5J9-Y518w",
    en: "https://www.youtube.com/watch?v=Qt-NixlIVGM",
  },
  thruster: {
    fr: "https://www.youtube.com/watch?v=ubzAADZyY70",
    en: "https://www.youtube.com/watch?v=L219ltL15zk",
  },
  "lateral-lunge": {
    fr: "https://www.youtube.com/watch?v=3EvkUQHvFkI",
    en: "https://www.youtube.com/watch?v=Vx6mQXEj8kw",
  },
};

/**
 * Photos de la cage de la maison (même modèle) montrant l'exercice : photos du fabricant et du
 * vendeur, utilisées par décision de l'hôte (2026-11-17), créditées sous l'image.
 */
export const EXERCISE_IMAGES: Partial<
  Record<ExerciseKey, { src: string; width: number; height: number; credit: "fabricant" | "maison" }>
> = {
  "lat-pulldown": { src: "/images/blog/salle-de-sport/cage-tirage-vertical.jpg", width: 1426, height: 1500, credit: "fabricant" },
  "pull-up": { src: "/images/blog/salle-de-sport/cage-tractions.jpg", width: 1440, height: 1500, credit: "fabricant" },
  "seated-cable-row": { src: "/images/blog/salle-de-sport/cage-tirage-horizontal.jpg", width: 1481, height: 1500, credit: "fabricant" },
  dips: { src: "/images/blog/salle-de-sport/cage-dips.jpg", width: 1500, height: 1491, credit: "fabricant" },
  "back-squat": { src: "/images/blog/salle-de-sport/cage-squat-maison.jpg", width: 1920, height: 1280, credit: "maison" },
};
