import Stripe from "stripe";

let client: Stripe | null = null;

function getClient(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key);
  }
  return client;
}

export interface StripePaymentSummary {
  id: string;                 // payment intent id (pi_...)
  chargeId?: string;          // ch_...
  createdAt: string;          // ISO date string (YYYY-MM-DD)
  createdAtMs: number;        // epoch ms for sorting
  amount: number;             // major units (e.g. 123.45)
  currency: string;           // upper-case (EUR, USD…)
  customerName: string;
  customerEmail: string;
  description: string;
  receiptUrl: string | null;
  status: string;
}

function centsToAmount(cents: number, currency: string): number {
  // Zero-decimal currencies — rare, safe default is divide by 100.
  const zeroDecimal = new Set(["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"]);
  if (zeroDecimal.has(currency.toLowerCase())) return cents;
  return Math.round(cents) / 100;
}

function toSummary(pi: Stripe.PaymentIntent): StripePaymentSummary {
  const charge = (pi.latest_charge && typeof pi.latest_charge !== "string")
    ? pi.latest_charge
    : null;

  const billing = charge?.billing_details;
  const customer = (pi.customer && typeof pi.customer !== "string") ? pi.customer : null;

  const name = billing?.name
    ?? (customer && "name" in customer ? (customer.name ?? "") : "")
    ?? "";
  const email = billing?.email
    ?? (customer && "email" in customer ? (customer.email ?? "") : "")
    ?? pi.receipt_email
    ?? "";

  const createdMs = pi.created * 1000;
  const createdIso = new Date(createdMs).toISOString().split("T")[0];

  return {
    id: pi.id,
    chargeId: charge?.id,
    createdAt: createdIso,
    createdAtMs: createdMs,
    amount: centsToAmount(pi.amount_received || pi.amount, pi.currency),
    currency: pi.currency.toUpperCase(),
    customerName: name || "",
    customerEmail: email || "",
    description: pi.description ?? charge?.description ?? "",
    receiptUrl: charge?.receipt_url ?? null,
    status: pi.status,
  };
}

export async function listRecentPayments(opts?: {
  limit?: number;
  daysBack?: number;
}): Promise<StripePaymentSummary[]> {
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 100);
  const daysBack = Math.max(opts?.daysBack ?? 90, 1);
  const createdGte = Math.floor((Date.now() - daysBack * 86_400_000) / 1000);

  const list = await getClient().paymentIntents.list({
    limit,
    created: { gte: createdGte },
    expand: ["data.latest_charge", "data.customer"],
  });

  return list.data
    .filter((pi) => pi.status === "succeeded")
    .map(toSummary)
    .sort((a, b) => b.createdAtMs - a.createdAtMs);
}

export interface StripePaymentDetail extends StripePaymentSummary {
  addressLine1: string;
  city: string;
  postcode: string;
  state: string;
  country: string;
  phone: string;
}

export async function getStripePayment(id: string): Promise<StripePaymentDetail | null> {
  const pi = await getClient().paymentIntents.retrieve(id, {
    expand: ["latest_charge", "customer"],
  });

  if (!pi) return null;

  const summary = toSummary(pi);

  const charge = (pi.latest_charge && typeof pi.latest_charge !== "string")
    ? pi.latest_charge
    : null;
  const billing = charge?.billing_details;
  const addr = billing?.address;

  return {
    ...summary,
    phone: billing?.phone ?? "",
    addressLine1: addr?.line1 ?? "",
    city: addr?.city ?? "",
    postcode: addr?.postal_code ?? "",
    state: addr?.state ?? "",
    country: addr?.country ?? "",
  };
}
