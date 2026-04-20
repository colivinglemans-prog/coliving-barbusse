import { normalizeChannel, type Channel } from "./channel";
import type { Beds24Booking, Beds24InvoiceItem } from "./types";

export type Provenance = "France" | "Étranger" | "Inconnue";

const TAX_DESCRIPTION_RE = /\btax(es?)?\b|\btaxes?\s*\d/i;
const TAX_EXCLUDE_RE = /service\s*fee|commission|cleaning|m[ée]nage|housekeeping|vat|tva/i;
const FRANCE_COUNTRY_CODES = new Set(["fr", "france"]);
const ADDRESS_FRANCE_RE = /\bfrance\b/i;
const FRENCH_POSTCODE_RE = /\b\d{5}\b/;

interface CollectedTaxResult {
  total: number;
  descriptions: string[];
}

function detectCollectedTax(items?: Beds24InvoiceItem[]): CollectedTaxResult | null {
  if (!items || items.length === 0) return null;
  let total = 0;
  const descriptions: string[] = [];
  for (const item of items) {
    if ((item.type ?? "").toLowerCase() === "payment") continue;
    const desc = item.description ?? "";
    if (!desc) continue;
    if (!TAX_DESCRIPTION_RE.test(desc)) continue;
    if (TAX_EXCLUDE_RE.test(desc)) continue;
    const qty = typeof item.qty === "number" ? item.qty : 1;
    const amount = typeof item.amount === "number" ? item.amount : 0;
    const line = typeof item.lineTotal === "number" ? item.lineTotal : amount * qty;
    total += line;
    descriptions.push(`${desc.trim()} → ${line.toFixed(2)} €`);
  }
  if (descriptions.length === 0) return null;
  return { total: Math.round(total * 100) / 100, descriptions };
}

function detectProvenanceFromPhone(phone?: string): Provenance | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s.\-()]/g, "");
  if (!cleaned) return null;
  if (cleaned.startsWith("+33") || cleaned.startsWith("0033")) return "France";
  if (cleaned.startsWith("+") || /^00[^0]/.test(cleaned)) return "Étranger";
  // French national format: starts with 0 and has 9-10 digits
  if (/^0[1-9]\d{8}$/.test(cleaned)) return "France";
  return null;
}

function detectProvenance(booking: Pick<Beds24Booking, "country" | "phone" | "mobile" | "address">): Provenance {
  const c = (booking.country ?? "").trim().toLowerCase();
  if (c) {
    if (FRANCE_COUNTRY_CODES.has(c)) return "France";
    return "Étranger";
  }

  const phoneProvenance =
    detectProvenanceFromPhone(booking.phone) ?? detectProvenanceFromPhone(booking.mobile);
  if (phoneProvenance) return phoneProvenance;

  const address = booking.address ?? "";
  if (ADDRESS_FRANCE_RE.test(address)) return "France";
  if (address && !FRENCH_POSTCODE_RE.test(address)) {
    // Adresse renseignée sans code postal français à 5 chiffres → probable étranger
    return "Étranger";
  }

  return "Inconnue";
}

function extractFrenchPostcode(booking: Pick<Beds24Booking, "postcode" | "address">): string {
  const postcode = (booking.postcode ?? "").trim();
  if (/^\d{5}$/.test(postcode)) return postcode;
  const addressMatch = (booking.address ?? "").match(/\b\d{5}\b/);
  return addressMatch ? addressMatch[0] : "";
}

function buildProvenanceDetail(
  provenance: Provenance,
  booking: Pick<Beds24Booking, "country" | "postcode" | "address">,
): string {
  if (provenance === "France") {
    return extractFrenchPostcode(booking);
  }
  if (provenance === "Étranger") {
    const country = (booking.country ?? "").trim();
    // Ignore un "FR"/"France" qui serait dans country pour un étranger (improbable) — on prend la valeur brute
    return country;
  }
  return "";
}

export const TAXE_SEJOUR_CONFIG = {
  city: "Le Mans Métropole",
  regime: "Meublé de tourisme non classé",
  ratePercent: 0.025,              // 2,5 % du prix de vente HT par nuit par personne accueillie
  capPerPersonNight: 4.0,          // Plafond Part comm. : 4,00 € / pers / nuit
  departmentalRegionalRate: 0.10,  // +10 % Part départementale (Sarthe)
} as const;

export interface TaxeSejourLine {
  bookingId: number;
  channel: Channel;
  arrival: string;
  departure: string;
  nights: number;
  adults: number;
  children: number;
  priceHT: number;
  pricePerNightHT: number;
  taxPerPersonPerNight: number;
  taxTotal: number;
  taxCollected: number | null;          // taxe réellement perçue détectée dans les invoice items
  taxCollectedDetail: string[];         // lignes Beds24 ayant matché (pour audit tooltip)
  provenance: Provenance;
  provenanceDetail: string;      // code postal si France, pays brut si Étranger, "" sinon
  country: string;               // pays brut renvoyé par Beds24 (pour l'affichage)
  postcode: string;              // code postal brut (pour audit)
  phone: string;                 // phone ou mobile Beds24 (pour audit provenance)
  address: string;               // adresse Beds24 (pour audit provenance)
  quarter: string;
  month: string;
  guestName: string;
}

