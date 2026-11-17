import Image from "next/image";
import Link from "next/link";
import ExerciseGuide from "@/components/public/ExerciseGuide";

export default function Article() {
  return (
    <>
      <p className="lead">
        Am Ende des Gartens, in einem vom Haus getrennten Nebengebäude, erwartet Sie ein echter
        Kraft- und Cross-Training-Raum: Squat-Rack, Olympiastange, 185 kg Gewicht, Kabelzug,
        Concept2-Rudergerät und Crosstrainer. Er steht während des ganzen Aufenthalts nur Ihrer
        Gruppe zur Verfügung. Hier erfahren Sie, was er enthält, was man dort machen kann und
        für wen er den Aufenthalt verändert.
      </p>

      <h2>Ein eigener Raum, nur für Ihre Gruppe</h2>
      <p>
        Der Fitnessraum ist keine Garagenecke mit zwei Kurzhanteln: Es ist ein eigener Raum,
        getrennt vom Haus, mit einem <strong>Boden aus 20 mm starken, stoßdämpfenden
        Gummimatten</strong>, wie in Cross-Training-Boxen. Dort kann man{" "}
        <strong>eine mit Bumper Plates beladene Stange fallen lassen</strong>, nach einem
        Kreuzheben oder einem Stoßen, ohne den Boden zu beschädigen oder das Haus zu wecken. Da
        das Haus nur komplett vermietet wird, teilen Sie den Raum mit niemandem außer Ihrer
        Gruppe.
      </p>

      <h2>Die Ausstattung, Bereich für Bereich</h2>

      <h3>Kraft: Rack, Stange und Bumper Plates</h3>
      <ul>
        <li>
          <strong>Ein Squat-Rack</strong> mit Klimmzugstange, Dipgriffen und verstellbaren
          Ablagen: Kniebeugen, Bankdrücken, Schulterdrücken, Klimmzüge, Dips, in Sicherheit.
        </li>
        <li>
          <strong>Eine 20 kg schwere Olympiastange</strong> (2,20 m), mit einem
          Nackenpolster für die Kniebeuge und zwei Verschlüssen.
        </li>
        <li>
          <strong>165 kg Bumper Plates</strong>, von 2,5 bis 25 kg: <strong>bis zu 185 kg
          auf der Stange</strong>. Genug, um bei Kniebeuge und Kreuzheben schwer zu trainieren.
        </li>
        <li>
          <strong>Eine verstellbare Hantelbank</strong> (flach, schräg) und ein{" "}
          <strong>Gewichthebergürtel</strong>.
        </li>
      </ul>

      <figure className="my-8">
        <Image
          src="/images/blog/salle-de-sport/cage-powergym.jpg"
          alt="Das Squat-Rack des Fitnessraums: Klimmzugstange, Dipgriffe, Ablagen und Kabelzug oben und unten"
          width={772}
          height={772}
          sizes="(max-width: 768px) 100vw, 512px"
          className="mx-auto w-full max-w-md rounded-xl bg-white"
        />
        <figcaption className="mt-2 text-center text-sm text-secondary">
          Das Rack des Fitnessraums mit seinem oberen und unteren Kabelzug (Foto: Powergym).
        </figcaption>
      </figure>

      <figure className="my-8">
        <Image
          src="/images/blog/entrainement-salle-de-sport.jpg"
          alt="Der Fitnessraum: das Rack, die Hantelbank, die aufgeräumten Bumper Plates und der Gewichthebergürtel"
          width={1920}
          height={1280}
          sizes="(max-width: 768px) 100vw, 768px"
          className="w-full rounded-xl"
        />
        <figcaption className="mt-2 text-center text-sm text-secondary">
          Die Bank, die aufgeräumten Bumper Plates und der Gürtel, neben dem Rack.
        </figcaption>
      </figure>

      <h3>Kabelzug und Kurzhanteln</h3>
      <ul>
        <li>
          <strong>Ein oberer und unterer Kabelzug</strong> am Rack, mit fünf Griffen: ein
          Rudergriff mit parallelen Griffen, ein Trizepsseil, eine breite Latzugstange, ein
          Einhandgriff, um jeweils einen Arm zu trainieren, und eine kurze gerade Stange.
          Latziehen, Rudern, Trizepsdrücken, Curls, Schulterrotationen.
        </li>
        <li>
          <strong>60 kg Gusseisenscheiben</strong> (von 1 bis 10 kg), um den Kabelzug oder die
          Kurzhanteln aufs Kilo genau zu beladen.
        </li>
      </ul>

      <h3>Cardio</h3>
      <ul>
        <li>
          <strong>Ein Concept2-Rudergerät</strong>, der Maßstab in Fitnessstudios und
          Rudervereinen: Intervalle, Ausdauer, Challenges auf Zeit.
        </li>
        <li>
          <strong>Ein NordicTrack-Crosstrainer</strong>, gelenkschonend ohne Stoßbelastung.
        </li>
        <li>
          <strong>Ein Springseil</strong>.
        </li>
      </ul>

      <h3>Cross-Training, Körpergewicht und Mobilität</h3>
      <ul>
        <li>
          <strong>Ein 6 kg schwerer Medizinball</strong> und eine <strong>Plyo-Box aus
          Holz</strong>, verstellbar von 20 bis 50 cm.
        </li>
        <li>
          <strong>Widerstandsbänder</strong>, ein <strong>Mobilitätsstab</strong> und{" "}
          <strong>Bodenmatten</strong> für Aufwärmen, Rumpfstabilität und Dehnen.
        </li>
      </ul>

      <h2>Was man dort machen kann</h2>
      <figure className="my-8">
        <Image
          src="/images/blog/salle-de-sport/cage-exercices-powergym.jpg"
          alt="Übungsbeispiele am Rack: Kniebeuge, Klimmzüge, Latziehen, Dips, Rudern am unteren Kabelzug"
          width={772}
          height={772}
          sizes="(max-width: 768px) 100vw, 640px"
          className="mx-auto w-full max-w-xl rounded-xl bg-white"
        />
        <figcaption className="mt-2 text-center text-sm text-secondary">
          Kniebeuge, Klimmzüge, Dips, Zugübungen: was dasselbe Rack ermöglicht (Foto: Powergym).
        </figcaption>
      </figure>

      <ul>
        <li>
          <strong>Kraft aufbauen</strong>: Kniebeuge, Kreuzheben, Bankdrücken, Klimmzüge mit
          Zusatzgewicht, mit ernsthaften Gewichten.
        </li>
        <li>
          <strong>Muskeln aufbauen</strong>: Langhantel, Kabelzug und Kurzhanteln, um jede
          Muskelgruppe zu trainieren, vom Rücken bis zum Trizeps.
        </li>
        <li>
          <strong>Die Ausdauer verbessern</strong>: Intervalle auf dem Rudergerät, Ausdauer auf
          dem Crosstrainer, Springseil.
        </li>
        <li>
          <strong>Kalorien verbrennen</strong>: Zirkel und AMRAPs mit Medizinball, Box Jumps,
          Springseil und Rudergerät.
        </li>
        <li>
          <strong>Sich auf einen Wettkampf vorbereiten</strong>: sportartspezifisches
          Krafttraining, Verletzungsprävention, Aktivierung am Morgen des Wettkampfs.
        </li>
        <li>
          <strong>Regenerieren</strong>: Cool-down auf dem Crosstrainer, Mobilität und
          Dehnen, danach der Zen-Raum.
        </li>
      </ul>
      <p>
        Fertige Trainingseinheiten, allein oder in der Gruppe, finden Sie in{" "}
        <Link href="/de/blog/entrainements-salle-de-sport-le-mans">
          unserem Artikel über die Trainingseinheiten
        </Link>
        , und eine Routine für nach der Belastung in{" "}
        <Link href="/de/blog/recuperation-apres-effort-le-mans">
          unserem Artikel über die Regeneration
        </Link>
        .
      </p>

      <h2>Für wen</h2>
      <ul>
        <li>
          <strong>Sportmannschaften</strong> bei einem Turnier oder im Trainingslager: Das
          Athletiktraining findet im Haus statt, zwischen zwei Spielen. Siehe{" "}
          <Link href="/de/blog/equipe-sportive-le-mans">unseren Artikel über Sportmannschaften</Link>
          .
        </li>
        <li>
          <strong>Fahrer und ihre Teams</strong>, die wegen der Rennstrecke kommen: Nacken,
          Rumpf, Ausdauer und eine Aktivierung am Morgen des Rennens.
        </li>
        <li>
          <strong>Seminare</strong>: Eine 20-minütige Gruppeneinheit vor dem ersten Meeting
          macht wacher als ein dritter Kaffee.
        </li>
        <li>
          <strong>Teams auf Montage</strong>, die mehrere Wochen in Le Mans sind und das
          Training nicht unterbrechen wollen.
        </li>
        <li>
          <strong>Familien mit sportlichen Teenagern</strong>, in Begleitung eines Erwachsenen.
        </li>
      </ul>

      <h2>Athletiktraining, Sportart für Sportart</h2>
      <p>Ein Artikel pro Disziplin, mit Trainingseinheiten, die auf diesen Raum abgestimmt sind:</p>
      <ul>
        <li>
          <Link href="/de/blog/preparation-physique-course-automobile-le-mans">
            Motorsport
          </Link>{" "}
          und{" "}
          <Link href="/de/blog/preparation-physique-karting-le-mans">Kartsport</Link>;
        </li>
        <li>
          <Link href="/de/blog/preparation-physique-cyclisme-le-mans">Radsport</Link>,{" "}
          <Link href="/de/blog/preparation-physique-roller-le-mans">Inlineskaten</Link> und{" "}
          <Link href="/de/blog/preparation-physique-course-a-pied-le-mans">Laufen</Link>
          ;
        </li>
        <li>
          <Link href="/de/blog/preparation-physique-volley-ball-le-mans">Volleyball</Link>,{" "}
          <Link href="/de/blog/preparation-physique-handball-le-mans">Handball</Link> und{" "}
          <Link href="/de/blog/preparation-physique-equitation-le-mans">Reiten</Link>.
        </li>
      </ul>

      <h2>Mit dem Rest des Hauses</h2>
      <ul>
        <li>
          <strong>Ein Zen-Raum mit Yogamatten</strong> zum Dehnen in Ruhe.
        </li>
        <li>
          <strong>Der Park Gué de Maulny</strong> (10 ha), 5 Gehminuten entfernt, zum Laufen.
        </li>
        <li>
          <strong>Ein Duschbad pro Zimmer</strong>: 9 Zimmer, 9 Duschen, keine Warteschlange
          nach dem Training.
        </li>
        <li>
          <strong>Eine Waschmaschine und ein Trockner</strong> für die Sportkleidung.
        </li>
        <li>
          <strong>Eine voll ausgestattete Küche</strong> und ein großer Tisch mit 16 bis 20
          Plätzen für das Mannschaftsessen.
        </li>
      </ul>

      <h2>Gut zu wissen</h2>
      <ul>
        <li>
          <strong>Ohne Betreuung</strong>: Jeder nutzt den Raum auf eigene Verantwortung.
          Wärmen Sie sich auf, wählen Sie Gewichte, die Sie beherrschen, lassen Sie sich bei
          schweren Sätzen auf der Bank sichern und räumen Sie die Geräte nach dem Training auf.
        </li>
        <li>
          <strong>Minderjährige</strong> trainieren in Begleitung eines Erwachsenen (Eltern
          oder Betreuer des Vereins).
        </li>
        <li>
          <strong>Bumper Plates darf man fallen lassen, Gusseisen nicht</strong>: Die Matten
          sind für eine mit Bumper Plates beladene Stange gemacht; Gusseisenscheiben und
          Kurzhanteln werden abgelegt.
        </li>
      </ul>

      <h2>Buchen Sie das Haus mit seinem Fitnessraum</h2>
      <p>
        Der Fitnessraum ist in der Miete des Hauses inbegriffen, wie der Zen-Raum und der
        Garten. Sehen Sie sich unsere <Link href="/de#disponibilite">Verfügbarkeit in Echtzeit</Link>{" "}
        an und buchen Sie direkt, ohne Provision.
      </p>
      <ExerciseGuide locale="de" ids={["back-squat", "deadlift", "bench-press", "pull-up", "seated-cable-row", "rowing", "medicine-ball-thruster", "box-jump"]} />
    </>
  );
}
