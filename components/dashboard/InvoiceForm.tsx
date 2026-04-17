"use client";

import { useState } from "react";
import type { InvoicePayload } from "@/lib/invoice-payload";

interface Props {
  initial: InvoicePayload;
  bookingId?: string;
}

type FieldErrors = Partial<Record<keyof InvoicePayload, string>>;

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-300";

const labelClass = "mb-1 block text-xs font-medium text-gray-600";

export default function InvoiceForm({ initial, bookingId }: Props) {
  const [payload, setPayload] = useState<InvoicePayload>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function update<K extends keyof InvoicePayload>(key: K, value: InvoicePayload[K]) {
    setPayload((p) => ({ ...p, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/dashboard/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        if (Array.isArray(body.fields)) {
          const fe: FieldErrors = {};
          for (const f of body.fields) {
            fe[f.field as keyof InvoicePayload] = f.message;
          }
          setFieldErrors(fe);
        }
        setError(body.error ?? "Erreur lors de la génération du PDF");
        return;
      }

      const invoiceNumber = res.headers.get("X-Invoice-Number") ?? "facture";
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Client (facturé à)</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelClass}>Raison sociale (si entreprise)</label>
            <input
              className={inputClass}
              value={payload.company}
              onChange={(e) => update("company", e.target.value)}
              placeholder="Ex : ACCESS EQUIP MOTOS FRANCE"
            />
          </div>
          <div>
            <label className={labelClass}>Prénom *</label>
            <input
              className={inputClass}
              value={payload.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              required
            />
            {fieldErrors.firstName && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Nom *</label>
            <input
              className={inputClass}
              value={payload.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              required
            />
            {fieldErrors.lastName && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Adresse</label>
            <input
              className={inputClass}
              value={payload.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Code postal</label>
            <input
              className={inputClass}
              value={payload.postcode}
              onChange={(e) => update("postcode", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Ville</label>
            <input
              className={inputClass}
              value={payload.city}
              onChange={(e) => update("city", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Département / État</label>
            <input
              className={inputClass}
              value={payload.state}
              onChange={(e) => update("state", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Pays</label>
            <input
              className={inputClass}
              value={payload.country}
              onChange={(e) => update("country", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              className={inputClass}
              type="email"
              value={payload.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Téléphone</label>
            <input
              className={inputClass}
              value={payload.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Séjour</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className={labelClass}>Arrivée *</label>
            <input
              className={inputClass}
              type="date"
              value={payload.arrival}
              onChange={(e) => update("arrival", e.target.value)}
              required
            />
            {fieldErrors.arrival && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.arrival}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Départ *</label>
            <input
              className={inputClass}
              type="date"
              value={payload.departure}
              onChange={(e) => update("departure", e.target.value)}
              required
            />
            {fieldErrors.departure && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.departure}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Heure d&apos;arrivée</label>
            <input
              className={inputClass}
              value={payload.arrivalTime}
              onChange={(e) => update("arrivalTime", e.target.value)}
              placeholder="Ex : 17h30"
            />
          </div>
          <div>
            <label className={labelClass}>Adultes</label>
            <input
              className={inputClass}
              type="number"
              min={0}
              value={payload.numAdult}
              onChange={(e) => update("numAdult", Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelClass}>Enfants</label>
            <input
              className={inputClass}
              type="number"
              min={0}
              value={payload.numChild}
              onChange={(e) => update("numChild", Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelClass}>Réf. Beds24</label>
            <input
              className={`${inputClass} bg-gray-50 text-gray-500`}
              value={payload.reference}
              readOnly
            />
          </div>
          <div className="md:col-span-3">
            <label className={labelClass}>
              Demandes du client (imprimées sur la facture)
            </label>
            <textarea
              className={inputClass}
              rows={3}
              value={payload.comments}
              onChange={(e) => update("comments", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Montant &amp; paiement</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelClass}>Description *</label>
            <textarea
              className={inputClass}
              rows={2}
              value={payload.description}
              onChange={(e) => update("description", e.target.value)}
              required
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Montant total TTC (€) *</label>
            <input
              className={inputClass}
              type="number"
              step="0.01"
              min="0"
              value={payload.amount}
              onChange={(e) => update("amount", Number(e.target.value))}
              required
            />
            {fieldErrors.amount && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.amount}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Date limite de paiement *</label>
            <input
              className={inputClass}
              type="date"
              value={payload.paymentDueDate}
              onChange={(e) => update("paymentDueDate", e.target.value)}
              required
            />
            {fieldErrors.paymentDueDate && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.paymentDueDate}</p>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          TVA non applicable (art. 293B du CGI — LMNP). Le numéro de facture sera
          utilisé comme libellé du virement, et sera alloué séquentiellement à la
          génération.
        </p>
      </section>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center justify-end gap-3">
        {bookingId && (
          <span className="text-xs text-gray-500">
            Pré-rempli depuis Beds24 #{bookingId}
          </span>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-rose-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {submitting ? "Génération…" : "Générer le PDF"}
        </button>
      </div>
    </form>
  );
}
