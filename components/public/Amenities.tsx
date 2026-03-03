"use client";

import { useState } from "react";

interface Amenity {
  icon: React.ReactNode;
  label: string;
}

const AMENITIES: Amenity[] = [
  { icon: <LinensIcon />, label: "Draps et serviettes fournis" },
  { icon: <CleaningIcon />, label: "Ménage inclus" },
  { icon: <WifiIcon />, label: "Wifi haut débit" },
  { icon: <TvIcon />, label: "Smart TV dans chaque chambre" },
  { icon: <DeskIcon />, label: "Espace de travail dédié dans chaque chambre" },
  { icon: <CoffeeIcon />, label: "Cafetière à grain" },
  { icon: <KitchenIcon />, label: "Cuisine entièrement équipée" },
  { icon: <WasherIcon />, label: "Lave-linge" },
  { icon: <DryerIcon />, label: "Sèche-linge" },
  { icon: <GymIcon />, label: "Salle de sport privée" },
  { icon: <GardenIcon />, label: "Jardin" },
  { icon: <VerandaIcon />, label: "Terrasse / Véranda" },
  { icon: <LockIcon />, label: "Serrure sur chaque chambre" },
  { icon: <EntranceIcon />, label: "Entrée privée" },
  { icon: <HeatingIcon />, label: "Chauffage" },
  { icon: <DishwasherIcon />, label: "Lave-vaisselle" },
  { icon: <MicrowaveIcon />, label: "Micro-ondes" },
  { icon: <OvenIcon />, label: "Four" },
  { icon: <FridgeIcon />, label: "Réfrigérateur / Congélateur" },
  { icon: <SmokeDetectorIcon />, label: "Détecteur de fumée" },
  { icon: <ExtinguisherIcon />, label: "Extincteur" },
];

export default function Amenities() {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? AMENITIES : AMENITIES.slice(0, 10);

  return (
    <div id="equipements" className="mx-auto max-w-6xl border-b border-border px-6 py-8">
      <h2 className="text-xl font-semibold text-foreground">Ce que propose ce logement</h2>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visible.map((a) => (
          <div key={a.label} className="flex items-center gap-4">
            <div className="shrink-0 text-secondary">{a.icon}</div>
            <span className="text-[15px] text-foreground">{a.label}</span>
          </div>
        ))}
      </div>
      {AMENITIES.length > 10 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-6 rounded-lg border border-foreground px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-light-bg"
        >
          {showAll
            ? "Voir moins"
            : `Afficher les ${AMENITIES.length} équipements`}
        </button>
      )}
    </div>
  );
}

/* --- Simple SVG icon components --- */
function WifiIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
    </svg>
  );
}
function TvIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}
function KitchenIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    </svg>
  );
}
function WasherIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM3.75 3.75h16.5v16.5H3.75z" />
    </svg>
  );
}
function DryerIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3.75h16.5v16.5H3.75zM7.5 6.75h.008" />
    </svg>
  );
}
function GymIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 12h16.5M5.25 8.25v7.5M18.75 8.25v7.5M7.5 6v12M16.5 6v12M9.75 12h4.5" />
    </svg>
  );
}
function GardenIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6M12 3v9.75" />
    </svg>
  );
}
function VerandaIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}
function DeskIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}
function EntranceIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}
function HeatingIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    </svg>
  );
}
function DishwasherIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3.75h16.5v16.5H3.75zM3.75 7.5h16.5M12 11.25v5.25" />
    </svg>
  );
}
function CoffeeIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}
function MicrowaveIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5zM16.5 8.25v7.5M6 12a3 3 0 106 0 3 3 0 00-6 0z" />
    </svg>
  );
}
function OvenIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3.75h16.5v16.5H3.75zM3.75 9h16.5M8.25 6.375h.008M12 6.375h.008" />
    </svg>
  );
}
function FridgeIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 2.25h13.5v19.5H5.25zM5.25 10.5h13.5M9 6v3m0 3v6" />
    </svg>
  );
}
function LinensIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 9.75h16.5m-16.5 0A2.25 2.25 0 011.5 7.5V6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v1.5a2.25 2.25 0 01-2.25 2.25m-16.5 0v8.25A2.25 2.25 0 005.25 20.25h13.5A2.25 2.25 0 0021 18V9.75" />
    </svg>
  );
}
function CleaningIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}
function ParkingIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}
function SmokeDetectorIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}
function ExtinguisherIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}
