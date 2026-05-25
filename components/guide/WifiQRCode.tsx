"use client";

import { QRCodeSVG } from "qrcode.react";
import { PROPERTY_INFO, wifiQrPayload } from "@/lib/property-info";
import type { Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
};

const TEXTS: Record<Locale, { aria: string; scan: string; network: string; password: string }> = {
  fr: {
    aria: "QR code Wi-Fi",
    scan: "Scannez ce QR code avec l'appareil photo de votre téléphone pour vous connecter automatiquement.",
    network: "Réseau :",
    password: "Mot de passe :",
  },
  en: {
    aria: "Wi-Fi QR code",
    scan: "Scan this QR code with your phone camera to connect automatically.",
    network: "Network:",
    password: "Password:",
  },
  it: {
    aria: "QR code Wi-Fi",
    scan: "Scansiona questo QR code con la fotocamera del telefono per connetterti automaticamente.",
    network: "Rete:",
    password: "Password:",
  },
  de: {
    aria: "Wi-Fi QR-Code",
    scan: "Scannen Sie diesen QR-Code mit der Handykamera, um sich automatisch zu verbinden.",
    network: "Netzwerk:",
    password: "Passwort:",
  },
};

export default function WifiQRCode({ locale }: Props) {
  const t = TEXTS[locale] ?? TEXTS.fr;
  const { ssid, password } = PROPERTY_INFO.wifi;

  return (
    <div className="rounded-2xl border border-border bg-light-bg p-6 sm:p-8">
      <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <div className="mx-auto flex items-center justify-center rounded-xl bg-white p-4 shadow-sm">
          <QRCodeSVG
            value={wifiQrPayload()}
            size={180}
            level="M"
            marginSize={1}
            aria-label={t.aria}
          />
        </div>
        <div>
          <p className="text-sm text-secondary">{t.scan}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex flex-col sm:flex-row sm:gap-2">
              <dt className="font-semibold text-foreground">{t.network}</dt>
              <dd className="font-mono text-foreground">{ssid}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-2">
              <dt className="font-semibold text-foreground">{t.password}</dt>
              <dd className="font-mono break-all text-foreground">{password}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
