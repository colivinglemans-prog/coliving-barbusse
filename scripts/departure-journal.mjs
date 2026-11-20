#!/usr/bin/env node
// Relit le journal d'observation du départ d'un jour (`barbusse:departure-journal:<jour>`, écrit
// par `heating-automation`, gardé 14 jours) : une ligne par passage, présence par radiateur avec
// son palier, serrure, événements (catégorie du code, jamais son nom), message de départ (heure
// seulement). Lecture seule.
//
// Usage : node --env-file=.env.local scripts/departure-journal.mjs 2026-12-06 [--json]
// Requiert KV_REST_API_URL et KV_REST_API_TOKEN (Upstash).

const day = process.argv[2];
const asJson = process.argv.includes("--json");
if (!/^\d{4}-\d{2}-\d{2}$/.test(day ?? "")) {
  console.error("Usage : node --env-file=.env.local scripts/departure-journal.mjs AAAA-MM-JJ [--json]");
  process.exit(1);
}
const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error("KV_REST_API_URL / KV_REST_API_TOKEN manquants (node --env-file=.env.local …).");
  process.exit(1);
}

const res = await fetch(`${url}/lrange/barbusse:departure-journal:${day}/0/-1`, {
  headers: { Authorization: `Bearer ${token}` },
});
if (!res.ok) {
  console.error(`Upstash a répondu ${res.status}`);
  process.exit(1);
}
const { result = [] } = await res.json();
const entries = result.map((raw) => (typeof raw === "string" ? JSON.parse(raw) : raw));
if (asJson) {
  console.log(JSON.stringify(entries, null, 2));
  process.exit(0);
}
if (entries.length === 0) console.log(`Aucun passage journalisé le ${day}.`);

const clock = (iso) =>
  new Date(iso).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
for (const e of entries) {
  const presence = e.presence
    ? `${e.presence.readable ? (e.presence.present ? "présence" : "aucune présence") : "illisible"} [${e.presence.radiators
        .map((r) => `${r.name}=${r.tier}`)
        .join(", ")}]`
    : "radiateurs illisibles";
  const lock = e.lock ? (e.lock.online ? `serrure ${e.lock.lockState}` : "serrure hors ligne") : "serrure illisible";
  const events = e.events
    ? e.events.map((ev) => `${clock(ev.at)} ${ev.kind} (${ev.actor}, trigger ${ev.trigger})`).join(" ; ") || "aucun événement"
    : "journal non lu";
  const bookings = e.bookings
    .map((b) => `${b.id}:${b.status}/${b.absentPasses}${b.departedAt ? ` départ ${clock(b.departedAt)} par ${b.by}` : ""}`)
    .join(" ");
  const messages = Object.entries(e.messages ?? {})
    .map(([id, m]) => `${id} ${m}`)
    .join(" ; ");
  console.log(`${clock(e.at)} [${e.mode}] ${bookings} | ${lock} | ${presence}`);
  console.log(`       serrure : ${events}`);
  console.log(`       message : ${messages || "—"}${e.notified?.length ? ` | notifié : ${e.notified.join(", ")}` : ""}`);
}
