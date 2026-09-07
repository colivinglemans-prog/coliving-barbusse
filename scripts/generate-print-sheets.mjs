/**
 * Génère les fiches A4 à afficher dans la maison (docs/print/*.html).
 *
 *   node scripts/generate-print-sheets.mjs
 *
 * Les fichiers produits sont autonomes (photos en base64, QR code inline) :
 * on les ouvre dans un navigateur puis Ctrl+P → « Enregistrer au format PDF »
 * ou impression directe, format A4 portrait, marges « Aucune ».
 *
 * Les textes reprennent ceux du guide d'arrivée (app/[locale]/guide-arrivee/page.tsx)
 * et le Wi-Fi est lu depuis lib/property-info.ts pour rester synchronisé.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "docs", "print");

/* ------------------------------------------------------------------ */
/* Données                                                             */
/* ------------------------------------------------------------------ */

function readWifi() {
  const src = readFileSync(path.join(ROOT, "lib", "property-info.ts"), "utf8");
  const block = src.match(/wifi:\s*\{([\s\S]*?)\}/);
  if (!block) throw new Error("Bloc wifi introuvable dans lib/property-info.ts");
  const pick = (key) => {
    const m = block[1].match(new RegExp(`${key}:\\s*"([^"]+)"`));
    if (!m) throw new Error(`Clé wifi.${key} introuvable`);
    return m[1];
  };
  return { ssid: pick("ssid"), password: pick("password"), encryption: pick("encryption") };
}

const WIFI = readWifi();
const PHONE = "+33 6 20 92 10 05";

const dataUri = (relPath) => {
  const abs = path.join(ROOT, "public", relPath);
  const ext = path.extname(abs).slice(1).toLowerCase();
  const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  return `data:${mime};base64,${readFileSync(abs).toString("base64")}`;
};

const IMG = {
  poignee: dataUri("images/guide/verrouillage-poignee.jpg"),
  bouton: dataUri("images/guide/verrouillage-bouton.png"),
  keypad: dataUri("images/guide/keypad.png"),
};

const LANGS = ["fr", "en", "es", "it", "de"];
const LANG_LABEL = {
  fr: "Français",
  en: "English",
  es: "Español",
  it: "Italiano",
  de: "Deutsch",
};

/* ------------------------------------------------------------------ */
/* Textes — serrure                                                    */
/* ------------------------------------------------------------------ */

