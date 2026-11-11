/**
 * Client minimal du portail Intratone (digicode du garage de Barbusse) — lecture de
 * l'historique des ouvertures par code clavier.
 *
 * Intratone n'a pas d'API publique. Le portail empile deux applications : une SPA Vue qui
 * s'authentifie sur `apidata.intratone.info`, et un moteur « legacy » PHP qui sert les écrans.
 * L'historique des ouvertures vit dans le moteur legacy, derrière cette séquence (reconstituée
 * en observant le portail) :
 *   1. `POST /fr/connexion.php`  (FormData identifiant/mdp/device) → `SID` + `jwt` ;
 *   2. `POST /fr/data/connect.php?SID=…`  → active la session legacy (sans ça, tout rend err 105) ;
 *   3. `POST /fr/data/events/evts.php?SID=…`  `id=<centrale>` → sélectionne le digicode ;
 *   4. `POST /fr/data/events/evts_list.php?SID=…`  `date=&evt=4&serie=` → tableau HTML des
 *      ouvertures par **code clavier** (`evt=4`). Colonnes : Quand / Quoi / code / Qui.
 *
 * Rien n'est journalisé en clair (identifiants, jwt). Les événements ne portent que le prénom
 * du libellé du code (ex. « Sophie »), jamais de donnée sensible.
 *
 * ⚠️ Fraîcheur : les événements récents n'apparaissent qu'une fois « récupérés » depuis
 * l'interphone. Les interphones connectés (4G/LoRa) téléversent seuls ; la « récupération »
 * manuelle du portail (`evts_recup`) est refusée hors UI. Un cron horaire suffit pour le ménage.
 */

const BASE = "https://intratone.info/fr/";

export interface IntratoneConfig {
  user: string;
  password: string;
  /** Id de la centrale (digicode) à interroger. Barbusse garage, fourni par `INTRATONE_CENTRALE_ID`. */
  centraleId: string;
}

/** Une ouverture par code clavier. */
export interface KeypadOpening {
  /** Instant de l'ouverture (UTC Date, interprété depuis l'heure locale Paris du portail). */
  at: Date;
  /** Numéro du code utilisé (ex. « 100200 »). */
  code: string;
  /** Libellé du code (prénom), ex. « Sophie ». */
  name: string;
}

export class IntratoneError extends Error {}

export class Intratone {
  private readonly cfg: IntratoneConfig;
  private sid: string | null = null;
  private cookie: string | null = null;

  constructor(cfg: IntratoneConfig) {
    this.cfg = cfg;
  }

  /** Ouvre une session legacy complète (connexion.php + connect.php + sélection de la centrale). */
  async login(): Promise<void> {
    const form = new FormData();
    form.set("identifiant", this.cfg.user);
    form.set("mdp", this.cfg.password);
    form.set("device", crypto.randomUUID());
    const res = await fetch(`${BASE}connexion.php`, {
      method: "POST",
      body: form,
      headers: { Referer: BASE, "User-Agent": UA },
      cache: "no-store",
    });
    this.cookie = extractCookies(res);
    const data = (await res.json()) as { error?: number; SID?: string; session?: unknown };
    if (data.error !== 0 || !data.SID) {
      throw new IntratoneError("Intratone : identifiants refusés");
    }
    this.sid = data.SID;
    // Bootstrap de la session legacy (indispensable).
    await this.legacy("data/connect.php");
    // Sélection de la centrale (pose le contexte des événements).
    await this.legacy("data/events/evts.php", { id: this.cfg.centraleId });
  }

  /**
   * Les ouvertures par **code clavier** de la centrale, les plus récentes d'abord.
   * `date` optionnelle au format `YYYY-MM-DD` pour filtrer un jour.
   */
  async keypadOpenings(date = ""): Promise<KeypadOpening[]> {
    return this.openings("4", date); // 4 = Code Clavier
  }

  /**
   * Les appuis sur le bouton poussoir intérieur (sortie du garage), instants seuls. Sert à
   * estimer la fin d'une visite quand la caméra n'a rien vu.
   */
  async buttonPresses(date = ""): Promise<Date[]> {
    const ops = await this.openings("5", date); // 5 = BP (bouton poussoir)
    return ops.map((o) => o.at);
  }

  private async openings(evt: string, date: string): Promise<KeypadOpening[]> {
    const json = await this.legacy("data/events/evts_list.php", { date, evt, serie: "" });
    const html = typeof json.html === "string" ? json.html : "";
    return parseOpenings(html);
  }

  private async legacy(path: string, fields?: Record<string, string>): Promise<Record<string, unknown>> {
    if (!this.sid) throw new IntratoneError("Session Intratone non ouverte");
    const body = new URLSearchParams(fields ?? {}).toString();
    const res = await fetch(`${BASE}${path}?SID=${encodeURIComponent(this.sid)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: BASE,
        "User-Agent": UA,
        ...(this.cookie ? { Cookie: this.cookie } : {}),
      },
      body,
      cache: "no-store",
    });
    const text = await res.text();
    let json: Record<string, unknown>;
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new IntratoneError(`Intratone : réponse inattendue sur ${path}`);
    }
    if (json.type === -1) {
      throw new IntratoneError(`Intratone : écran refusé (${path}, err ${String(json.err ?? "")})`);
    }
    return json;
  }
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

function extractCookies(res: Response): string | null {
  // Node expose les Set-Cookie via getSetCookie(); on ne garde que name=value.
  const getSetCookie = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
  const list = typeof getSetCookie === "function" ? getSetCookie.call(res.headers) : [];
  if (!list || list.length === 0) return null;
  return list.map((c) => c.split(";")[0]).join("; ");
}

/**
 * Extrait les lignes du tableau d'ouvertures. Chaque ligne a quatre cellules :
 * `JJ/MM/AA HH:MM` | type | code | nom. On ne garde que les lignes « Code Clavier ».
 */
export function parseOpenings(html: string): KeypadOpening[] {
  const openings: KeypadOpening[] = [];
  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) ?? [];
  for (const row of rows) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
      .map((m) => decodeEntities(m[1].replace(/<[^>]+>/g, "").trim()))
      .filter((c) => c.length > 0);
    if (cells.length < 4) continue;
    const [when, , code, name] = cells;
    const at = parseFrenchDate(when);
    if (!at) continue;
    openings.push({ at, code, name });
  }
  return openings;
}

/** `04/11/26 16:11` (heure de Paris) → `Date`. Rend null si le format surprend. */
export function parseFrenchDate(value: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/.exec(value.trim());
  if (!m) return null;
  const [, dd, mm, yy, hh, mi] = m;
  // Heure locale de Paris → instant UTC. Décalage lu via Intl pour gérer l'heure d'été.
  const year = 2000 + Number(yy);
  const naive = Date.UTC(year, Number(mm) - 1, Number(dd), Number(hh), Number(mi));
  const offsetMin = parisOffsetMinutes(new Date(naive));
  return new Date(naive - offsetMin * 60_000);
}

/** Décalage Paris (minutes) à cette date, +60 (hiver) ou +120 (été). */
function parisOffsetMinutes(date: Date): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    timeZoneName: "shortOffset",
  });
  const part = fmt.formatToParts(date).find((p) => p.type === "timeZoneName")?.value ?? "GMT+1";
  const m = /GMT([+-]\d{1,2})/.exec(part);
  return m ? Number(m[1]) * 60 : 60;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&agrave;/g, "à")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .trim();
}
