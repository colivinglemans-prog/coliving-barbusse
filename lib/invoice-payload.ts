import type { Beds24Booking } from "./types";

export interface InvoicePayload {
  // Client
  company: string;
  firstName: string;
  lastName: string;
  address: string;
  postcode: string;
  city: string;
  state: string;
  country: string;
  email: string;
  phone: string;

  // Séjour
  arrival: string;
  departure: string;
  arrivalTime: string;
  numAdult: number;
  numChild: number;
  reference: string;
  comments: string;

  // Montant
  amount: number;
  description: string;
  paymentDueDate: string;
}

function nightsBetween(arrival: string, departure: string): number {
  const a = new Date(arrival + "T00:00:00Z").getTime();
  const d = new Date(departure + "T00:00:00Z").getTime();
  const diff = Math.round((d - a) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
}

const SALUTATION_RE =
  /^(m|m\.|mr|mr\.|mister|monsieur|mme|mme\.|mrs|mrs\.|madame|madam|mlle|mlle\.|miss|ms|ms\.|mademoiselle|dr|dr\.|docteur|doctor|prof|prof\.|pr\.|sir)$/i;

/** Returns the title value if it looks like a company name (not a salutation), otherwise empty. */
function companyFromTitle(title?: string): string {
  const t = (title ?? "").trim();
  if (!t) return "";
  if (SALUTATION_RE.test(t)) return "";
  if (t.length < 2) return "";
  return t;
}

function defaultPaymentDueDate(arrival: string): string {
  const arrivalMs = new Date(arrival + "T00:00:00Z").getTime();
  const minDue = Date.now() + 3 * 24 * 60 * 60 * 1000;
  const niceDue = arrivalMs - 14 * 24 * 60 * 60 * 1000;
  const due = Math.max(niceDue, minDue);
  return new Date(due).toISOString().split("T")[0];
}

function formatDateFr(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function beds24ToPayload(booking: Beds24Booking): InvoicePayload {
  const nights = nightsBetween(booking.arrival, booking.departure);
  const description = `Location saisonnière du ${formatDateFr(booking.arrival)} au ${formatDateFr(booking.departure)}\n(${nights} nuit${nights > 1 ? "s" : ""})`;

  const company = (booking.company ?? "").trim() || companyFromTitle(booking.title);

  return {
    company,
    firstName: booking.firstName ?? "",
    lastName: booking.lastName ?? "",
    address: booking.address ?? "",
    postcode: booking.postcode ?? "",
    city: booking.city ?? "",
    state: booking.state ?? "",
    country: booking.country ?? "France",
    email: booking.email ?? "",
    phone: booking.mobile ?? booking.phone ?? "",

    arrival: booking.arrival,
    departure: booking.departure,
    arrivalTime: booking.arrivalTime ?? "",
    numAdult: booking.numAdult ?? 0,
    numChild: booking.numChild ?? 0,
    reference: String(booking.id),
    comments: booking.comments ?? "",

    amount: Number(booking.price ?? 0),
    description,
    paymentDueDate: defaultPaymentDueDate(booking.arrival),
  };
}

export function emptyPayload(): InvoicePayload {
  const today = new Date().toISOString().split("T")[0];
  return {
    company: "",
    firstName: "",
    lastName: "",
    address: "",
    postcode: "",
    city: "",
    state: "",
    country: "France",
    email: "",
    phone: "",
    arrival: today,
    departure: today,
    arrivalTime: "",
    numAdult: 1,
    numChild: 0,
    reference: "",
    comments: "",
    amount: 0,
    description: "",
    paymentDueDate: today,
  };
}

export interface PayloadValidationError {
  field: keyof InvoicePayload;
  message: string;
}

export function validateInvoicePayload(
  raw: unknown,
): { ok: true; payload: InvoicePayload } | { ok: false; errors: PayloadValidationError[] } {
  const errors: PayloadValidationError[] = [];

  if (typeof raw !== "object" || raw === null) {
    return {
      ok: false,
      errors: [{ field: "firstName", message: "Payload invalide" }],
    };
  }

  const r = raw as Record<string, unknown>;

  function str(field: keyof InvoicePayload, required = false): string {
    const v = r[field];
    if (typeof v !== "string") {
      if (required) errors.push({ field, message: "Champ requis" });
      return "";
    }
    const t = v.trim();
    if (required && !t) errors.push({ field, message: "Champ requis" });
    return t;
  }

  function num(field: keyof InvoicePayload, required = false): number {
    const v = r[field];
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) {
      if (required) errors.push({ field, message: "Nombre invalide" });
      return 0;
    }
    return n;
  }

  function date(field: keyof InvoicePayload, required = false): string {
    const v = str(field, required);
    if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      errors.push({ field, message: "Date au format AAAA-MM-JJ" });
    }
    return v;
  }

  const payload: InvoicePayload = {
    company: str("company"),
    firstName: str("firstName", true),
    lastName: str("lastName", true),
    address: str("address"),
    postcode: str("postcode"),
    city: str("city"),
    state: str("state"),
    country: str("country") || "France",
    email: str("email"),
    phone: str("phone"),
    arrival: date("arrival", true),
    departure: date("departure", true),
    arrivalTime: str("arrivalTime"),
    numAdult: Math.max(0, Math.floor(num("numAdult"))),
    numChild: Math.max(0, Math.floor(num("numChild"))),
    reference: str("reference"),
    comments: str("comments"),
    amount: num("amount", true),
    description: str("description", true),
    paymentDueDate: date("paymentDueDate", true),
  };

  if (payload.amount <= 0) {
    errors.push({ field: "amount", message: "Le montant doit être supérieur à 0" });
  }

  if (payload.arrival && payload.departure && payload.arrival >= payload.departure) {
    errors.push({ field: "departure", message: "La date de départ doit être après l'arrivée" });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, payload };
}

export function computeNights(payload: InvoicePayload): number {
  return nightsBetween(payload.arrival, payload.departure);
}