export interface QuarterTotals {
  key: string;
  label: string;
  months: MonthTotals[];
  bookingsCount: number;
  nightsCount: number;
  taxTotal: number;
  lines: TaxeSejourLine[];
}

export interface MonthTotals {
  key: string;
  label: string;
  bookingsCount: number;
  nightsCount: number;
  taxTotal: number;
}

export interface ChannelTotals {
  channel: Channel;
  bookingsCount: number;
  nightsCount: number;
  taxTotal: number;
  lines: TaxeSejourLine[];
}

const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function nightsBetween(arrival: string, departure: string): number {
  const msPerDay = 86400000;
  const diff = new Date(departure).getTime() - new Date(arrival).getTime();
  return Math.max(1, Math.round(diff / msPerDay));
}

function quarterKey(dateStr: string): { quarter: string; month: string } {
  const d = new Date(dateStr);
  const year = d.getUTCFullYear();
  const monthIdx = d.getUTCMonth();
  const q = Math.floor(monthIdx / 3) + 1;
  const month = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
  return { quarter: `${year}-Q${q}`, month };
}

export function computeTaxeSejour(booking: Beds24Booking): TaxeSejourLine {
  const { ratePercent, capPerPersonNight, departmentalRegionalRate } = TAXE_SEJOUR_CONFIG;

  const adults = Math.max(0, booking.numAdult ?? 0);
  const children = Math.max(0, booking.numChild ?? 0);
  const welcomedCount = Math.max(1, adults + children);
  const nights = nightsBetween(booking.arrival, booking.departure);
  const priceHT = Math.max(0, booking.price ?? 0);
  // L'extranet Le Mans utilise le prix par nuit HT arrondi à 2 décimales → on fait pareil
  // pour éviter des écarts de quelques centimes avec la déclaration officielle.
  const pricePerNightHT = Math.round((priceHT / nights) * 100) / 100;

  const base = (pricePerNightHT * ratePercent) / welcomedCount;
  const capped = Math.min(base, capPerPersonNight);
  const taxPerPersonPerNight = capped * (1 + departmentalRegionalRate);
  const taxTotal = taxPerPersonPerNight * adults * nights;

  const channel = normalizeChannel(booking.referer, booking.channel);
  const { quarter, month } = quarterKey(booking.departure);
  const guestName = [booking.firstName, booking.lastName].filter(Boolean).join(" ").trim() || "—";
  const collected = detectCollectedTax(booking.invoiceItems);
  const taxCollected = collected ? collected.total : null;
  const taxCollectedDetail = collected ? collected.descriptions : [];
  const country = booking.country ?? "";
  const provenance = detectProvenance(booking);
  const provenanceDetail = buildProvenanceDetail(provenance, booking);

  return {
    bookingId: booking.id,
    channel,
    arrival: booking.arrival,
    departure: booking.departure,
    nights,
    adults,
    children,
    priceHT,
    pricePerNightHT,
    taxPerPersonPerNight,
    taxTotal,
    taxCollected,
    taxCollectedDetail,
    provenance,
    provenanceDetail,
    country,
    postcode: booking.postcode ?? "",
    phone: booking.phone ?? booking.mobile ?? "",
    address: booking.address ?? "",
    quarter,
    month,
    guestName,
  };
}

export function groupByQuarter(lines: TaxeSejourLine[], year: number): QuarterTotals[] {
  const quarters: QuarterTotals[] = [1, 2, 3, 4].map((q) => ({
    key: `${year}-Q${q}`,
    label: `T${q} ${year}`,
    months: [],
    bookingsCount: 0,
    nightsCount: 0,
    taxTotal: 0,
    lines: [],
  }));

  for (let q = 1; q <= 4; q++) {
    for (let m = 0; m < 3; m++) {
      const monthIdx = (q - 1) * 3 + m;
      quarters[q - 1].months.push({
        key: `${year}-${String(monthIdx + 1).padStart(2, "0")}`,
        label: MONTH_LABELS[monthIdx],
        bookingsCount: 0,
        nightsCount: 0,
        taxTotal: 0,
      });
    }
  }

  for (const line of lines) {
    const quarter = quarters.find((qt) => qt.key === line.quarter);
    if (!quarter) continue;
    quarter.lines.push(line);
    quarter.bookingsCount += 1;
    quarter.nightsCount += line.nights;
    quarter.taxTotal += line.taxTotal;

    const month = quarter.months.find((mt) => mt.key === line.month);
    if (month) {
      month.bookingsCount += 1;
      month.nightsCount += line.nights;
      month.taxTotal += line.taxTotal;
    }
  }

  for (const q of quarters) {
    q.lines.sort((a, b) => a.departure.localeCompare(b.departure));
  }

  return quarters;
}

export function groupByChannel(lines: TaxeSejourLine[], channels: Channel[]): ChannelTotals[] {
  return channels.map((channel) => {
    const channelLines = lines
      .filter((l) => l.channel === channel)
      .sort((a, b) => a.departure.localeCompare(b.departure));
    return {
      channel,
      bookingsCount: channelLines.length,
      nightsCount: channelLines.reduce((sum, l) => sum + l.nights, 0),
      taxTotal: channelLines.reduce((sum, l) => sum + l.taxTotal, 0),
      lines: channelLines,
    };
  });
}
