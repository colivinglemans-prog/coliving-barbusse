import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n";

const SITE_URL = "https://www.coliving-barbusse.fr";
const WHATSAPP = "https://wa.me/33620921005";
const EMAIL = "alexandre.delan@eva.gg";

type Lang = Locale;

const T: Record<Lang, Record<string, string>> = {
  fr: {
    titleTag: "Séminaires au Mans — Coliving Barbusse",
    desc: "Organisez votre séminaire d'entreprise au Mans : 9 suites privatives, espaces modulables, activités team-building au Circuit Bugatti et en Sarthe. Devis personnalisé.",
    heroKicker: "Séjours d'entreprise",
    heroTitle: "Votre séminaire au Mans, clé en main",
    heroSub: "9 suites privatives, espaces de travail modulables, à 15 min du Circuit Bugatti et 10 min de la gare TGV. Paris en 55 min.",
    heroCta: "Demander un devis",
    heroCta2: "Voir le guide complet",
    reasonsTitle: "Pourquoi choisir notre coliving",
    reason1T: "Une maison, une équipe",
    reason1D: "9 suites privatives avec salle de bain pour 9 collaborateurs. Cohésion renforcée, confidentialité totale.",
    reason2T: "Espaces modulables",
    reason2D: "Cuisine avec îlot central (8-10 pers. assises), salle zen en salle de réunion, salon chauffé pour debriefs.",
    reason3T: "Activités team-building à côté",
    reason3D: "Circuit Bugatti (karting, pilotage, simulateurs), EVA Le Mans (VR), Arche de la Nature, escape games.",
    reason4T: "Early check-in possible",
    reason4D: "Arrivée en gare 9h possible, installation dès 9h30 sous réserve de dispo. Démarrage de séminaire sans temps perdu.",
    whatTitle: "Ce qui est inclus",
    whatItems: "9 suites privatives·215 m² (espaces communs + chambres + annexe sport/zen)·Wi-Fi haut débit, prise Ethernet par chambre·Cuisine entièrement équipée·Salle de sport + espace zen·Serrure connectée (self check-in)·Facture professionnelle, paiement virement·Support WhatsApp 7j/7",
    extrasTitle: "Sur demande",
    extrasItems: "Matériel de réunion (vidéoprojecteur, paperboards, tableau blanc)·Traiteurs locaux (petit-déj, déjeuner, dîner)·Transferts taxi gare/circuit/maison·Mise en relation avec l'ACO et les activités team-building",
    programTitle: "Programme type — 2 jours",
    day1T: "Jour 1 — Arrivée & cohésion",
    day1Body: "9h arrivée gare · 9h30 installation & café · 11h-13h session de travail · 13h déjeuner maison · 14h-17h brainstorm stratégique · 17h30-19h activité team-building (karting / simulateur F1 / EVA) · 20h dîner ensemble",
    day2T: "Jour 2 — Ateliers & clôture",
    day2Body: "8h-9h petit-déj · 9h-12h ateliers (design thinking, OKR) · 12h30 déjeuner en ville · 14h-16h baptême de piste ou Musée 24h · 16h-17h debrief final · 17h départ TGV",
    pricingTitle: "Tarif indicatif",
    pricingBody: "~150-250 €/nuit/personne (équipe de 9) selon saison, hors activités et restauration. Plus économique que 9 chambres d'hôtel 3-4★.",
    testimonialTitle: "Ils sont déjà venus",
    testimonialQuote: "Hôte super, logement au top tout était parfait pour une équipe de 9 personnes ! Je recommande à 200%. Merci pour votre accueil.",
    testimonialAuthor: "Loic",
    testimonialContext: "Séjour de quelques nuits · Avril 2026",
    ctaTitle: "Parlons de votre séminaire",
    ctaSub: "Décrivez-nous vos dates, vos objectifs, votre équipe — nous construisons ensemble un séjour sur mesure.",
    ctaWA: "Contacter sur WhatsApp",
    ctaEmail: "Écrire par email",
    guideLink: "Lire le guide détaillé",
  },
  en: {
    titleTag: "Corporate seminars in Le Mans — Coliving Barbusse",
    desc: "Organise your company retreat in Le Mans: 9 private suites, modular spaces, team-building activities at Bugatti Circuit and in the Sarthe. Custom quote.",
    heroKicker: "Corporate retreats",
    heroTitle: "Your seminar in Le Mans, turnkey",
    heroSub: "9 private suites, modular workspaces, 15 min from the Bugatti Circuit and 10 min from the TGV station. Paris in 55 min.",
    heroCta: "Request a quote",
    heroCta2: "Read the full guide",
    reasonsTitle: "Why choose our coliving",
    reason1T: "One house, one team",
    reason1D: "9 private suites with en-suite bathrooms for 9 team members. Stronger bonding, total privacy.",
    reason2T: "Modular workspaces",
    reason2D: "Kitchen with central island (seats 8-10), zen space turned meeting room, heated living room for debriefs.",
    reason3T: "Team-building activities nearby",
    reason3D: "Bugatti Circuit (karting, driving, simulators), EVA Le Mans (VR), Arche de la Nature, escape games.",
    reason4T: "Early check-in available",
    reason4D: "9 am station arrival possible, move-in from 9.30 am subject to availability. No time wasted starting your seminar.",
    whatTitle: "What's included",
    whatItems: "9 private suites·215 m² total (common areas + bedrooms + gym/zen annex)·High-speed Wi-Fi, Ethernet socket per room·Fully equipped kitchen·Gym + zen space·Smart lock (self check-in)·Professional invoice, bank transfer·WhatsApp support 7 days a week",
    extrasTitle: "On request",
    extrasItems: "Meeting equipment (projector, flipcharts, whiteboard)·Local caterers (breakfast, lunch, dinner)·Taxi transfers station/circuit/house·Liaison with ACO and team-building providers",
    programTitle: "Sample 2-day programme",
    day1T: "Day 1 — Arrival & bonding",
    day1Body: "9 am station arrival · 9.30 am move-in & coffee · 11 am-1 pm work session · 1 pm house lunch · 2-5 pm strategic brainstorm · 5.30-7 pm team-building activity (karting / F1 sim / EVA) · 8 pm dinner together",
    day2T: "Day 2 — Workshops & close",
    day2Body: "8-9 am breakfast · 9 am-12 workshops (design thinking, OKRs) · 12.30 pm lunch in town · 2-4 pm track baptism or 24 Hours Museum · 4-5 pm final debrief · 5 pm TGV departure",
    pricingTitle: "Indicative rate",
    pricingBody: "~€150-250/night/person (team of 9) depending on season, excl. activities and catering. More affordable than 9 equivalent 3-4★ hotel rooms.",
    testimonialTitle: "They've already stayed with us",
    testimonialQuote: "Great host, top-notch accommodation, everything was perfect for our team of 9! Highly recommend. Thank you for the warm welcome.",
    testimonialAuthor: "Loic",
    testimonialContext: "Few-night stay · April 2026",
    ctaTitle: "Let's talk about your seminar",
    ctaSub: "Tell us your dates, goals, team — we'll build a bespoke stay together.",
    ctaWA: "Contact on WhatsApp",
    ctaEmail: "Write by email",
    guideLink: "Read the detailed guide",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale as Lang) in T ? (rawLocale as Lang) : "fr";
  const t = T[locale];
  const url = `${SITE_URL}/${locale}/seminaires`;

  return {
    title: t.titleTag,
    description: t.desc,
    alternates: {
      canonical: url,
      languages: {
        fr: `${SITE_URL}/fr/seminaires`,
        en: `${SITE_URL}/en/seminaires`,
        "x-default": `${SITE_URL}/fr/seminaires`,
      },
    },
    openGraph: {
      title: t.titleTag,
      description: t.desc,
      url,
      locale: locale === "en" ? "en_US" : "fr_FR",
      type: "website",
    },
  };
}

