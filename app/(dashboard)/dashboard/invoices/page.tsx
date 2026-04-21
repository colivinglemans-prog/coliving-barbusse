"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Beds24Booking } from "@/lib/types";
import DashboardNav from "@/components/dashboard/DashboardNav";

function formatDateFr(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatEur(n: number, currency = "EUR"): string {
  const [intPart, decPart] = Math.abs(n).toFixed(2).split(".");
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sign = n < 0 ? "-" : "";
  const symbol = currency === "EUR" ? "€" : currency;
  return `${sign}${withSep},${decPart} ${symbol}`;
}

type ChannelKey = "airbnb" | "booking" | "abritel" | "direct" | "other";

function normalizeChannel(referer: string, channel?: string): ChannelKey {
  const c = (channel ?? "").toLowerCase();
  const r = (referer ?? "").toLowerCase();
  if (c === "airbnb" || r.includes("airbnb")) return "airbnb";
  if (c.includes("booking") || r.includes("booking")) return "booking";
  if (
    c.includes("abritel") ||
    r.includes("abritel") ||
    r.includes("homeaway") ||
    r.includes("vrbo")
  )
    return "abritel";
  if (c === "direct" || c === "app" || c === "" || r === "") return "direct";
  return "other";
}

function isInquiry(status: string): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "inquiry" || s === "request" || s === "new";
}

type FilterKey = "all" | "inquiry" | "direct" | "airbnb" | "booking" | "abritel";

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "Tous",
  inquiry: "Inquiries",
  direct: "Direct",
  airbnb: "Airbnb",
  booking: "Booking",
  abritel: "Abritel",
};

interface StripePaymentRow {
  id: string;
  createdAt: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  description: string;
  receiptUrl: string | null;
}

type SourceTab = "beds24" | "stripe";

