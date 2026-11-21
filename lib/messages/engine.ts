import type { Beds24Booking } from "@sejour/socle/lib/beds24-types";
import type { Channel } from "@sejour/socle/lib/channels";
import { messagingChannel, realGuestEmail } from "@sejour/socle/lib/guest-messaging/channel-rules";
import { sendNow, sendPlanned, type DispatchDeps, type DispatchItemResult, type DispatchResult } from "@sejour/socle/lib/guest-messaging/dispatch";
import { pickGuestLocale } from "@sejour/socle/lib/guest-messaging/language";
import {
  ledgerCode,
  ledgerFromInfoItems,
  ledgerFromThread,
  ledgerText,
  testLedgerCode,
  testLedgerFromInfoItems,
} from "@sejour/socle/lib/guest-messaging/ledger";
import {
  buildGuestMessagesReport,
  buildPreview,
  parseModes,
  type GuestMessagePreview,
  type GuestMessagesReport,
  type TemplateMode,
} from "@sejour/socle/lib/guest-messaging/overview";
import type { Vars } from "@sejour/socle/lib/guest-messaging/render";
import { addDays, nightsOf, planByMode } from "@sejour/socle/lib/guest-messaging/schedule";
import { createSmtpTransport, smtpConfigFrom, testRecipientFrom } from "@sejour/socle/lib/guest-messaging/smtp";
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
  reservationsCreeesDepuis,
  reservationsMessagerie,
  type Beds24Message,
} from "@/lib/beds24";
import { PROPERTY_INFO } from "@/lib/property-info";
import { getRedis, hasRedis, redisKey } from "@/lib/redis";
import { aroundUrl, guideUrl, SITE_URL, type GuideLocale } from "@/lib/site";
import { getWifi } from "@/lib/wifi";
import { formatHourFor, readStayHours, stayHours, type StayHoursTable } from "@/lib/stay-hours";
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
 * - **Modes** : `MESSAGES_MODES` (`arrivee-code:test,depart:shadow,…`), **ombre par défaut** ;
 *   `MESSAGES_KILL_SWITCH=1` coupe tout. En `test`, la copie part à `MESSAGES_TEST_TO`, à défaut
 *   à l'expéditeur SMTP (`contact@coliving-barbusse.fr`), et rien au voyageur.
 * - **Wi-Fi** : `getWifi()` (variables `WIFI_SSID` / `WIFI_PASSWORD`). Absentes, le message
 *   d'arrivée est bloqué (`missing:wifiReseau,…`) plutôt que d'annoncer un réseau vide.
 * - **Verrou de passage** : Redis `SET NX` (clé `barbusse:messages:cron:lock`), en plus du
 *   départage du moteur.
 *
 * Aucune donnée du voyageur, aucun PIN ni texte rendu ne sort de ce module, sauf vers Beds24 ou
 * le serveur SMTP. L'aperçu passe par `buildPreview`, qui masque tout sauf `previewVisible`.
 */

/** Fenêtre lue : séjours terminés depuis 60 jours (historique) jusqu'aux arrivées à 4 mois. */
const PAST_DAYS = 60;
const AHEAD_DAYS = 120;
/** Réservations créées depuis 3 jours, lues en plus quelle que soit leur arrivée (confirmation : 24 h de rattrapage). */
const RECENT_DAYS = 3;
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
  return parseModes(IDS, process.env.MESSAGES_MODES, process.env.MESSAGES_KILL_SWITCH?.trim() === "1");
}

type Row = MessagingBooking & {
  /** Vraie réservation directe (site, Beds24) — seule à recevoir le bloc « réservez en direct ». */
  directBooking?: boolean;
  firstName?: string;
  pin?: string;
  adults?: number;
  children?: number;
  /** Horaires convenus (`lib/stay-hours.ts`) ; absents = 17 h / 11 h. */
  arrivalHour?: number;
  departureHour?: number;
};

/**
 * Canal de messagerie d'une réservation. HomeToGo (`apiSourceId` 78) est traité comme une directe —
 * e-mail au voyageur, l'adresse étant réelle (décision de l'hôte du 2026-11-21) ; le socle le range
 * dans « Autre », sans envoi. `directBooking` reste réservé aux vraies directes : lui seul ouvre le
 * bloc « réservez en direct » de l'avis.
 */
export function channelOf(b: Pick<Beds24Booking, "channel" | "apiSourceId" | "referer">): { channel: Channel; directBooking: boolean } {
  const raw = messagingChannel(b);
  return { channel: raw === "Autre" && b.apiSourceId === 78 ? "Direct" : raw, directBooking: raw === "Direct" };
}

function toMessagingBooking(b: Beds24Booking, thread: readonly Beds24Message[], table: StayHoursTable): Row {
  const agreed = table[b.id] ?? {};
  const { locale, source } = pickGuestLocale({ lang: b.lang, country: b.country });
  return {
    id: b.id,
    status: b.status,
    ...channelOf(b),
    arrival: b.arrival,
    departure: b.departure,
    bookingTime: b.bookingTime,
    locale,
    localeSource: source,
    email: realGuestEmail(b.email),
    infoCodes: (b.infoItems ?? []).map((i) => (i.code ?? "").toUpperCase()),
    ledger: [...ledgerFromInfoItems(b.infoItems, IDS), ...ledgerFromThread(thread, TEMPLATES)],
    testLedger: testLedgerFromInfoItems(b.infoItems, IDS),
    firstName: b.firstName?.trim() || undefined,
    adults: b.numAdult,
    children: b.numChild,
    // Gardé côté serveur pour l'envoi ; jamais dans un DTO (`buildGuestMessagesReport` projette).
    pin: nukiCodeOf(b) ?? undefined,
    arrivalHour: agreed.arrivalHour,
    departureHour: agreed.departureHour,
  };
}

