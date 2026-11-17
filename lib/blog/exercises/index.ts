import type { Locale } from "@/lib/i18n";
import type { ExerciseCatalog } from "./types";
import { EXERCISES_FR } from "./fr";
import { EXERCISES_EN } from "./en";
import { EXERCISES_IT } from "./it";
import { EXERCISES_DE } from "./de";
import { EXERCISES_ES } from "./es";

export const EXERCISES: Record<Locale, ExerciseCatalog> = {
  fr: EXERCISES_FR,
  en: EXERCISES_EN,
  it: EXERCISES_IT,
  de: EXERCISES_DE,
  es: EXERCISES_ES,
};