export default function InvoicesListPage() {
  const [tab, setTab] = useState<SourceTab>("beds24");

  // Beds24 state
  const [bookings, setBookings] = useState<Beds24Booking[]>([]);
  const [beds24Loading, setBeds24Loading] = useState(true);
  const [beds24Error, setBeds24Error] = useState("");
  const [manualId, setManualId] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  // Stripe state
  const [stripePayments, setStripePayments] = useState<StripePaymentRow[]>([]);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState("");
  const [stripeFetched, setStripeFetched] = useState(false);
  const [manualStripeId, setManualStripeId] = useState("");

  useEffect(() => {
    async function fetchBookings() {
      try {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const to = new Date(now.getFullYear(), now.getMonth() + 13, 0);
        const arrivalFrom = from.toISOString().split("T")[0];
        const arrivalTo = to.toISOString().split("T")[0];
        const res = await fetch(
          `/api/dashboard/bookings?arrivalFrom=${arrivalFrom}&arrivalTo=${arrivalTo}`,
        );
        if (!res.ok) throw new Error("Erreur de chargement des réservations");
        const data: Beds24Booking[] = await res.json();
        setBookings(data);
      } catch (err) {
        setBeds24Error(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setBeds24Loading(false);
      }
    }
    fetchBookings();
  }, []);

  useEffect(() => {
    if (tab !== "stripe" || stripeFetched) return;
    async function fetchStripe() {
      try {
        setStripeLoading(true);
        const res = await fetch("/api/dashboard/invoices/stripe-payments?limit=50&daysBack=90");
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error ?? "Erreur Stripe");
        setStripePayments(body as StripePaymentRow[]);
      } catch (err) {
        setStripeError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setStripeLoading(false);
        setStripeFetched(true);
      }
    }
    fetchStripe();
  }, [tab, stripeFetched]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: bookings.length,
      inquiry: 0,
      direct: 0,
      airbnb: 0,
      booking: 0,
      abritel: 0,
    };
    for (const b of bookings) {
      if (isInquiry(b.status)) c.inquiry += 1;
      const key = normalizeChannel(b.referer, b.channel);
      if (key === "direct") c.direct += 1;
      else if (key === "airbnb") c.airbnb += 1;
      else if (key === "booking") c.booking += 1;
      else if (key === "abritel") c.abritel += 1;
    }
    return c;
  }, [bookings]);

  const filtered = useMemo(() => {
    if (filter === "all") return bookings;
    if (filter === "inquiry") return bookings.filter((b) => isInquiry(b.status));
    return bookings.filter(
      (b) => normalizeChannel(b.referer, b.channel) === filter,
    );
  }, [bookings, filter]);

  const sortedBookings = useMemo(
    () =>
      [...filtered].sort((a, b) =>
        (b.arrival ?? "").localeCompare(a.arrival ?? ""),
      ),
    [filtered],
  );

  return (
    <>
      <DashboardNav role="admin" />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
          <Link
            href="/dashboard/invoices/new"
            className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            + Nouvelle facture manuelle
          </Link>
        </div>

        {/* Tabs Beds24 / Stripe */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          {(["beds24", "stripe"] as const).map((key) => {
            const label = key === "beds24" ? "Beds24" : "Stripe";
            const isActive = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-rose-500 text-rose-500"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {tab === "beds24" && (
          <>
            <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-gray-700">
                Générer depuis un ID Beds24 précis
              </h2>
              <p className="mb-3 text-xs text-gray-500">
                Pratique pour les inquiries en attente qui n&apos;apparaissent pas
                encore dans la liste ci-dessous.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = manualId.trim();
                  if (!trimmed) return;
                  window.location.href = `/dashboard/invoices/new?bookingId=${encodeURIComponent(trimmed)}`;
                }}
                className="flex gap-2"
              >
                <input
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="ID Beds24 (ex : 85475544)"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-300"
                />
                <button
                  type="submit"
                  className="rounded-full bg-rose-500 px-5 py-2 text-sm font-medium text-white hover:bg-rose-600"
                >
                  Ouvrir
                </button>
              </form>
            </div>

            {beds24Loading && (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
              </div>
            )}

            {beds24Error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {beds24Error}
              </div>
            )}

            {!beds24Loading && !beds24Error && (
              <>
                <div className="mb-4 flex flex-wrap gap-2">
                  {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => {
                    const isActive = filter === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                          isActive
                            ? "border-rose-500 bg-rose-500 text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {FILTER_LABELS[key]}
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                            isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {counts[key]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Arrivée</th>
                        <th className="px-4 py-3">Départ</th>
                        <th className="px-4 py-3">Client</th>
                        <th className="px-4 py-3">Canal</th>
                        <th className="px-4 py-3">Statut</th>
                        <th className="px-4 py-3 text-right">Montant</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sortedBookings.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            Aucune réservation sur la période.
                          </td>
                        </tr>
                      )}
                      {sortedBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{formatDateFr(b.arrival)}</td>
                          <td className="px-4 py-3">{formatDateFr(b.departure)}</td>
                          <td className="px-4 py-3">
                            {b.firstName} {b.lastName}
                            <span className="ml-2 text-xs text-gray-400">#{b.id}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {b.channel || b.referer}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{b.status}</td>
                          <td className="px-4 py-3 text-right">
                            {formatEur(b.price ?? 0)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/dashboard/invoices/new?bookingId=${b.id}`}
                              className="rounded-full bg-rose-500 px-3 py-1 text-xs font-medium text-white hover:bg-rose-600"
                            >
                              Créer une facture
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {tab === "stripe" && (
          <>
            <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-gray-700">
                Générer depuis un ID Stripe précis
              </h2>
              <p className="mb-3 text-xs text-gray-500">
                Colle un Payment Intent (pi_…) ou un Charge (ch_…).
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = manualStripeId.trim();
                  if (!trimmed) return;
                  window.location.href = `/dashboard/invoices/new?stripeId=${encodeURIComponent(trimmed)}`;
                }}
                className="flex gap-2"
              >
                <input
                  value={manualStripeId}
                  onChange={(e) => setManualStripeId(e.target.value)}
                  placeholder="ID Stripe (ex : pi_3Mxxxxx)"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-300"
                />
                <button
                  type="submit"
                  className="rounded-full bg-rose-500 px-5 py-2 text-sm font-medium text-white hover:bg-rose-600"
                >
                  Ouvrir
                </button>
              </form>
            </div>

            {stripeLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
              </div>
            )}

            {stripeError && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                <p className="font-medium">Impossible de charger les paiements Stripe</p>
                <p className="mt-1">{stripeError}</p>
                <p className="mt-2 text-xs">
                  Vérifie que <code>STRIPE_SECRET_KEY</code> est bien définie dans
                  l&apos;environnement.
                </p>
              </div>
            )}

            {!stripeLoading && !stripeError && (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Montant</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stripePayments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          Aucun paiement Stripe réussi sur les 90 derniers jours.
                        </td>
                      </tr>
                    )}
                    {stripePayments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{formatDateFr(p.createdAt)}</td>
                        <td className="px-4 py-3">
                          {p.customerName || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {p.customerEmail || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {p.description || <span className="text-gray-400">—</span>}
                          <span className="ml-2 text-xs text-gray-400">{p.id}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatEur(p.amount, p.currency)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/dashboard/invoices/new?stripeId=${p.id}`}
                            className="rounded-full bg-rose-500 px-3 py-1 text-xs font-medium text-white hover:bg-rose-600"
                          >
                            Créer une facture
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
