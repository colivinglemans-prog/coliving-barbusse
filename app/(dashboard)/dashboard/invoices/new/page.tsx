"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DashboardNav from "@/components/dashboard/DashboardNav";
import InvoiceForm from "@/components/dashboard/InvoiceForm";
import { emptyPayload, type InvoicePayload } from "@/lib/invoice-payload";

function NewInvoiceContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") ?? "";
  const stripeId = searchParams.get("stripeId") ?? "";
  const source: "beds24" | "stripe" | "empty" = bookingId
    ? "beds24"
    : stripeId
      ? "stripe"
      : "empty";

  const [payload, setPayload] = useState<InvoicePayload | null>(null);
  const [loading, setLoading] = useState(source !== "empty");
  const [prefillError, setPrefillError] = useState<string | null>(null);

  useEffect(() => {
    if (source === "empty") {
      setPayload(emptyPayload());
      return;
    }

    async function fetchPrefill() {
      try {
        setLoading(true);
        setPrefillError(null);
        const query = source === "beds24"
          ? `bookingId=${encodeURIComponent(bookingId)}`
          : `stripeId=${encodeURIComponent(stripeId)}`;
        const res = await fetch(`/api/dashboard/invoices/prefill?${query}`);
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.error ?? "Échec du pré-remplissage");
        }
        setPayload(body.payload as InvoicePayload);
      } catch (err) {
        setPrefillError(err instanceof Error ? err.message : "Erreur inconnue");
        setPayload(emptyPayload());
      } finally {
        setLoading(false);
      }
    }
    fetchPrefill();
  }, [source, bookingId, stripeId]);

  const title =
    source === "beds24"
      ? `Nouvelle facture — Beds24 #${bookingId}`
      : source === "stripe"
        ? `Nouvelle facture — Stripe ${stripeId}`
        : "Nouvelle facture";

  const prefillLabel =
    source === "beds24" ? "Pré-remplissage Beds24 impossible" : "Pré-remplissage Stripe impossible";

  return (
    <>
      <DashboardNav role="admin" />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/dashboard/invoices" className="hover:text-rose-500">
            ← Factures
          </Link>
        </div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">{title}</h1>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
          </div>
        )}

        {prefillError && (
          <div className="mb-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">{prefillLabel}</p>
            <p className="mt-1">{prefillError}</p>
            <p className="mt-2 text-xs">
              Le formulaire reste utilisable : remplis les champs manuellement.
            </p>
          </div>
        )}

        {!loading && payload && (
          <InvoiceForm
            initial={payload}
            bookingId={source === "beds24" ? bookingId : undefined}
            stripeId={source === "stripe" ? stripeId : undefined}
          />
        )}
      </div>
    </>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
        </div>
      }
    >
      <NewInvoiceContent />
    </Suspense>
  );
}
