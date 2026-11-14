import {
  ABSOLUTE_BOUNDS,
  effectivePrice,
  eventFloorOn,
  price1For,
} from "./guards";

/**
 * Le plan d'un envoi de prix — fonction **pure** : ce qui part, ce qui est mis en quarantaine,
 * et si l'envoi doit être rejeté en bloc. Aucune I/O ici ; `push.ts` exécute.
 *
 * Ordre des contrôles :
 * 1. chaque cible est convertie en `price1` (compensation de la remise de durée) ;
 * 2. **bornes absolues et planchers d'événement** sur le prix effectif : une seule violation
 *    rejette tout l'envoi ;
 * 3. diff avec le calendrier actuel : rien à écrire si prix et séjour minimum sont identiques ;
 * 4. une variation de plus de `maxChange` met **la date seule** en quarantaine (elle garde son
 *    prix) ; une date sans prix actuel en est exemptée ;
 * 5. plus de `maxDates` écritures : l'envoi est rejeté (relever le paramètre exprès).
 *
 * Les nuits vendues ou bloquées sont écrites comme les autres : `price1` ne touche pas une
 * réservation, et une annulation rouvre ainsi la nuit au bon prix plutôt qu'à un prix périmé.
 */

export interface CurrentNight {
  price: number;
  minStay: number;
}

export interface TargetNight {
  /** Prix effectif visé (après remise de durée). */
  price: number;
  minStay: number;
  source: "engine" | "override";
}

export interface PlannedWrite {
  price1: number;
  minStay: number;
  source: TargetNight["source"];
  before: CurrentNight | null;
}

export interface Quarantined {
  date: string;
  from: number;
  to: number;
  changePct: number;
}

export interface PushPlan {
  status: "ok" | "rejected";
  /** Motifs du rejet en bloc (vide si `ok`). */
  rejections: string[];
  writes: Record<string, PlannedWrite>;
  quarantined: Quarantined[];
  unchanged: number;
}

export function planPush(input: {
  current: Readonly<Record<string, CurrentNight>>;
  target: Readonly<Record<string, TargetNight>>;
  maxChange: number;
  maxDates: number;
}): PushPlan {
  const { current, target, maxChange, maxDates } = input;
  const rejections: string[] = [];
  const writes: Record<string, PlannedWrite> = {};
  const quarantined: Quarantined[] = [];
  let unchanged = 0;

  for (const date of Object.keys(target).sort()) {
    const t = target[date];
    const price1 = price1For(t.price, t.minStay);
    const effective = effectivePrice(price1, t.minStay);

    if (!Number.isInteger(t.minStay) || t.minStay < ABSOLUTE_BOUNDS.minStay || t.minStay > ABSOLUTE_BOUNDS.maxStay) {
      rejections.push(`${date} : séjour minimum ${t.minStay} hors bornes`);
      continue;
    }
    if (!Number.isFinite(effective) || effective < ABSOLUTE_BOUNDS.minPrice || effective > ABSOLUTE_BOUNDS.maxPrice) {
      rejections.push(`${date} : prix ${Math.round(effective)} € hors bornes absolues`);
      continue;
    }
    const floor = eventFloorOn(date);
    // Tolérance d'un euro : l'arrondi de `price1For` peut repasser le plancher d'une fraction.
    if (floor && effective < floor.floor - 1) {
      rejections.push(`${date} : ${Math.round(effective)} € sous le plancher ${floor.label} (${floor.floor} €)`);
      continue;
    }

    const now = current[date] ?? null;
    if (now && now.price === price1 && now.minStay === t.minStay) {
      unchanged++;
      continue;
    }
    if (now && now.price > 0) {
      const changePct = (price1 - now.price) / now.price;
      if (Math.abs(changePct) > maxChange) {
        quarantined.push({ date, from: now.price, to: price1, changePct: Math.round(changePct * 1000) / 10 });
        continue;
      }
    }
    writes[date] = { price1, minStay: t.minStay, source: t.source, before: now };
  }

  const count = Object.keys(writes).length;
  if (rejections.length === 0 && count > maxDates) {
    rejections.push(`${count} dates à modifier, plus que le maximum autorisé (${maxDates})`);
  }

  return {
    status: rejections.length ? "rejected" : "ok",
    rejections,
    writes: rejections.length ? {} : writes,
    quarantined,
    unchanged,
  };
}
