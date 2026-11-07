/**
 * Attendus de Coliving Barbusse pour les contrôles post-déploiement et la surveillance.
 *
 * Le moteur est dans `@sejour/socle/testing/deploy` ; ce fichier ne déclare que des **valeurs**,
 * et les **importe** du code du site chaque fois qu'elles y existent : un identifiant Beds24,
 * une politique ou un avis qui change ne laisse pas le test en retard.
 *
 * ⚠ Ce fichier est public (dépôt public) et les logs Actions aussi. Il ne contient aucun secret :
 * les secrets arrivent par l'environnement (`BEDS24_MONITOR_TOKEN`, `DEPLOY_VIEWER_PASSWORD`,
 * `VERCEL_AUTOMATION_BYPASS_SECRET`). Les motifs de `mustNeverAppear` sont importés, comparés
 * puis comptés — le moteur ne les imprime jamais, ni leur index.
 */
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { DeploySite } from "@sejour/socle/config/deploy-site";
import { DEFAULT_LOCALE, LOCALES } from "@sejour/socle/lib/locales";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { PROPERTY_ID, ROOM_ID, availabilityPath } from "@/lib/beds24-property";
import { CANCELLATION_POLICY, PAYMENT_POLICY, PROPERTY_INFO } from "@/lib/property-info";
import { reviewsSummary } from "@/lib/reviews";
import { SITE_URL } from "@/lib/site";

/**
 * Les crons, lus dans `app/api/cron/` au lieu d'être recopiés : une route ajoutée demain est
 * contrôlée (401 sans Bearer) dès son premier déploiement. Toutes appellent `verifyCronAuth`.
 */
const CRON_ROUTES = readdirSync(fileURLToPath(new URL("../../app/api/cron/", import.meta.url)), {
  withFileTypes: true,
})
  .filter((d) => d.isDirectory())
  .map((d) => `/api/cron/${d.name}`)
  .sort();

/**
 * Éditions de blog périmées (`supersededBy`) : hors du sitemap, en `noindex`. Depuis le socle
 * v3.10.1, un chemin exclu se compare par segments entiers : `blog/motogp-france-le-mans` ne
 * couvre plus `blog/motogp-france-le-mans-2027`, et toutes les éditions périmées sont déclarées.
 */
const SUPERSEDED = BLOG_POSTS.filter((p) => p.supersededBy).map((p) => `blog/${p.slug}`);

/** Formulations périmées (« 14 jours », acompte de 10 %), dans les cinq langues publiées. */
const STALE_POLICY_PHRASES = [
  "gratuite jusqu'à 14 jours",
  "acompte de 10",
  "free cancellation up to 14 days",
  "10% deposit",
  "10 % deposit",
  "stornierung bis 14 tage",
  "10 % anzahlung",
  "10% anzahlung",
  "gratuita hasta 14 días",
  "depósito del 10",
  "gratuita fino a 14 giorni",
  "acconto del 10",
];

const thisYear = () => Number(new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }).slice(0, 4));

