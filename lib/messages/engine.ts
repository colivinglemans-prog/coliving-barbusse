import type { Beds24Booking } from "@sejour/socle/lib/beds24-types";
import { messagingChannel, realGuestEmail } from "@sejour/socle/lib/guest-messaging/channel-rules";
import { sendNow, sendPlanned, type DispatchDeps, type DispatchItemResult, type DispatchResult } from "@sejour/socle/lib/guest-messaging/dispatch";
import { pickGuestLocale } from "@sejour/socle/lib/guest-messaging/language";
import { ledgerCode, ledgerFromInfoItems, ledgerFromThread, ledgerText } from "@sejour/socle/lib/guest-messaging/ledger";
import {
  buildGuestMessagesReport,
  buildPreview,
  type GuestMessagePreview,
  type GuestMessagesReport,
  type TemplateMode,
} from "@sejour/socle/lib/guest-messaging/overview";
import type { Vars } from "@sejour/socle/lib/guest-messaging/render";
import { addDays, planMessages } from "@sejour/socle/lib/guest-messaging/schedule";
import { createSmtpTransport, smtpConfigFrom } from "@sejour/socle/lib/guest-messaging/smtp";
import type { MessagingBooking } from "@sejour/socle/lib/guest-messaging/types";
import { todayParis } from "@sejour/socle/lib/time";
import { isPinOnLock } from "@/lib/access-sync";
import {
  creditsBeds24,
  ecrireRegistre,
  envoyerMessagePlateforme,
  getBookingMessages,
  messagesHote,
  nukiCodeOf,
  reservationMessagerie,
  reservationsMessagerie,
  type Beds24Message,
} from "@/lib/beds24";
import { PROPERTY_INFO } from "@/lib/property-info";
import { getRedis, hasRedis, redisKey } from "@/lib/redis";
import { guideUrl, SITE_URL, type GuideLocale } from "@/lib/site";
import { TEMPLATES } from "./templates";

/**
 * La messagerie voyageur de Barbusse : ce que le moteur du socle (`@sejour/socle/lib/guest-messaging`)
 * ne peut pas savoir seul.
 *
 * - **Réservations** : maison entière (303771), lues avec le jeton de messagerie, fraîches.
 * - **Registre** : `infoItems` `MSG_*` (jeton d'écriture), plus les messages de l'hôte reconnus
 *   dans les fils — c'est ce qui voit les auto-actions Beds24 encore actives et les envois des
 *   anciens boutons : rien ne part en double pendant la bascule.
 * - **Arrivée** (chef-de-stand) : le message ne part que si le PIN est dans Beds24 (`NUKI_PIN`)
 *   **et posé sur la serrure** (`isPinOnLock`). Réservation tardive : il part dès que la
 *   synchronisation horaire l'a posé, jusqu'au soir de l'arrivée.
 * - **Modes** : `MESSAGES_MODES` (`arrivee-code:live,depart:shadow,…`), **ombre par défaut** ;
 *   `MESSAGES_KILL_SWITCH=1` coupe tout.
 * - **Verrou de passage** : Redis `SET NX` (clé `barbusse:messages:cron:lock`), en plus du
 *   départage du moteur.
 *
 * Aucune donnée du voyageur, aucun PIN ni texte rendu ne sort de ce module, sauf vers Beds24 ou
 * le serveur SMTP. L'aperçu passe par `buildPreview`, qui masque tout sauf `previewVisible`.
 */

/** Fenêtre lue : séjours terminés depuis 60 jours (historique) jusqu'aux arrivées à 4 mois. */
const PAST_DAYS = 60;
const AHEAD_DAYS = 120;
/** Plafond d'envois par passage : au-delà, rien ne part. */
export const CAP = 5;
/**
 * Lien d'avis Google de la fiche, repris de l'auto-action Beds24 « avis » (2026-11-08). Distinct
 * de `PROPERTY_INFO.googleMaps`, qui ouvre la carte et non le formulaire d'avis.
 */
const GOOGLE_REVIEW_URL = "https://maps.app.goo.gl/XPUZj2tEX9YBgrU16";

const IDS = TEMPLATES.map((t) => t.id);

/** Modes effectifs. L'interrupteur général donne des modes tous `off` — c'est ce que voit le moteur. */
export function modes(): { modes: Record<string, TemplateMode>; display: Record<string, TemplateMode>; killSwitch: boolean } {
  const display: Record<string, TemplateMode> = Object.fromEntries(IDS.map((id) => [id, "shadow" as TemplateMode]));
  for (const part of (process.env.MESSAGES_MODES ?? "").split(",")) {
    const [id, mode] = part.split(":").map((x) => x?.trim());
    if (id && IDS.includes(id) && (mode === "off" || mode === "shadow" || mode === "live")) display[id] = mode;
  }
  const killSwitch = process.env.MESSAGES_KILL_SWITCH?.trim() === "1";
  const effective = killSwitch ? Object.fromEntries(IDS.map((id) => [id, "off" as TemplateMode])) : display;
  return { modes: effective, display, killSwitch };
}

type Row = MessagingBooking & { firstName?: string; pin?: string };

function toMessagingBooking(b: Beds24Booking, thread: readonly Beds24Message[]): Row {
  const { locale, source } = pickGuestLocale({ lang: b.lang, country: b.country });
  return {
    id: b.id,
    status: b.status,
    channel: messagingChannel(b),
    arrival: b.arrival,
    departure: b.departure,
    bookingTime: b.bookingTime,
    locale,
    localeSource: source,
    email: realGuestEmail(b.email),
    infoCodes: (b.infoItems ?? []).map((i) => (i.code ?? "").toUpperCase()),
    ledger: [...ledgerFromInfoItems(b.infoItems, IDS), ...ledgerFromThread(thread, TEMPLATES)],
    firstName: b.firstName?.trim() || undefined,
    // Gardé côté serveur pour l'envoi ; jamais dans un DTO (`buildGuestMessagesReport` projette).
    pin: nukiCodeOf(b) ?? undefined,
  };
}

