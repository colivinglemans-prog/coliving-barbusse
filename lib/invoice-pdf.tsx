import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Rect,
  Path,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { InvoicePayload } from "./invoice-payload";
import { computeNights } from "./invoice-payload";
import type { InvoiceIssuerConfig } from "./invoice-config";

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

function formatIban(iban: string): string {
  return iban.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
    lineHeight: 1.4,
  },
  brandBanner: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: "2px solid #e11d48",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  brandLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandLogo: {
    marginRight: 10,
  },
  brandName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#e11d48",
    letterSpacing: 1,
    lineHeight: 1,
    marginBottom: 6,
  },
  brandTagline: {
    fontSize: 9,
    color: "#6b7280",
    lineHeight: 1.2,
  },
  brandWebsite: {
    fontSize: 10,
    color: "#e11d48",
    fontFamily: "Helvetica-Bold",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  issuer: { maxWidth: "55%" },
  issuerName: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  issuerLine: { fontSize: 9, color: "#4b5563" },
  invoiceBox: { textAlign: "right" },
  invoiceTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#e11d48" },
  invoiceNumber: { fontSize: 11, marginTop: 4 },
  invoiceDate: { fontSize: 9, color: "#4b5563" },
  billToLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    color: "#6b7280",
    marginBottom: 6,
    letterSpacing: 1,
  },
  billTo: {
    border: "1px solid #e5e7eb",
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
    backgroundColor: "#f9fafb",
  },
  clientCompany: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 2 },
  clientName: { fontSize: 11, marginBottom: 4 },
  clientLine: { fontSize: 9, color: "#374151" },
  subject: { marginBottom: 16, fontSize: 10 },
  subjectLabel: { fontFamily: "Helvetica-Bold" },
  detailsBlock: {
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
  },
  detailsRow: { flexDirection: "row", marginBottom: 2 },
  detailsLabel: { width: 110, color: "#6b7280", fontSize: 9 },
  detailsValue: { fontSize: 9, flex: 1 },
  commentsBox: {
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1px solid #e5e7eb",
  },
  commentsLabel: { fontSize: 9, color: "#6b7280", marginBottom: 2 },
  commentsText: { fontSize: 9, fontStyle: "italic" },
  table: {
    border: "1px solid #e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#e11d48",
    color: "#ffffff",
    padding: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderTop: "1px solid #e5e7eb",
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colUnit: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  totalsBlock: { width: 200 },
  totalsLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 6,
  },
  totalTtcLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    backgroundColor: "#111827",
    color: "#ffffff",
    borderRadius: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  vatNotice: {
    fontSize: 9,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 12,
    marginBottom: 16,
  },
  paymentBox: {
    border: "1px solid #e11d48",
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  paymentTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#e11d48",
    marginBottom: 6,
  },
  paidBox: {
    border: "1px solid #059669",
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#ecfdf5",
  },
  paidTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#059669",
    marginBottom: 6,
  },
  paidThanks: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#d1fae5",
    borderRadius: 4,
    fontSize: 10,
    color: "#065f46",
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  paymentRow: { flexDirection: "row", marginBottom: 2 },
  paymentLabel: { width: 110, color: "#6b7280", fontSize: 9 },
  paymentValue: { fontSize: 10 },
  paymentValueBold: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  dueNotice: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 4,
    fontSize: 10,
    color: "#991b1b",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
    borderTop: "1px solid #e5e7eb",
    paddingTop: 6,
  },
});

interface InvoiceDocProps {
  payload: InvoicePayload;
  issuer: InvoiceIssuerConfig;
  invoiceNumber: string;
  issuedAt: Date;
}