const site = {
  name: "Coliving Barbusse",
  canonicalUrl: SITE_URL,
  apexUrl: SITE_URL.replace("://www.", "://"),
  // L'hôte testé (production ou preview Vercel) est toujours admis par le moteur. Aucun autre
  // hôte ne reçoit de secret : pas de `*.vercel.app`, qui ouvrirait les previews d'autrui.
  allowedHosts: [],

  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  /**
   * Pages publiques passées au crible des fuites. **Pas `/guide-arrivee`** : il publie le
   * Wi-Fi en clair, par décision de l'exploitant (2026-11-07), et le mot de passe figure
   * justement dans `mustNeverAppear` pour qu'il ne se répande nulle part ailleurs.
   */
  keyPages: ["", "/chambres", "/seminaires", "/blog"],
  // Seule l'adresse du site est publiée (`contact@coliving-barbusse.fr`) : aucun domaine en plus.
  allowedEmailDomains: [],
  bookingAnchor: "disponibilite",

  availability: {
    path: availabilityPath,
    datesKey: "dates",
    minStayKey: "minStay",
    // Pas de `closedArrivalKey` ni `closedDepartureKey` : aucune rotation d'arrivée ici.
  },

  beds24: { propertyId: PROPERTY_ID, roomId: ROOM_ID },

  /**
   * Fêtes de fin d'année : 3 nuits minimum, annoncé dans `llms.txt` et appliqué dans Beds24
   * (Beyond). La valeur n'existe que dans Beds24 ; c'est elle qu'on vérifie.
   */
  minStayChecks: [
    { label: "Noël", date: (y) => `${y}-12-24`, minNights: 3 },
    { label: "Nouvel An", date: (y) => `${y}-12-31`, minNights: 3 },
  ],

  robots: { mustDisallow: ["/dashboard/", "/api/dashboard/"] },

  sitemap: { excludedPaths: ["guide-arrivee", ...SUPERSEDED] },

  /** Les redirections du proxy (`proxy.ts`), une par forme. */
  legacyRedirects: [
    ...LOCALES.map((l) => ({ from: `/${l}/reservation`, to: `/${l}` })),
    { from: "/reservation", to: "/fr" },
    { from: "/blog", to: "/fr/blog" },
    { from: "/chambres", to: "/fr/chambres" },
  ],

  reviews: reviewsSummary(),

  llms: {
    path: "/llms.txt",
    requiredPaths: [...LOCALES.map((l) => `/${l}`), "/fr/chambres"],
    facts: [
      { label: "arrivée", value: PROPERTY_INFO.checkIn.fr },
      { label: "départ", value: PROPERTY_INFO.checkOut.fr },
      { label: "adresse", value: PROPERTY_INFO.address.street },
      { label: "chambres", value: `${PROPERTY_INFO.bedrooms} chambres` },
      { label: "capacité", value: `${PROPERTY_INFO.maxGuests} personnes` },
      { label: "téléphone", value: PROPERTY_INFO.contact.phone },
    ],
  },

  forbiddenPhrases: STALE_POLICY_PHRASES,
  mustNeverAppear: [
    // Le code de serrure Beds24 (`infoItems`) : 37 d'entre eux ont déjà fui une fois.
    "NUKI_PIN",
    // Nom de champ Beds24 : sa présence dans une page publique trahit un objet brut sérialisé.
    /\bbookid\b/,
    PROPERTY_INFO.wifi.password,
  ],

  cancellation: CANCELLATION_POLICY,
  payment: PAYMENT_POLICY,

  security: {
    loginPath: "/api/auth/login",
    loginBody: (password) => ({ password }),
    dashboardLoginPage: "/dashboard/login",
    /**
     * La matrice des portes, reprise de `scripts/protocole/portes.mjs` du socle. Uniquement des
     * lectures : aucune route qui pilote le chauffage ou le ballon (`*\/control`, `*\/lock`,
     * `*\/summer-mode`, `*\/scan`, `*\/add-device`) n'est appelée. `invoices/generate` reçoit
     * un corps vide : la garde répond avant toute validation, le compteur n'est jamais atteint.
     */
    doors: [
      { path: "/dashboard", anonymous: [307], viewer: [307] },
      { path: `/api/dashboard/stats?period=currentYear`, anonymous: [401], viewer: [403] },
      { path: `/api/dashboard/fiscal?year=${thisYear()}&projected=false`, anonymous: [401], viewer: [403] },
      { path: `/api/dashboard/taxe-sejour?year=${thisYear()}`, anonymous: [401], viewer: [403] },
      { path: "/api/dashboard/invoices/prefill?bookingId=1", anonymous: [401], viewer: [403] },
      { path: "/api/dashboard/invoices/generate", method: "POST", anonymous: [401], viewer: [403] },
      { path: "/api/dashboard/invoices/stripe-payments", anonymous: [401], viewer: [403] },
      { path: "/api/dashboard/properties", anonymous: [401], viewer: [403] },
      { path: "/api/dashboard/pricing", anonymous: [401], viewer: [403] },
      { path: "/api/dashboard/bookings/1/nuki-code", anonymous: [401], viewer: [403] },
      // Les trois portes ouvertes au viewer : projection sans montant, lecture seule.
      { path: `/api/dashboard/bookings?arrivalFrom=${thisYear() - 1}-01-01&arrivalTo=${thisYear() + 1}-06-30`, anonymous: [401], viewer: [200] },
      {
        path: `/api/dashboard/calendar?propertyId=${PROPERTY_ID}&from=${thisYear()}-01-01&to=${thisYear()}-01-08`,
        anonymous: [401],
        viewer: [200],
      },
      { path: "/api/dashboard/heating", anonymous: [401], viewer: [200] },
    ],
    cronRoutes: CRON_ROUTES,
    webhooks: [{ path: "/api/webhooks/beds24", secretHeader: "x-webhook-secret" }],
    /**
     * Champs que le viewer ne doit jamais recevoir (liste de `scripts/protocole/fuite.mjs`).
     *
     * `channel` et `referer` restent **hors liste pour l'instant** : le DTO du socle
     * (`toBookingListItem`) les sert encore au rôle restreint, si bien que les déclarer ferait
     * échouer le contrôle chaque jour sur un écart connu. Le calendrier les masque à l'écran ;
     * la projection doit les retirer côté socle avant qu'on les ajoute ici.
     */
    viewerForbiddenFields: [
      "price",
      "email",
      "mobile",
      "phone",
      "country",
      "infoItems",
      "invoiceItems",
      "stripeToken",
      "commission",
      "deposit",
      "address",
      "gross",
      "net",
      // "channel",
      // "referer",
    ],
  },

  /**
   * Heartbeat des crons (Redis) : la route `/api/health/heartbeat` est créée par l'autre
   * chef-de-stand du lot ; elle sera activée ici quand elle sera en production.
   */
  // heartbeat: { path: "/api/health/heartbeat" },
} satisfies DeploySite;

export default site;
