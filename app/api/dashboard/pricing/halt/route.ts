import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import {
  clearHalt,
  haltState,
  isHalted,
  lastPushRun,
  pushMode,
  setHalt,
} from "@/lib/pricing/push";

/**
 * État de l'envoi des prix et **coupe-circuit** — administrateur seulement.
 *
 * C'est la **seule écriture** de la page Pricing, et elle ne touche **que Redis**
 * (`barbusse:pricing:halt`) : aucune route du dashboard n'écrit dans Beds24 (règle du
 * 2026-11-14). Poser le coupe-circuit fige les prix tels qu'ils sont ; le lever laisse le cron
 * du lendemain reprendre. Le mode (`PRICING_PUSH_MODE`) ne se change pas d'ici.
 *
 * Jamais dans `allowedPaths` de `proxy.ts`.
 */
const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  const refus = await guard.denyNonAdmin(request);
  if (refus) return refus;
  try {
    const [halted, state, last] = await Promise.all([isHalted(), haltState(), lastPushRun()]);
    return NextResponse.json({ mode: pushMode(), halted, halt: state, last }, { headers: NO_STORE });
  } catch (err) {
    console.error("[dashboard/pricing/halt]", err);
    return NextResponse.json({ error: "État indisponible." }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  const refus = await guard.denyNonAdmin(request);
  if (refus) return refus;

  // Le cookie `sameSite: lax` couvre déjà l'essentiel ; on exige en plus la même origine et du JSON.
  const origin = request.headers.get("origin");
  let sameOrigin = false;
  try {
    sameOrigin = !!origin && new URL(origin).host === request.nextUrl.host;
  } catch {
    sameOrigin = false;
  }
  if (!sameOrigin) {
    return NextResponse.json({ error: "Origine refusée." }, { status: 403, headers: NO_STORE });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "JSON attendu." }, { status: 415, headers: NO_STORE });
  }

  let body: { halt?: unknown; reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON illisible." }, { status: 400, headers: NO_STORE });
  }
  if (typeof body.halt !== "boolean") {
    return NextResponse.json({ error: "« halt » (booléen) attendu." }, { status: 400, headers: NO_STORE });
  }

  try {
    if (body.halt) {
      const reason =
        typeof body.reason === "string" && body.reason.trim()
          ? body.reason.trim().slice(0, 200)
          : "Coupé depuis le dashboard";
      await setHalt(reason);
    } else {
      await clearHalt();
    }
    return NextResponse.json({ halted: await isHalted() }, { headers: NO_STORE });
  } catch (err) {
    console.error("[dashboard/pricing/halt]", err);
    return NextResponse.json(
      { error: "Le coupe-circuit n'a pas pu être changé." },
      { status: 500, headers: NO_STORE },
    );
  }
}