const LOCK = {
  fr: {
    title: "Serrure connectée",
    inside: "Fermer depuis l'intérieur",
    step1: "Relevez fermement la poignée vers le haut.",
    step2: "Tournez doucement le bouton rond vers la droite (sens horaire).",
    outside: "Fermer en sortant de la maison",
    out1: "Relevez fermement la poignée vers le haut depuis l'extérieur.",
    out2: "Appuyez sur la touche retour ◀ (en bas à droite du clavier).",
    note: "Le geste est silencieux. La porte est verrouillée quand l'anneau lumineux est entièrement allumé. Tourner dans l'autre sens déverrouille.",
    code: "Votre code d'accès à 6 chiffres vous a été envoyé par message. Clavier à gauche de la sonnette.",
  },
  en: {
    title: "Smart lock",
    inside: "Locking from inside",
    step1: "Lift the door handle firmly upward.",
    step2: "Gently turn the round knob to the right (clockwise).",
    outside: "Locking when leaving the house",
    out1: "Lift the door handle firmly upward from the outside.",
    out2: "Press the return key ◀ (bottom-right of the keypad).",
    note: "The action is silent. The door is locked when the light ring is fully illuminated. Turning the knob the other way unlocks it.",
    code: "Your 6-digit access code was sent to you by message. Keypad is to the left of the doorbell.",
  },
  es: {
    title: "Cerradura conectada",
    inside: "Cerrar desde el interior",
    step1: "Levanta firmemente la manilla hacia arriba.",
    step2: "Gira suavemente el pomo redondo hacia la derecha (sentido horario).",
    outside: "Cerrar al salir de la casa",
    out1: "Levanta firmemente la manilla hacia arriba desde el exterior.",
    out2: "Pulsa la tecla de retorno ◀ (abajo a la derecha del teclado).",
    note: "El gesto es silencioso. La puerta está cerrada cuando el anillo luminoso está totalmente encendido. Girando en el otro sentido se desbloquea.",
    code: "Tu código de acceso de 6 dígitos se ha enviado por mensaje. El teclado está a la izquierda del timbre.",
  },
  it: {
    title: "Serratura connessa",
    inside: "Chiudere dall'interno",
    step1: "Alza con decisione la maniglia verso l'alto.",
    step2: "Gira delicatamente il pomolo rotondo verso destra (senso orario).",
    outside: "Chiudere uscendo dalla casa",
    out1: "Alza con decisione la maniglia verso l'alto dall'esterno.",
    out2: "Premi il tasto di ritorno ◀ (in basso a destra della tastiera).",
    note: "Il gesto è silenzioso. La porta è chiusa quando l'anello luminoso è completamente acceso. Girando nell'altro senso si sblocca.",
    code: "Il tuo codice di accesso a 6 cifre ti è stato inviato per messaggio. La tastiera è a sinistra del campanello.",
  },
  de: {
    title: "Smart Lock",
    inside: "Von innen abschließen",
    step1: "Heben Sie den Türgriff fest nach oben.",
    step2: "Drehen Sie den runden Knopf vorsichtig nach rechts (im Uhrzeigersinn).",
    outside: "Beim Verlassen des Hauses abschließen",
    out1: "Heben Sie den Türgriff von außen fest nach oben.",
    out2: "Drücken Sie die Rückkehr-Taste ◀ (unten rechts auf dem Tastenfeld).",
    note: "Der Vorgang ist geräuschlos. Die Tür ist verriegelt, wenn der Leuchtring vollständig leuchtet. Drehen in die andere Richtung entriegelt.",
    code: "Ihr 6-stelliger Zugangscode wurde Ihnen per Nachricht zugesandt. Das Tastenfeld befindet sich links neben der Klingel.",
  },
};

/* ------------------------------------------------------------------ */
/* Textes — Wi-Fi                                                      */
/* ------------------------------------------------------------------ */

const WIFI_T = {
  fr: {
    scan: "Scannez le QR code avec l'appareil photo de votre téléphone pour vous connecter automatiquement.",
    network: "Réseau",
    password: "Mot de passe",
    hint: "Tout en minuscules, sans espace.",
    help: "Un souci de connexion ? Écrivez-nous.",
  },
  en: {
    scan: "Scan the QR code with your phone camera to connect automatically.",
    network: "Network",
    password: "Password",
    hint: "All lowercase, no spaces.",
    help: "Trouble connecting? Just message us.",
  },
  es: {
    scan: "Escanea el código QR con la cámara del teléfono para conectarte automáticamente.",
    network: "Red",
    password: "Contraseña",
    hint: "Todo en minúsculas, sin espacios.",
    help: "¿Problemas de conexión? Escríbenos.",
  },
  it: {
    scan: "Scansiona il QR code con la fotocamera del telefono per connetterti automaticamente.",
    network: "Rete",
    password: "Password",
    hint: "Tutto minuscolo, senza spazi.",
    help: "Problemi di connessione? Scrivici.",
  },
  de: {
    scan: "Scannen Sie den QR-Code mit der Handykamera, um sich automatisch zu verbinden.",
    network: "Netzwerk",
    password: "Passwort",
    hint: "Alles kleingeschrieben, keine Leerzeichen.",
    help: "Verbindungsprobleme? Schreiben Sie uns.",
  },
};

/* ------------------------------------------------------------------ */
/* Gabarit commun                                                      */
/* ------------------------------------------------------------------ */