function InvoiceDocument({ payload, issuer, invoiceNumber, issuedAt }: InvoiceDocProps) {
  const nights = computeNights(payload);
  const unitPrice = nights > 0 ? payload.amount / nights : payload.amount;
  const cityLine = [payload.postcode, payload.city].filter(Boolean).join(" ");

  return (
    <Document
      title={`Facture ${invoiceNumber}`}
      author={issuer.legalName}
      subject="Facture Coliving Barbusse"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.brandBanner}>
          <View style={styles.brandLeft}>
            <Svg width={40} height={40} viewBox="0 0 32 32" style={styles.brandLogo}>
              <Rect width={32} height={32} rx={6} ry={6} fill="#FF385C" />
              <Path d="M16 6L5 15h3v10h6v-7h4v7h6V15h3L16 6z" fill="#fff" />
            </Svg>
            <View>
              <Text style={styles.brandName}>COLIVING BARBUSSE</Text>
              <Text style={styles.brandTagline}>Location saisonnière — Le Mans</Text>
            </View>
          </View>
          {issuer.website ? (
            <Text style={styles.brandWebsite}>{issuer.website}</Text>
          ) : null}
        </View>

        <View style={styles.headerRow}>
          <View style={styles.issuer}>
            <Text style={styles.issuerName}>{issuer.legalName}</Text>
            <Text style={styles.issuerLine}>{issuer.addressLine1}</Text>
            <Text style={styles.issuerLine}>{issuer.addressLine2}</Text>
            <Text style={styles.issuerLine}>Email : {issuer.email}</Text>
            {issuer.phone ? (
              <Text style={styles.issuerLine}>Tél : {issuer.phone}</Text>
            ) : null}
          </View>
          <View style={styles.invoiceBox}>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
            <Text style={styles.invoiceNumber}>N° {invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>
              Émise le {formatDateFr(issuedAt.toISOString().split("T")[0])}
            </Text>
          </View>
        </View>

        <Text style={styles.billToLabel}>Facturé à</Text>
        <View style={styles.billTo}>
          {payload.company ? (
            <Text style={styles.clientCompany}>{payload.company}</Text>
          ) : null}
          <Text style={payload.company ? styles.clientLine : styles.clientName}>
            {payload.firstName} {payload.lastName}
          </Text>
          {payload.address ? (
            <Text style={styles.clientLine}>{payload.address}</Text>
          ) : null}
          {cityLine ? <Text style={styles.clientLine}>{cityLine}</Text> : null}
          {payload.state && payload.state !== payload.city ? (
            <Text style={styles.clientLine}>{payload.state}</Text>
          ) : null}
          {payload.country ? (
            <Text style={styles.clientLine}>{payload.country}</Text>
          ) : null}
          {payload.email ? (
            <Text style={styles.clientLine}>Email : {payload.email}</Text>
          ) : null}
          {payload.phone ? (
            <Text style={styles.clientLine}>Tél : {payload.phone}</Text>
          ) : null}
        </View>

        <Text style={styles.subject}>
          <Text style={styles.subjectLabel}>Objet : </Text>
          Location saisonnière meublée — Coliving Barbusse, Le Mans
        </Text>

        <View style={styles.detailsBlock}>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Arrivée</Text>
            <Text style={styles.detailsValue}>
              {formatDateFr(payload.arrival)}
              {payload.arrivalTime ? ` — ${payload.arrivalTime}` : ""}
            </Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Départ</Text>
            <Text style={styles.detailsValue}>{formatDateFr(payload.departure)}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Nombre de nuits</Text>
            <Text style={styles.detailsValue}>{nights}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Voyageurs</Text>
            <Text style={styles.detailsValue}>
              {payload.numAdult} adulte{payload.numAdult > 1 ? "s" : ""}
              {payload.numChild > 0
                ? `, ${payload.numChild} enfant${payload.numChild > 1 ? "s" : ""}`
                : ""}
            </Text>
          </View>
          {payload.reference ? (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Réf. réservation</Text>
              <Text style={styles.detailsValue}>Beds24 #{payload.reference}</Text>
            </View>
          ) : null}
          {payload.comments ? (
            <View style={styles.commentsBox}>
              <Text style={styles.commentsLabel}>Demandes du client</Text>
              <Text style={styles.commentsText}>{payload.comments}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Quantité</Text>
            <Text style={styles.colUnit}>Prix unitaire</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colDesc}>{payload.description}</Text>
            <Text style={styles.colQty}>{nights}</Text>
            <Text style={styles.colUnit}>{formatEur(unitPrice)}</Text>
            <Text style={styles.colTotal}>{formatEur(payload.amount)}</Text>
          </View>
        </View>

        <View style={styles.totalsRow}>
          <View style={styles.totalsBlock}>
            <View style={styles.totalsLine}>
              <Text>Total HT</Text>
              <Text>{formatEur(payload.amount)}</Text>
            </View>
            <View style={styles.totalsLine}>
              <Text>TVA (0%)</Text>
              <Text>{formatEur(0)}</Text>
            </View>
            <View style={styles.totalTtcLine}>
              <Text>Total TTC</Text>
              <Text>{formatEur(payload.amount)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.vatNotice}>
          TVA non applicable, art. 293B du CGI (location meublée non professionnelle).
        </Text>

        {payload.paid ? (
          <View wrap={false}>
            <View style={styles.paidBox}>
              <Text style={styles.paidTitle}>✓ Paiement reçu</Text>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Montant payé</Text>
                <Text style={styles.paymentValueBold}>{formatEur(payload.amount)}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Méthode</Text>
                <Text style={styles.paymentValue}>{payload.paidMethod || "Carte bancaire"}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Date de paiement</Text>
                <Text style={styles.paymentValue}>{formatDateFr(payload.paidAt)}</Text>
              </View>
              {payload.paidReference ? (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Référence</Text>
                  <Text style={styles.paymentValueBold}>{payload.paidReference}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.paidThanks}>Merci de votre paiement</Text>
          </View>
        ) : (
          <View wrap={false}>
            <View style={styles.paymentBox}>
              <Text style={styles.paymentTitle}>Paiement par virement bancaire</Text>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Bénéficiaire</Text>
                <Text style={styles.paymentValue}>{issuer.legalName}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Banque</Text>
                <Text style={styles.paymentValue}>{issuer.bankName}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>IBAN</Text>
                <Text style={styles.paymentValueBold}>{formatIban(issuer.iban)}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>BIC / SWIFT</Text>
                <Text style={styles.paymentValueBold}>{issuer.bic}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Libellé virement</Text>
                <Text style={styles.paymentValueBold}>{invoiceNumber}</Text>
              </View>
            </View>

            <Text style={styles.dueNotice}>
              Paiement attendu avant le {formatDateFr(payload.paymentDueDate)}
            </Text>
          </View>
        )}

        <Text style={styles.footer} fixed>
          Coliving Barbusse — {issuer.legalName} — {issuer.addressLine2}
          {issuer.website ? ` — ${issuer.website}` : ""} — {issuer.email}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(args: {
  payload: InvoicePayload;
  issuer: InvoiceIssuerConfig;
  invoiceNumber: string;
  issuedAt?: Date;
}): Promise<Buffer> {
  const doc = (
    <InvoiceDocument
      payload={args.payload}
      issuer={args.issuer}
      invoiceNumber={args.invoiceNumber}
      issuedAt={args.issuedAt ?? new Date()}
    />
  );
  return renderToBuffer(doc);
}
