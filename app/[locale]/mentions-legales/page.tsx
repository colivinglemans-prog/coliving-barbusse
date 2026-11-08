import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, LOCALES, type Locale } from "@/lib/i18n";
import { HOST_PROVIDER, LEGAL_ENTITY } from "@/lib/legal";
import { PROPERTY_INFO } from "@/lib/property-info";
import { SITE_URL } from "@/lib/site";
import { alternatesFor, conditionsPath, legalPath, pageOpenGraph } from "@/lib/seo";

/**
 * Mentions légales (LCEN, art. 6-III) : éditeur, directeur de la publication, hébergeur.
 *
 * Identité de l'entreprise dans `lib/legal.ts`, adresse et contact dans `PROPERTY_INFO` ;
 * les phrases sont ici, dans les cinq langues. Page de service : `noindex, follow`, hors
 * sitemap (comme sur Albiez). Les données personnelles renvoient à la section dédiée des
 * conditions de réservation, pour qu'il n'existe qu'un seul texte à tenir à jour.
 *
 * Médiateur de la consommation : volontairement absent tant qu'il n'est pas désigné.
 */
interface Content {
  title: string;
  metaDesc: string;
  editorTitle: string;
  labels: {
    name: string;
    legalForm: string;
    siren: string;
    office: string;
    email: string;
    phone: string;
    activity: string;
    vat: string;
  };
  activity: string;
  vat: string;
  directorTitle: string;
  hostTitle: string;
  dataTitle: string;
  /** Phrase coupée autour du lien vers les conditions : avant, texte du lien, après. */
  dataText: [string, string, string];
  ipTitle: string;
  ipText: string;
}

const T: Record<Locale, Content> = {
  fr: {
    title: "Mentions légales",
    metaDesc:
      "Mentions légales du site Coliving Barbusse : éditeur, directeur de la publication, hébergeur, données personnelles et propriété intellectuelle.",
    editorTitle: "Éditeur du site",
    labels: {
      name: "Nom",
      legalForm: "Statut",
      siren: "SIREN",
      office: "Siège",
      email: "E-mail",
      phone: "Téléphone",
      activity: "Activité",
      vat: "TVA",
    },
    activity: "Location meublée de tourisme",
    vat: "TVA non applicable (art. 293 B du CGI)",
    directorTitle: "Directeur de la publication",
    hostTitle: "Hébergeur",
    dataTitle: "Données personnelles",
    dataText: [
      "Le traitement des données collectées lors d'une réservation et vos droits d'accès, de rectification et de suppression sont décrits dans la section « Données personnelles » des ",
      "conditions de réservation",
      ".",
    ],
    ipTitle: "Propriété intellectuelle",
    ipText:
      "Les photos et les textes de ce site sont la propriété de l'éditeur. Toute reproduction, même partielle, est interdite sans son autorisation écrite.",
  },
  en: {
    title: "Legal notice",
    metaDesc:
      "Legal notice of the Coliving Barbusse website: publisher, publication director, hosting provider, personal data and intellectual property.",
    editorTitle: "Publisher",
    labels: {
      name: "Name",
      legalForm: "Legal status",
      siren: "SIREN (French business ID)",
      office: "Registered address",
      email: "Email",
      phone: "Phone",
      activity: "Activity",
      vat: "VAT",
    },
    activity: "Furnished holiday rental",
    vat: "VAT not applicable (article 293 B of the French General Tax Code)",
    directorTitle: "Publication director",
    hostTitle: "Hosting provider",
    dataTitle: "Personal data",
    dataText: [
      "How the data collected for a booking is processed, and your rights of access, correction and deletion, are described in the \"Personal data\" section of the ",
      "booking conditions",
      ".",
    ],
    ipTitle: "Intellectual property",
    ipText:
      "The photos and texts on this website belong to the publisher. Any reproduction, even partial, is prohibited without written permission.",
  },
  de: {
    title: "Impressum",
    metaDesc:
      "Impressum der Website Coliving Barbusse: Herausgeber, verantwortlich für den Inhalt, Hosting-Anbieter, personenbezogene Daten und Urheberrecht.",
    editorTitle: "Herausgeber",
    labels: {
      name: "Name",
      legalForm: "Rechtsform",
      siren: "SIREN (französische Unternehmensnummer)",
      office: "Sitz",
      email: "E-Mail",
      phone: "Telefon",
      activity: "Tätigkeit",
      vat: "MwSt.",
    },
    activity: "Vermietung möblierter Ferienunterkünfte",
    vat: "Mehrwertsteuer nicht anwendbar (Art. 293 B des französischen Steuergesetzbuchs, CGI)",
    directorTitle: "Verantwortlich für den Inhalt",
    hostTitle: "Hosting-Anbieter",
    dataTitle: "Personenbezogene Daten",
    dataText: [
      "Wie die bei einer Buchung erhobenen Daten verarbeitet werden und wie Sie Auskunft, Berichtigung oder Löschung verlangen, steht im Abschnitt „Personenbezogene Daten“ der ",
      "Buchungsbedingungen",
      ".",
    ],
    ipTitle: "Urheberrecht",
    ipText:
      "Die Fotos und Texte dieser Website sind Eigentum des Herausgebers. Jede auch nur teilweise Vervielfältigung ohne seine schriftliche Genehmigung ist untersagt.",
  },
  es: {
    title: "Aviso legal",
    metaDesc:
      "Aviso legal del sitio Coliving Barbusse: editor, director de la publicación, proveedor de alojamiento, datos personales y propiedad intelectual.",
    editorTitle: "Editor del sitio",
    labels: {
      name: "Nombre",
      legalForm: "Forma jurídica",
      siren: "SIREN (n.º de empresa francés)",
      office: "Domicilio",
      email: "Correo electrónico",
      phone: "Teléfono",
      activity: "Actividad",
      vat: "IVA",
    },
    activity: "Alquiler turístico amueblado",
    vat: "IVA no aplicable (art. 293 B del Código General de Impuestos francés)",
    directorTitle: "Director de la publicación",
    hostTitle: "Proveedor de alojamiento",
    dataTitle: "Datos personales",
    dataText: [
      "El tratamiento de los datos recogidos al reservar y sus derechos de acceso, rectificación y supresión se describen en la sección «Datos personales» de las ",
      "condiciones de reserva",
      ".",
    ],
    ipTitle: "Propiedad intelectual",
    ipText:
      "Las fotos y los textos de este sitio son propiedad del editor. Queda prohibida cualquier reproducción, incluso parcial, sin su autorización por escrito.",
  },
  it: {
    title: "Note legali",
    metaDesc:
      "Note legali del sito Coliving Barbusse: editore, direttore della pubblicazione, fornitore di hosting, dati personali e proprietà intellettuale.",
    editorTitle: "Editore del sito",
    labels: {
      name: "Nome",
      legalForm: "Forma giuridica",
      siren: "SIREN (n. di impresa francese)",
      office: "Sede",
      email: "E-mail",
      phone: "Telefono",
      activity: "Attività",
      vat: "IVA",
    },
    activity: "Affitto turistico ammobiliato",
    vat: "IVA non applicabile (art. 293 B del Codice generale delle imposte francese)",
    directorTitle: "Direttore della pubblicazione",
    hostTitle: "Fornitore di hosting",
    dataTitle: "Dati personali",
    dataText: [
      "Il trattamento dei dati raccolti al momento della prenotazione e i diritti di accesso, rettifica e cancellazione sono descritti nella sezione «Dati personali» delle ",
      "condizioni di prenotazione",
      ".",
    ],
    ipTitle: "Proprietà intellettuale",
    ipText:
      "Le foto e i testi di questo sito sono di proprietà dell'editore. È vietata qualsiasi riproduzione, anche parziale, senza la sua autorizzazione scritta.",
  },
};