const BASE_CSS = `
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; }
  body {
    width: 210mm; min-height: 297mm; margin: 0 auto; padding: 13mm 14mm;
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    color: #222; -webkit-print-color-adjust: exact; print-color-adjust: exact;
    display: flex; flex-direction: column;
  }
  .masthead { display: flex; align-items: center; gap: 5mm; border-bottom: 1.2mm solid #FF385C; padding-bottom: 4mm; }
  .masthead .icon { font-size: 16mm; line-height: 1; }
  .masthead h1 { font-size: 10mm; line-height: 1.05; letter-spacing: -0.02em; }
  .masthead .sub { margin-top: 1.5mm; font-size: 3.4mm; color: #717171; }
  .house { margin-left: auto; text-align: right; font-size: 3mm; color: #717171; line-height: 1.5; white-space: nowrap; }
  .house strong { display: block; font-size: 3.6mm; color: #222; letter-spacing: 0.04em; text-transform: uppercase; }
  .foot { margin-top: auto; padding-top: 4mm; border-top: 0.4mm solid #DDD;
          display: flex; justify-content: space-between; align-items: baseline; font-size: 3mm; color: #717171; }
  .foot strong { color: #222; }
  .lang { display: inline-block; min-width: 7mm; padding: 0.4mm 1.4mm; margin-right: 1.8mm;
          border-radius: 1mm; background: #222; color: #fff;
          font-size: 2.5mm; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; vertical-align: 0.4mm; }
`;

