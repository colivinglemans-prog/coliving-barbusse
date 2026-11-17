import type { Locale } from "@/lib/i18n";
import { EXERCISES } from "@/lib/blog/exercises";
import Image from "next/image";
import { EXERCISE_IMAGES, EXERCISE_VIDEOS } from "@/lib/blog/exercises/videos";
import type { ExerciseKey } from "@/lib/blog/exercises/types";

/**
 * « Bien faire les exercices » en fin d'article : une fiche repliable par exercice (points
 * clés, erreurs fréquentes, vidéo). Composant serveur, sans JavaScript : `<details>` natif.
 */
const COPY: Record<
  Locale,
  { title: string; intro: string; cues: string; mistakes: string; video: string; inEnglish: string; photo: string; housePhoto: string }
> = {
  fr: {
    housePhoto: "La cage de la salle de sport de la maison",
    photo: "Photo du fabricant, même cage que celle de la maison",
    title: "Bien faire les exercices",
    intro:
      "Les points clés, les erreurs fréquentes et une vidéo de démonstration pour chaque exercice de cet article.",
    cues: "À faire",
    mistakes: "Erreurs fréquentes",
    video: "Vidéo",
    inEnglish: "en anglais",
  },
  en: {
    housePhoto: "The rack in the house gym",
    photo: "Manufacturer photo, same rack as the one in the house",
    title: "How to do the exercises",
    intro: "Key points, common mistakes and a demonstration video for each exercise in this article.",
    cues: "Key points",
    mistakes: "Common mistakes",
    video: "Video",
    inEnglish: "in English",
  },
  it: {
    housePhoto: "Il rack della palestra della casa",
    photo: "Foto del produttore, stesso rack di quello della casa",
    title: "Eseguire bene gli esercizi",
    intro:
      "I punti chiave, gli errori frequenti e un video dimostrativo per ogni esercizio di questo articolo.",
    cues: "Da fare",
    mistakes: "Errori frequenti",
    video: "Video",
    inEnglish: "in inglese",
  },
  de: {
    housePhoto: "Das Rack im Fitnessraum des Hauses",
    photo: "Herstellerfoto, dasselbe Rack wie im Haus",
    title: "Die Übungen richtig ausführen",
    intro:
      "Die wichtigsten Punkte, häufige Fehler und ein Demonstrationsvideo für jede Übung dieses Artikels.",
    cues: "Darauf achten",
    mistakes: "Häufige Fehler",
    video: "Video",
    inEnglish: "auf Englisch",
  },
  es: {
    housePhoto: "La jaula del gimnasio de la casa",
    photo: "Foto del fabricante, la misma jaula que la de la casa",
    title: "Hacer bien los ejercicios",
    intro:
      "Los puntos clave, los errores frecuentes y un vídeo de demostración para cada ejercicio de este artículo.",
    cues: "Qué hacer",
    mistakes: "Errores frecuentes",
    video: "Vídeo",
    inEnglish: "en inglés",
  },
};

/**
 * Lecteur intégré en mode « sans cookie » de YouTube (youtube-nocookie.com) : rien n'est déposé
 * tant que la vidéo n'est pas lancée. L'iframe est paresseuse et rangée dans un `<details>`
 * fermé : elle ne se charge qu'à l'ouverture de la fiche.
 */
function embedUrl(watchUrl: string): string {
  const id = new URL(watchUrl).searchParams.get("v");
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
}

export default function ExerciseGuide({ locale, ids }: { locale: Locale; ids: ExerciseKey[] }) {
  const t = COPY[locale];
  const catalog = EXERCISES[locale];
  return (
    <section className="mt-12">
      <h2>{t.title}</h2>
      <p>{t.intro}</p>
      <div className="not-prose mt-4 divide-y divide-border rounded-2xl border border-border">
        {ids.map((id) => {
          const ex = catalog[id];
          const videos = EXERCISE_VIDEOS[id];
          const own = locale === "fr" ? videos?.fr : locale === "en" ? videos?.en : undefined;
          const url = own ?? videos?.en;
          const foreign = !own && url ? t.inEnglish : undefined;
          const photo = EXERCISE_IMAGES[id];
          return (
            <details key={id} className="group px-5 py-3">
              <summary className="cursor-pointer list-none font-semibold text-foreground marker:hidden">
                <span className="mr-2 inline-block transition-transform group-open:rotate-90">›</span>
                {ex.name}
              </summary>
              <div className="mt-3 space-y-3 text-sm text-secondary">
                <div>
                  <p className="font-semibold text-foreground">{t.cues}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {ex.cues.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t.mistakes}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {ex.mistakes.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
                {photo && (
                  <figure>
                    <Image
                      src={photo.src}
                      alt={ex.name}
                      width={photo.width}
                      height={photo.height}
                      sizes="(max-width: 768px) 100vw, 640px"
                      className="mx-auto max-h-96 w-auto rounded-xl bg-white"
                    />
                    <figcaption className="mt-1 text-center text-xs">
                      {photo.credit === "maison" ? t.housePhoto : t.photo}
                    </figcaption>
                  </figure>
                )}
                {url && (
                  <div>
                    <div className="relative mt-1 aspect-video w-full overflow-hidden rounded-xl bg-light-bg">
                      <iframe
                        src={embedUrl(url)}
                        title={ex.name}
                        loading="lazy"
                        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        className="absolute inset-0 h-full w-full"
                      />
                    </div>
                    {foreign && <p className="mt-1 text-xs">({t.video} {foreign})</p>}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