export default async function Seminaires({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale as Lang) in T ? (rawLocale as Lang) : "fr";
  const t = T[locale];

  const whatItems = t.whatItems.split("·");
  const extrasItems = t.extrasItems.split("·");

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl">
        <div className="relative h-[360px] w-full sm:h-[440px]">
          <Image
            src="/images/blog/seminaire.jpg"
            alt={t.heroTitle}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
              {t.heroKicker}
            </p>
            <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight text-white sm:text-5xl">
              {t.heroTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
              {t.heroSub}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                {t.heroCta}
              </a>
              <Link
                href={`/${locale}/blog/seminaire-entreprise-le-mans`}
                className="inline-flex items-center justify-center rounded-full border border-white/80 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                {t.heroCta2}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Reasons */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">{t.reasonsTitle}</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: t.reason1T, d: t.reason1D, icon: "🏠" },
            { t: t.reason2T, d: t.reason2D, icon: "💼" },
            { t: t.reason3T, d: t.reason3D, icon: "🏁" },
            { t: t.reason4T, d: t.reason4D, icon: "🚄" },
          ].map((r) => (
            <div key={r.t} className="rounded-xl border border-border p-5">
              <div className="text-2xl">{r.icon}</div>
              <h3 className="mt-3 font-semibold text-foreground">{r.t}</h3>
              <p className="mt-2 text-sm text-secondary">{r.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What / Extras */}
      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-xl bg-light-bg p-6">
          <h2 className="text-xl font-semibold text-foreground">{t.whatTitle}</h2>
          <ul className="mt-4 space-y-2 text-sm text-foreground">
            {whatItems.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 text-primary">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground">{t.extrasTitle}</h2>
          <ul className="mt-4 space-y-2 text-sm text-foreground">
            {extrasItems.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 text-secondary">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Program */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">{t.programTitle}</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground">{t.day1T}</h3>
            <p className="mt-2 text-sm text-secondary">{t.day1Body}</p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground">{t.day2T}</h3>
            <p className="mt-2 text-sm text-secondary">{t.day2Body}</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mt-12 rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground">{t.pricingTitle}</h2>
        <p className="mt-3 text-sm text-secondary">{t.pricingBody}</p>
      </section>

      {/* Testimonial */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">{t.testimonialTitle}</h2>
        <figure className="mt-6 rounded-2xl border border-border bg-light-bg p-6 sm:p-8">
          <div className="flex gap-1 text-amber-500" aria-label="5 stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l2.9 6.9L22 9.2l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-8L2 9.2l7.1-.3L12 2z" />
              </svg>
            ))}
          </div>
          <blockquote className="mt-4 text-base text-foreground sm:text-lg">
            « {t.testimonialQuote} »
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://a0.muscache.com/im/pictures/user/User/original/43648aad-e5bc-4e6f-8c70-395fa4165e84.jpeg?im_w=240"
              alt={t.testimonialAuthor}
              className="h-10 w-10 rounded-full object-cover"
              loading="lazy"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">{t.testimonialAuthor}</p>
              <p className="text-xs text-secondary">{t.testimonialContext}</p>
            </div>
          </figcaption>
        </figure>
      </section>

      {/* CTA */}
      <section className="mt-12 rounded-2xl bg-primary px-6 py-10 text-center text-white sm:px-10 sm:py-14">
        <h2 className="text-2xl font-bold sm:text-3xl">{t.ctaTitle}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
          {t.ctaSub}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-white/90"
          >
            {t.ctaWA}
          </a>
          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent(
              locale === "en" ? "Seminar request" : "Demande séminaire",
            )}`}
            className="inline-flex items-center justify-center rounded-full border border-white px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {t.ctaEmail}
          </a>
        </div>
        <Link
          href={`/${locale}/blog/seminaire-entreprise-le-mans`}
          className="mt-6 inline-block text-sm text-white/90 underline underline-offset-4 hover:text-white"
        >
          {t.guideLink} →
        </Link>
      </section>
    </div>
  );
}