const page = (title, css, body) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>${BASE_CSS}${css}</style>
</head>
<body>
${body}
</body>
</html>
`;

const uniq = (arr) => [...new Map(arr.map((v) => [v.toLowerCase(), v])).values()];

const masthead = (icon, h1, sub) => `
  <header class="masthead">
    <span class="icon">${icon}</span>
    <div>
      <h1>${h1}</h1>
      <p class="sub">${sub}</p>
    </div>
    <div class="house"><strong>Coliving Barbusse</strong>42 rue Henri Barbusse, Le Mans</div>
  </header>`;

const footer = (left) => `
  <footer class="foot">
    <span>${left}</span>
    <span>WhatsApp / SMS <strong>${PHONE}</strong></span>
  </footer>`;

/* ------------------------------------------------------------------ */
/* Fiche 1 — serrure connectée                                         */
/* ------------------------------------------------------------------ */

function lockSheet() {
  const css = `
    .titles { display: flex; flex-wrap: wrap; gap: 0 4mm; margin-top: 4mm; font-size: 3.4mm; color: #717171; }
    .titles span::after { content: " ·"; color: #DDD; }
    .titles span:last-child::after { content: ""; }
    .panels { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-top: 5mm; }
    .panel { border: 0.4mm solid #DDD; border-radius: 3mm; overflow: hidden; display: flex; flex-direction: column; }
    .panel > h2 { background: #F7F7F7; border-bottom: 0.4mm solid #DDD; padding: 3mm 4mm;
                  font-size: 4.6mm; letter-spacing: -0.01em; display: flex; align-items: center; gap: 2.5mm; }
    .panel > h2 em { font-style: normal; font-size: 3.2mm; color: #717171; font-weight: 400; }
    .shots { display: flex; gap: 2mm; padding: 3mm 3mm 0; }
    .shot { position: relative; flex: 1; border-radius: 2mm; overflow: hidden; background: #F7F7F7; }
    .shot img { display: block; width: 100%; height: 46mm; object-fit: cover; object-position: center; }
    .shot.contain img { object-fit: contain; padding: 1.5mm; }
    .badge { position: absolute; top: 2mm; left: 2mm; width: 6.5mm; height: 6.5mm; border-radius: 50%;
             background: #FF385C; color: #fff; font-size: 3.8mm; font-weight: 700;
             display: flex; align-items: center; justify-content: center;
             box-shadow: 0 0 0 0.8mm #fff; }
    .steps { display: grid; grid-template-columns: auto 1fr; gap: 1.5mm 2.5mm; padding: 4mm 4mm 0; }
    .steps .n { width: 5mm; height: 5mm; border-radius: 50%; background: #222; color: #fff;
                font-size: 3mm; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .steps p { font-size: 3.4mm; font-weight: 600; line-height: 1.35; padding-top: 0.6mm; }
    .tr { padding: 3.5mm 4mm 4mm; }
    .tr div { font-size: 3.05mm; line-height: 1.4; color: #444; }
    .tr div + div { margin-top: 2mm; padding-top: 2mm; border-top: 0.3mm dotted #DDD; }
    .note { margin-top: 5mm; border-left: 1.2mm solid #FF385C; background: #FFF5F7; border-radius: 0 2mm 2mm 0; padding: 3.5mm 4mm; }
    .note h3 { font-size: 3.6mm; margin-bottom: 2mm; }
    .note div { font-size: 3mm; line-height: 1.4; color: #444; }
    .note div + div { margin-top: 1.4mm; }
  `;

  const trBlock = (key) =>
    LANGS.map((l) => `<div><span class="lang">${l}</span>${LOCK[l][key]}</div>`).join("");

  const body = `
${masthead("🔒", "Fermer la porte", uniq(LANGS.map((l) => LOCK[l].title)).join(" · "))}

  <div class="panels">
    <section class="panel">
      <h2>De l'intérieur <em>${LOCK.en.inside}</em></h2>
      <div class="shots">
        <div class="shot"><span class="badge">1</span><img src="${IMG.poignee}" alt=""></div>
        <div class="shot contain"><span class="badge">2</span><img src="${IMG.bouton}" alt=""></div>
      </div>
      <div class="steps">
        <span class="n">1</span><p>${LOCK.fr.step1}</p>
        <span class="n">2</span><p>${LOCK.fr.step2}</p>
      </div>
      <div class="tr">
        ${LANGS.filter((l) => l !== "fr")
          .map(
            (l) =>
              `<div><span class="lang">${l}</span><strong>1.</strong> ${LOCK[l].step1} <strong>2.</strong> ${LOCK[l].step2}</div>`
          )
          .join("")}
      </div>
    </section>

    <section class="panel">
      <h2>En sortant <em>${LOCK.en.outside}</em></h2>
      <div class="shots">
        <div class="shot"><span class="badge">1</span><img src="${IMG.poignee}" alt=""></div>
        <div class="shot contain"><span class="badge">2</span><img src="${IMG.keypad}" alt=""></div>
      </div>
      <div class="steps">
        <span class="n">1</span><p>${LOCK.fr.out1}</p>
        <span class="n">2</span><p>${LOCK.fr.out2}</p>
      </div>
      <div class="tr">
        ${LANGS.filter((l) => l !== "fr")
          .map(
            (l) =>
              `<div><span class="lang">${l}</span><strong>1.</strong> ${LOCK[l].out1} <strong>2.</strong> ${LOCK[l].out2}</div>`
          )
          .join("")}
      </div>
    </section>
  </div>

  <section class="note">
    <h3>💡 L'anneau lumineux allumé = porte verrouillée</h3>
    ${trBlock("note")}
  </section>

${footer("Merci de bien verrouiller à chaque sortie 🙏")}
`;

  return page("Serrure connectée — Coliving Barbusse", css, body);
}

/* ------------------------------------------------------------------ */
/* Fiche 2 — Wi-Fi                                                     */
/* ------------------------------------------------------------------ */

function wifiSheet() {
  const payload = `WIFI:T:${WIFI.encryption};S:${WIFI.ssid};P:${WIFI.password};;`;
  const qr = renderToStaticMarkup(
    React.createElement(QRCodeSVG, {
      value: payload,
      size: 300,
      level: "M",
      marginSize: 1,
    })
  ).replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" ');

  const css = `
    .hero { display: grid; grid-template-columns: 78mm 1fr; gap: 8mm; align-items: center;
            margin-top: 8mm; border: 0.4mm solid #DDD; border-radius: 4mm; padding: 7mm; }
    .qr { border: 0.6mm solid #EEE; border-radius: 3mm; padding: 3mm; background: #fff; }
    .qr svg { display: block; width: 100%; height: auto; }
    .qr figcaption { margin-top: 2.5mm; text-align: center; font-size: 3mm; color: #717171; }
    .creds dt { font-size: 3.2mm; color: #717171; text-transform: uppercase; letter-spacing: 0.1em; }
    .creds dd { margin: 1.5mm 0 6mm; font-family: "Consolas", "SF Mono", monospace;
                font-size: 6.6mm; font-weight: 700; letter-spacing: 0.05em; line-height: 1.2; }
    .creds dd:last-child { margin-bottom: 2mm; font-size: 5.2mm; letter-spacing: 0.02em; }
    .creds .hint { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
                   font-size: 3.1mm; font-weight: 400; letter-spacing: 0; color: #717171; margin-top: 2.5mm; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm 7mm; margin-top: 8mm; }
    .grid section { border-top: 0.6mm solid #222; padding-top: 2.5mm; }
    .grid h2 { font-size: 3.4mm; margin-bottom: 1.5mm; }
    .grid p { font-size: 3.1mm; line-height: 1.45; color: #444; }
    .tips { margin-top: 8mm; background: #F7F7F7; border-radius: 3mm; padding: 5mm 6mm; }
    .tips h3 { font-size: 3.6mm; margin-bottom: 2.5mm; }
    .tips ul { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 1.8mm 6mm; }
    .tips li { font-size: 3.05mm; line-height: 1.4; color: #444; padding-left: 4.5mm; position: relative; }
    .tips li::before { content: "→"; position: absolute; left: 0; color: #FF385C; font-weight: 700; }
  `;

  const body = `
${masthead("📶", "Wi-Fi", LANGS.map((l) => WIFI_T[l].network).join(" · "))}

  <div class="hero">
    <figure class="qr">
      ${qr}
      <figcaption>Android &amp; iPhone</figcaption>
    </figure>
    <dl class="creds">
      <dt>${WIFI_T.fr.network} / ${WIFI_T.en.network}</dt>
      <dd>${WIFI.ssid}</dd>
      <dt>${WIFI_T.fr.password} / ${WIFI_T.en.password}</dt>
      <dd>${WIFI.password}<div class="hint">${WIFI_T.fr.hint} — ${WIFI_T.en.hint}</div></dd>
    </dl>
  </div>

  <div class="grid">
    ${LANGS.map(
      (l) => `<section>
      <h2><span class="lang">${l}</span>${LANG_LABEL[l]}</h2>
      <p>${WIFI_T[l].scan}</p>
    </section>`
    ).join("\n    ")}
  </div>

  <section class="tips">
    <h3>📷 Comment scanner / How to scan</h3>
    <ul>
      <li>Ouvrez l'appareil photo, visez le QR code, touchez la notification.</li>
      <li>Open the camera app, point at the QR code, tap the notification.</li>
      <li>Abre la cámara, apunta al código QR y toca la notificación.</li>
      <li>Apri la fotocamera, inquadra il QR code, tocca la notifica.</li>
      <li>Kamera öffnen, QR-Code scannen, auf die Benachrichtigung tippen.</li>
      <li>Sinon, connectez-vous à la main avec le réseau et le mot de passe ci-dessus.</li>
    </ul>
  </section>

${footer(`${WIFI_T.fr.help} — ${WIFI_T.en.help}`)}
`;

  return page("Wi-Fi — Coliving Barbusse", css, body);
}

/* ------------------------------------------------------------------ */

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(path.join(OUT_DIR, "serrure-connectee.html"), lockSheet(), "utf8");
writeFileSync(path.join(OUT_DIR, "wifi.html"), wifiSheet(), "utf8");
console.log(`✓ ${path.join(OUT_DIR, "serrure-connectee.html")}`);
console.log(`✓ ${path.join(OUT_DIR, "wifi.html")}`);