/** « +33620921005 » → « +33 6 20 92 10 05 ». */
function formatPhone(e164: string): string {
  const m = /^\+33(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(e164);
  return m ? `+33 ${m.slice(1).join(" ")}` : e164;
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = T[locale];
  const title = `${t.title} — Coliving Barbusse`;

  return {
    title,
    description: t.metaDesc,
    // Page de service : utile aux visiteurs, sans intérêt dans l'index de recherche.
    robots: { index: false, follow: true },
    alternates: alternatesFor(locale, legalPath),
    openGraph: pageOpenGraph(locale, { title, description: t.metaDesc, url: `${SITE_URL}${legalPath(locale)}` }),
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = T[locale];
  const l = t.labels;
  const { email, phone } = PROPERTY_INFO.contact;

  const rows = [
    { label: l.name, value: LEGAL_ENTITY.name },
    { label: l.legalForm, value: LEGAL_ENTITY.legalForm[locale] },
    { label: l.siren, value: LEGAL_ENTITY.siren },
    { label: l.office, value: PROPERTY_INFO.address.full },
    {
      label: l.email,
      value: (
        <a href={`mailto:${email}`} className="underline underline-offset-2 hover:text-foreground">
          {email}
        </a>
      ),
    },
    {
      label: l.phone,
      value: (
        <a href={`tel:${phone}`} className="underline underline-offset-2 hover:text-foreground">
          {formatPhone(phone)}
        </a>
      ),
    },
    { label: l.activity, value: t.activity },
    { label: l.vat, value: t.vat },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-10 text-2xl font-semibold text-foreground">{t.title}</h1>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-foreground">{t.editorTitle}</h2>
        <dl className="divide-y divide-border border-y border-border">
          {rows.map((row) => (
            <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-3">
              <dt className="text-sm font-medium text-foreground">{row.label}</dt>
              <dd className="text-sm text-secondary sm:col-span-2">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-foreground">{t.directorTitle}</h2>
        <p className="text-sm text-secondary">{LEGAL_ENTITY.publicationDirector}</p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-foreground">{t.hostTitle}</h2>
        <p className="text-sm text-secondary">
          {HOST_PROVIDER.name} — {HOST_PROVIDER.address}, {HOST_PROVIDER.country[locale]}
          <br />
          <a
            href={HOST_PROVIDER.website}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {HOST_PROVIDER.website.replace(/^https:\/\//, "")}
          </a>
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-foreground">{t.dataTitle}</h2>
        <p className="text-sm text-secondary">
          {t.dataText[0]}
          <Link href={conditionsPath(locale)} className="underline underline-offset-2 hover:text-foreground">
            {t.dataText[1]}
          </Link>
          {t.dataText[2]}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">{t.ipTitle}</h2>
        <p className="text-sm text-secondary">{t.ipText}</p>
      </section>
    </div>
  );
}