async function loadRows(): Promise<Row[]> {
  const today = todayParis();
  const [main, recent, host, table] = await Promise.all([
    reservationsMessagerie({ departDu: addDays(today, -PAST_DAYS), arriveeAu: addDays(today, AHEAD_DAYS) }),
    recentBookings(),
    messagesHote(PAST_DAYS + AHEAD_DAYS),
    readStayHours(),
  ]);
  const byBooking = new Map<number, Beds24Message[]>();
  for (const m of host) byBooking.set(m.bookingId, [...(byBooking.get(m.bookingId) ?? []), m]);
  return mergeBookings(main, recent).map((b) => toMessagingBooking(b, byBooking.get(b.id) ?? [], table));
}

/**
 * Fusion de la lecture principale (arrivées à 120 jours) et des réservations créées récemment,
 * sans doublon : la première lecture fait foi pour une réservation présente dans les deux.
 */
export function mergeBookings<T extends { id: number }>(main: readonly T[], recent: readonly T[]): T[] {
  const seen = new Set(main.map((b) => b.id));
  return [...main, ...recent.filter((b) => !seen.has(b.id))];
}

/** Lecture des réservations récentes, **isolée** : un échec n'empêche jamais le passage principal. */
async function recentBookings(): Promise<Beds24Booking[]> {
  try {
    return await reservationsCreeesDepuis(new Date(Date.now() - RECENT_DAYS * 86_400_000).toISOString());
  } catch (e) {
    console.error(JSON.stringify({ scope: "guest-message", event: "failed", reason: "recent-bookings", error: e instanceof Error ? e.name : typeof e }));
    return [];
  }
}

async function reload(id: number): Promise<Row | null> {
  const [b, thread, table] = await Promise.all([reservationMessagerie(id), getBookingMessages(id), readStayHours()]);
  return b ? toMessagingBooking(b, thread, table) : null;
}

/**
 * Heures d'arrivée et de départ du séjour, dans la langue du voyageur (« 17h », « 5 pm »,
 * « 17 Uhr », « 17:00 »), et les drapeaux `arriveeConvenue` / `departConvenu`, **vides sans
 * accord** : un séjour standard rend les textes d'avant au caractère près.
 */
export function hourVars(locale: string, agreed: { arrivalHour?: number; departureHour?: number }): Vars {
  const hours = stayHours(0, { 0: agreed });
  return {
    heureArrivee: formatHourFor(locale, hours.arrivalHour),
    heureDepart: formatHourFor(locale, hours.departureHour),
    arriveeConvenue: hours.arrivalAgreed ? "1" : undefined,
    departConvenu: hours.departureAgreed ? "1" : undefined,
  };
}

/** Dates, nuits et voyageurs de la confirmation, dans la langue du voyageur. */
function stayVars(b: Row): Vars {
  const fmt = (day: string) =>
    new Intl.DateTimeFormat(b.locale === "en" ? "en-GB" : b.locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
      new Date(`${day}T00:00:00Z`),
    );
  return {
    arrivee: fmt(b.arrival),
    depart: fmt(b.departure),
    nuits: String(nightsOf(b)),
    adultes: b.adults ? String(b.adults) : undefined,
    enfants: b.children ? String(b.children) : undefined,
    ...hourVars(b.locale, { arrivalHour: b.arrivalHour, departureHour: b.departureHour }),
  };
}

/** « +33620921005 » → « +33 6 20 92 10 05 ». */
function formatPhone(e164: string): string {
  const m = /^\+33(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(e164);
  return m ? `+33 ${m.slice(1).join(" ")}` : e164;
}

/** Valeurs des variables, en clair (PIN compris). Ne sortent que vers Beds24, le SMTP, ou `buildPreview` (masquées). */
async function variables(b: Row): Promise<Vars> {
  const wifi = getWifi();
  return {
    prenom: b.firstName,
    code: b.pin,
    guide: guideUrl(b.locale as GuideLocale),
    wifiReseau: wifi?.ssid,
    wifiMotDePasse: wifi?.password,
    telephone: formatPhone(PROPERTY_INFO.contact.phone),
    whatsapp: PROPERTY_INFO.contact.whatsapp,
    autour: aroundUrl(b.locale as GuideLocale),
    evenements: `${SITE_URL}/${b.locale}/blog#evenements`,
    adresse: PROPERTY_INFO.address.full,
    ...stayVars(b),
    avisGoogle: GOOGLE_REVIEW_URL,
    // Réservation directe seulement : on ne propose jamais de réserver en direct par la messagerie
    // d'une plateforme.
    // HomeToGo part par e-mail comme une directe (décision du 2026-11-21) mais n'a pas ce bloc :
    // le voyageur a réservé par une plateforme.
    direct: b.directBooking ? `${SITE_URL}/${b.locale}` : undefined,
  };
}

function deps(): DispatchDeps {
  const smtp = smtpConfigFrom(process.env);
  const testTo = testRecipientFrom(process.env);
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
    test: testTo
      ? { to: testTo, record: (b, t, e) => ecrireRegistre(b.id, testLedgerCode(t.id), ledgerText({ ...e, version: t.version })) }
      : undefined,
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
    const plan = planByMode(rows, TEMPLATES, now, m);
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