async function loadRows(): Promise<Row[]> {
  const today = todayParis();
  const [bookings, host] = await Promise.all([
    reservationsMessagerie({ departDu: addDays(today, -PAST_DAYS), arriveeAu: addDays(today, AHEAD_DAYS) }),
    messagesHote(PAST_DAYS + AHEAD_DAYS),
  ]);
  const byBooking = new Map<number, Beds24Message[]>();
  for (const m of host) byBooking.set(m.bookingId, [...(byBooking.get(m.bookingId) ?? []), m]);
  return bookings.map((b) => toMessagingBooking(b, byBooking.get(b.id) ?? []));
}

async function reload(id: number): Promise<Row | null> {
  const [b, thread] = await Promise.all([reservationMessagerie(id), getBookingMessages(id)]);
  return b ? toMessagingBooking(b, thread) : null;
}

/** « +33620921005 » → « +33 6 20 92 10 05 ». */
function formatPhone(e164: string): string {
  const m = /^\+33(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(e164);
  return m ? `+33 ${m.slice(1).join(" ")}` : e164;
}

/** Valeurs des variables, en clair (PIN compris). Ne sortent que vers Beds24, le SMTP, ou `buildPreview` (masquées). */
async function variables(b: Row): Promise<Vars> {
  return {
    prenom: b.firstName,
    code: b.pin,
    guide: guideUrl(b.locale as GuideLocale),
    wifiReseau: PROPERTY_INFO.wifi.ssid,
    wifiMotDePasse: PROPERTY_INFO.wifi.password,
    telephone: formatPhone(PROPERTY_INFO.contact.phone),
    avisGoogle: GOOGLE_REVIEW_URL,
    // Réservation directe seulement : on ne propose jamais de réserver en direct par la messagerie
    // d'une plateforme.
    direct: b.channel === "Direct" ? `${SITE_URL}/${b.locale}` : undefined,
  };
}

function deps(): DispatchDeps {
  const smtp = smtpConfigFrom(process.env);
  return {
    reload,
    variables: (b) => variables(b as Row),
    async ready(b, t) {
      if (!t.variables.includes("code")) return { ok: true };
      const pin = (b as Row).pin;
      if (!pin) return { ok: false, reason: "no-access-code" };
      // Jamais le corps d'une erreur Nuki : un 409 cite le PIN. `isPinOnLock` ne rend qu'un booléen.
      return (await isPinOnLock(b.id, pin)) ? { ok: true } : { ok: false, reason: "pin-not-on-lock" };
    },
    reserve: (b, t, e) => ecrireRegistre(b.id, ledgerCode(t.id, "pending"), ledgerText({ ...e, version: t.version })),
    confirm: (b, t, e) => ecrireRegistre(b.id, ledgerCode(t.id, "sent"), ledgerText({ ...e, version: t.version })),
    platform: envoyerMessagePlateforme,
    email: smtp ? createSmtpTransport({ ...smtp, fromName: smtp.fromName ?? "Coliving Henri Barbusse" }) : null,
  };
}

export async function report(bookingId?: number): Promise<GuestMessagesReport> {
  const rows = await loadRows();
  const { display, killSwitch } = modes();
  return buildGuestMessagesReport({
    bookings: bookingId === undefined ? rows : rows.filter((r) => r.id === bookingId),
    templates: TEMPLATES,
    modes: display,
    killSwitch,
    now: new Date(),
    quotaRemaining: creditsBeds24(),
  });
}

export async function preview(bookingId: number, templateId: string): Promise<GuestMessagePreview | null> {
  const t = TEMPLATES.find((x) => x.id === templateId);
  const b = await reload(bookingId);
  if (!t || !b) return null;
  return buildPreview(t, b, await variables(b));
}

const LOCK = () => redisKey("messages", "cron", "lock");

/** Passage du cron, sous verrou Redis : deux passages ne se chevauchent pas. */
export async function runCron(
  now = new Date(),
): Promise<(DispatchResult & { planned: number; orphans: { bookingId: number; templateId: string }[] }) | { locked: true }> {
  if (hasRedis() && !(await getRedis().set(LOCK(), Date.now(), { nx: true, ex: 120 }))) return { locked: true };
  try {
    const rows = await loadRows();
    const { modes: m } = modes();
    const plan = planMessages(rows, TEMPLATES, now);
    const result = await sendPlanned(plan, TEMPLATES, deps(), { now, cap: CAP, modes: m });
    return {
      ...result,
      planned: plan.filter((p) => p.state.kind === "due").length,
      orphans: plan.filter((p) => p.state.kind === "orphan" && m[p.templateId] === "live").map(({ bookingId, templateId }) => ({ bookingId, templateId })),
    };
  } finally {
    if (hasRedis()) await getRedis().del(LOCK()).catch(() => {});
  }
}

export async function sendOne(bookingId: number, templateId: string): Promise<DispatchItemResult | null> {
  const t = TEMPLATES.find((x) => x.id === templateId);
  if (!t) return null;
  return sendNow(bookingId, t, deps(), { now: new Date(), modes: modes().modes });
}

export const TEMPLATE_IDS = IDS;
