"use client";

import { QRCodeSVG } from "qrcode.react";
import { PROPERTY_INFO, wifiQrPayload } from "@/lib/property-info";

type Props = {
  locale: "fr" | "en";
};

export default function WifiQRCode({ locale }: Props) {
  const isEn = locale === "en";
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
            aria-label={isEn ? "Wi-Fi QR code" : "QR code Wi-Fi"}
          />
        </div>
        <div>
          <p className="text-sm text-secondary">
            {isEn
              ? "Scan this QR code with your phone camera to connect automatically."
              : "Scannez ce QR code avec l'appareil photo de votre téléphone pour vous connecter automatiquement."}
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex flex-col sm:flex-row sm:gap-2">
              <dt className="font-semibold text-foreground">
                {isEn ? "Network:" : "Réseau :"}
              </dt>
              <dd className="font-mono text-foreground">{ssid}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-2">
              <dt className="font-semibold text-foreground">
                {isEn ? "Password:" : "Mot de passe :"}
              </dt>
              <dd className="font-mono break-all text-foreground">{password}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
