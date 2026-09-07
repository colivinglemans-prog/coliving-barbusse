"use client";

import { useState } from "react";
import type { InvoiceKind, InvoicePayload } from "@/lib/invoice-payload";

interface Props {
  initial: InvoicePayload;
  bookingId?: string;
  stripeId?: string;
}

type FieldErrors = Partial<Record<keyof InvoicePayload, string>>;

interface GeneratedInvoice {
  number: string;
  payload: InvoicePayload;
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-300";

const labelClass = "mb-1 block text-xs font-medium text-gray-600";

function formatDateFr(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatEur(n: number): string {
  const [intPart, decPart] = Math.abs(n).toFixed(2).split(".");
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sign = n < 0 ? "-" : "";
  return `${sign}${withSep},${decPart} €`;
}

function buildFullEmail(g: GeneratedInvoice): string {
  const p = g.payload;
  const firstName = p.firstName || "Madame, Monsieur";

  if (p.paid) {
    return `Objet : Votre facture n° ${g.number} — Coliving Barbusse

Bonjour ${firstName},

Merci pour votre réservation au Coliving Barbusse.

Vous trouverez ci-joint votre facture acquittée (n° ${g.number}) correspondant à votre paiement de ${formatEur(p.amount)} reçu le ${formatDateFr(p.paidAt)}.

Cette facture vaut reçu — aucun règlement supplémentaire n'est attendu.

N'hésitez pas si vous avez la moindre question — par email ou directement sur WhatsApp au +33 6 20 92 10 05.

Bien cordialement,
Alexandre
Coliving Barbusse — https://coliving-barbusse.vercel.app`;
  }

  const subject =
    p.kind === "acompte"
      ? `Objet : Votre réservation — facture d'acompte n° ${g.number} (paiement par virement)`
      : p.kind === "solde"
        ? `Objet : Votre séjour — facture de solde n° ${g.number} (paiement par virement)`
        : `Objet : Votre demande de réservation — facture n° ${g.number} (paiement par virement)`;

  const recap =
    p.kind === "acompte"
      ? `- Total du séjour : ${formatEur(p.stayTotal)}
- Acompte à régler maintenant : ${formatEur(p.amount)}
- Solde de ${formatEur(p.stayTotal - p.amount)} à régler ultérieurement
- Référence à indiquer dans le libellé du virement : ${g.number}
- Date limite de paiement : ${formatDateFr(p.paymentDueDate)}`
      : p.kind === "solde"
        ? `- Total du séjour : ${formatEur(p.stayTotal)}
- Acompte déjà réglé (facture n° ${p.priorInvoiceNumber}) : ${formatEur(p.priorInvoiceAmount)}
- Solde à régler : ${formatEur(p.amount)}
- Référence à indiquer dans le libellé du virement : ${g.number}
- Date limite de paiement : ${formatDateFr(p.paymentDueDate)}`
        : `- Montant : ${formatEur(p.amount)}
- Référence à indiquer dans le libellé du virement : ${g.number}
- Date limite de paiement : ${formatDateFr(p.paymentDueDate)}`;

  const closing =
    p.kind === "acompte"
      ? `Dès réception du virement, votre réservation est ferme. L'acompte n'est pas remboursable et vient en déduction du solde. Je vous transmettrai la facture de solde ainsi que les informations pratiques (code d'accès de la serrure connectée, arrivée à partir de 17h, guide d'arrivée) avant votre venue.`
      : p.kind === "solde"
        ? `Dès réception du virement, je vous transmets les informations pratiques (code d'accès de la serrure connectée, arrivée à partir de 17h, guide d'arrivée).`
        : `Dès réception du virement, je vous confirme la réservation et vous transmets les informations pratiques (code d'accès de la serrure connectée, arrivée à partir de 17h, guide d'arrivée).`;

  return `${subject}

Bonjour ${firstName},

Merci pour votre demande de réservation du ${formatDateFr(p.arrival)} au ${formatDateFr(p.departure)} au Coliving Barbusse.

Vous trouverez ci-joint la facture correspondante pour un règlement par virement bancaire.

Récapitulatif
${recap}

Les coordonnées bancaires (IBAN / BIC) figurent sur la facture.

${closing}

N'hésitez pas si vous avez la moindre question — par email ou directement sur WhatsApp au +33 6 20 92 10 05.

Bien cordialement,
Alexandre
Coliving Barbusse — https://coliving-barbusse.vercel.app`;
}

function buildShortMessage(g: GeneratedInvoice): string {
  const p = g.payload;
  const firstName = p.firstName || "bonjour";

  if (p.paid) {
    return `Bonjour ${firstName}, vous trouverez ci-joint votre facture acquittée n° ${g.number} (${formatEur(p.amount)}, réglée par carte le ${formatDateFr(p.paidAt)}). Merci pour votre réservation. Bien cordialement, Alexandre.`;
  }

  if (p.kind === "acompte") {
    return `Bonjour ${firstName}, merci pour votre demande. Vous trouverez ci-joint la facture d'acompte n° ${g.number} : ${formatEur(p.amount)} à régler par virement avant le ${formatDateFr(p.paymentDueDate)} en indiquant ${g.number} en libellé, sur un total de séjour de ${formatEur(p.stayTotal)}. Le solde de ${formatEur(p.stayTotal - p.amount)} sera facturé avant votre arrivée. Les IBAN/BIC sont sur la facture. Bien cordialement, Alexandre.`;
  }

  if (p.kind === "solde") {
    return `Bonjour ${firstName}, vous trouverez ci-joint la facture de solde n° ${g.number} : ${formatEur(p.amount)} à régler par virement avant le ${formatDateFr(p.paymentDueDate)} en indiquant ${g.number} en libellé (total du séjour ${formatEur(p.stayTotal)}, acompte de ${formatEur(p.priorInvoiceAmount)} déjà réglé). Les IBAN/BIC sont sur la facture. Bien cordialement, Alexandre.`;
  }

  return `Bonjour ${firstName}, merci pour votre demande. Vous trouverez ci-joint la facture n° ${g.number} pour un règlement par virement : ${formatEur(p.amount)}, à régler avant le ${formatDateFr(p.paymentDueDate)} en indiquant ${g.number} en libellé. Les IBAN/BIC sont sur la facture. Je confirme la réservation dès réception du virement. Bien cordialement, Alexandre.`;
}

export default function InvoiceForm({ initial, bookingId, stripeId }: Props) {
  const [payload, setPayload] = useState<InvoicePayload>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generated, setGenerated] = useState<GeneratedInvoice | null>(null);
  const [copied, setCopied] = useState<"full" | "short" | null>(null);

  async function copyToClipboard(text: string, which: "full" | "short") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Impossible de copier dans le presse-papiers");
    }
  }

  function update<K extends keyof InvoicePayload>(key: K, value: InvoicePayload[K]) {
    setPayload((p) => ({ ...p, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
    }
  }

  /** Passe en acompte/solde/standard en remettant à zéro les champs devenus inutiles. */
  function setKind(kind: InvoiceKind) {
    setPayload((p) => ({
      ...p,
      kind,
      stayTotal: kind === "standard" ? 0 : p.stayTotal || p.amount,
      priorInvoiceNumber: kind === "solde" ? p.priorInvoiceNumber : "",
      priorInvoiceDate: kind === "solde" ? p.priorInvoiceDate : "",
      priorInvoiceAmount: kind === "solde" ? p.priorInvoiceAmount : 0,
    }));
    setFieldErrors({});
  }

  /** Acompte : fixe le montant à un pourcentage du total du séjour. */
  function applyDepositRate(rate: number) {
    setPayload((p) => ({
      ...p,
      amount: Math.round(p.stayTotal * rate * 100) / 100,
    }));
  }

  /** Solde : montant = total du séjour − acompte déjà facturé. */
  function applyBalance() {
    setPayload((p) => ({
      ...p,
      amount: Math.round((p.stayTotal - p.priorInvoiceAmount) * 100) / 100,
    }));
  }

  async function runGenerate(preview: boolean) {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await fetch(
        `/api/dashboard/invoices/generate${preview ? "?preview=1" : ""}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

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
      a.download = preview ? "apercu-facture.pdf" : `facture-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      // Un aperçu ne porte pas de numéro : pas de modèles d'email à proposer.
      if (!preview) setGenerated({ number: invoiceNumber, payload });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runGenerate(false);
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

        <div className="mb-4">
          <label className={labelClass}>Type de facture</label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["standard", "Séjour complet"],
                ["acompte", "Acompte"],
                ["solde", "Solde"],
              ] as [InvoiceKind, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  payload.kind === k
                    ? "bg-rose-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {payload.kind !== "standard" && (
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Total TTC du séjour (€) *</label>
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  min="0"
                  value={payload.stayTotal}
                  onChange={(e) => update("stayTotal", Number(e.target.value))}
                  required
                />
                {fieldErrors.stayTotal && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.stayTotal}</p>
                )}
              </div>

              {payload.kind === "acompte" ? (
                <div>
                  <label className={labelClass}>Calculer l&apos;acompte</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[0.2, 0.3, 0.4, 0.5].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => applyDepositRate(r)}
                        disabled={payload.stayTotal <= 0}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {r * 100} %
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Reste à régler :{" "}
                    <strong>
                      {formatEur(Math.max(0, payload.stayTotal - payload.amount))}
                    </strong>
                  </p>
                </div>
              ) : (
                <div>
                  <label className={labelClass}>Montant de l&apos;acompte déjà facturé (€) *</label>
                  <input
                    className={inputClass}
                    type="number"
                    step="0.01"
                    min="0"
                    value={payload.priorInvoiceAmount}
                    onChange={(e) => update("priorInvoiceAmount", Number(e.target.value))}
                    required
                  />
                  {fieldErrors.priorInvoiceAmount && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.priorInvoiceAmount}</p>
                  )}
                </div>
              )}
            </div>

            {payload.kind === "solde" && (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>N° facture d&apos;acompte *</label>
                  <input
                    className={inputClass}
                    value={payload.priorInvoiceNumber}
                    onChange={(e) => update("priorInvoiceNumber", e.target.value)}
                    placeholder="Ex : 2026-014"
                    required
                  />
                  {fieldErrors.priorInvoiceNumber && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.priorInvoiceNumber}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Date de l&apos;acompte *</label>
                  <input
                    className={inputClass}
                    type="date"
                    value={payload.priorInvoiceDate}
                    onChange={(e) => update("priorInvoiceDate", e.target.value)}
                    required
                  />
                  {fieldErrors.priorInvoiceDate && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.priorInvoiceDate}</p>
                  )}
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={applyBalance}
                    disabled={payload.stayTotal <= 0}
                    className="w-full rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Calculer le solde
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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
            <label className={labelClass}>
              {payload.kind === "acompte"
                ? "Montant de l'acompte (€) *"
                : payload.kind === "solde"
                  ? "Montant du solde (€) *"
                  : "Montant total TTC (€) *"}
            </label>
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
          {!payload.paid && (
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
          )}
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-400"
              checked={payload.paid}
              onChange={(e) => update("paid", e.target.checked)}
            />
            Déjà payé (facture acquittée — reçu)
          </label>

          {payload.paid && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className={labelClass}>Date de paiement *</label>
                <input
                  className={inputClass}
                  type="date"
                  value={payload.paidAt}
                  onChange={(e) => update("paidAt", e.target.value)}
                  required
                />
                {fieldErrors.paidAt && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.paidAt}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Méthode *</label>
                <input
                  className={inputClass}
                  value={payload.paidMethod}
                  onChange={(e) => update("paidMethod", e.target.value)}
                  placeholder="Ex : Carte bancaire via Stripe"
                  required
                />
                {fieldErrors.paidMethod && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.paidMethod}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Référence transaction</label>
                <input
                  className={inputClass}
                  value={payload.paidReference}
                  onChange={(e) => update("paidReference", e.target.value)}
                  placeholder="Ex : pi_3M..."
                />
              </div>
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-gray-500">
          TVA non applicable (art. 293B du CGI — LMNP). Le numéro de facture sera
          alloué séquentiellement à la génération. Pour une facture virement, il
          sert aussi de libellé de virement.
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
        {stripeId && (
          <span className="text-xs text-gray-500">
            Pré-rempli depuis Stripe {stripeId}
          </span>
        )}
        <button
          type="button"
          onClick={() => runGenerate(true)}
          disabled={submitting}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-gray-700 ring-1 ring-gray-300 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="Génère le PDF sans consommer de numéro de facture"
        >
          Aperçu
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-rose-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {submitting ? "Génération…" : "Générer le PDF"}
        </button>
      </div>

      {generated && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Facture n° {generated.number} générée ✓
              </p>
              <p className="mt-0.5 text-xs text-emerald-800">
                Le PDF a été téléchargé. Voici un modèle d&apos;email à envoyer au client.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-emerald-900">
                  Email complet (pièce jointe = facture-{generated.number}.pdf)
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(buildFullEmail(generated), "full")}
                  className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  {copied === "full" ? "Copié ✓" : "Copier"}
                </button>
              </div>
              <textarea
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 font-mono text-xs text-gray-800"
                rows={14}
                readOnly
                value={buildFullEmail(generated)}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-emerald-900">
                  Message court (pour la messagerie Beds24)
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(buildShortMessage(generated), "short")}
                  className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  {copied === "short" ? "Copié ✓" : "Copier"}
                </button>
              </div>
              <textarea
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 font-mono text-xs text-gray-800"
                rows={5}
                readOnly
                value={buildShortMessage(generated)}
              />
            </div>
          </div>
        </section>
      )}
    </form>
  );
}
