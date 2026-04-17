"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const HOUSE = { lat: 47.9881, lng: 0.1924 };
const CIRCUIT = { lat: 47.9555, lng: 0.2095 };
const GARE = { lat: 47.9956, lng: 0.1922 };
const PARC = { lat: 47.9904, lng: 0.1855 };

function makePin(emoji: string, color: string, size = 30) {
  const borderW = 2;
  const fontSize = Math.round(size * 0.46);
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: ${size}px; height: ${size}px; border-radius: 50% 50% 50% 0;
      background: white; border: ${borderW}px solid ${color};
      transform: rotate(-45deg); box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    "><span style="transform: rotate(45deg); font-size: ${fontSize}px;">${emoji}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

const houseIcon = makePin("🏠", "#FF385C", 44);
const circuitIcon = makePin("🏁", "#222", 30);
const gareIcon = makePin("🚄", "#0066CC", 30);
const parcIcon = makePin("🌳", "#2E8B57", 30);

export default function LocationMap() {
  const bounds: [[number, number], [number, number]] = [
    [
      Math.min(HOUSE.lat, CIRCUIT.lat, GARE.lat, PARC.lat),
      Math.min(HOUSE.lng, CIRCUIT.lng, GARE.lng, PARC.lng),
    ],
    [
      Math.max(HOUSE.lat, CIRCUIT.lat, GARE.lat, PARC.lat),
      Math.max(HOUSE.lng, CIRCUIT.lng, GARE.lng, PARC.lng),
    ],
  ];

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [30, 30] }}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[HOUSE.lat, HOUSE.lng]} icon={houseIcon} zIndexOffset={1000}>
        <Popup>
          <strong>Coliving Barbusse</strong>
          <br />
          42 Rue Henri Barbusse
        </Popup>
      </Marker>
      <Marker position={[CIRCUIT.lat, CIRCUIT.lng]} icon={circuitIcon}>
        <Popup>
          <strong>Circuit Bugatti</strong>
          <br />
          Circuit des 24 Heures du Mans
        </Popup>
      </Marker>
      <Marker position={[GARE.lat, GARE.lng]} icon={gareIcon}>
        <Popup>
          <strong>Gare TGV du Mans</strong>
          <br />
          10 min à pied de la maison
        </Popup>
      </Marker>
      <Marker position={[PARC.lat, PARC.lng]} icon={parcIcon}>
        <Popup>
          <strong>Parc du Gué de Maulny</strong>
          <br />
          16 ha au bord de l'Huisne
        </Popup>
      </Marker>
    </MapContainer>
  );
}
