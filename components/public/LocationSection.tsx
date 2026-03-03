const NEARBY = [
  {
    icon: "🚄",
    name: "Gare TGV du Mans",
    distance: "10 min à pied",
    detail: "Paris en 54 min, connexions vers Rennes, Nantes, Angers",
  },
  {
    icon: "🏁",
    name: "Circuit Bugatti",
    distance: "4.7 km",
    detail: "24 Heures du Mans, MotoGP, Le Mans Classic. Accessible via Tramway T1",
  },
  {
    icon: "🏢",
    name: "Zones d'emploi Sud du Mans",
    distance: "< 10 min en voiture",
    detail: "Technopole Université, ZA Sud, centres de recherche",
  },
  {
    icon: "🌳",
    name: "Parc Gué de Maulny",
    distance: "5 min à pied",
    detail: "Espace vert de 10 hectares pour se détendre",
  },
  {
    icon: "🚊",
    name: "Tramway T1",
    distance: "À proximité",
    detail: "Dessert le centre-ville, la gare et le circuit",
  },
  {
    icon: "🏛️",
    name: "Cité Plantagenêt (Vieux Mans)",
    distance: "15 min en tramway",
    detail: "Quartier médiéval historique, restaurants, patrimoine",
  },
];

export default function LocationSection() {
  return (
    <div id="localisation" className="mx-auto max-w-6xl border-b border-border px-6 py-8">
      <h2 className="text-xl font-semibold text-foreground">Où se situe le logement</h2>
      <p className="mt-2 text-sm text-secondary">
        42 Rue Henri Barbusse, 72100 Le Mans — Quartier résidentiel calme
      </p>

      {/* Map embed placeholder */}
      <div className="mt-6 overflow-hidden rounded-xl">
        <iframe
          title="Localisation Coliving Barbusse"
          src="https://www.openstreetmap.org/export/embed.html?bbox=0.185%2C47.983%2C0.200%2C47.993&layer=mapnik&marker=47.9881%2C0.1924"
          width="100%"
          height="300"
          className="border-0"
          loading="lazy"
        />
      </div>

      {/* Circuit Bugatti highlight */}
      <div className="mt-8 overflow-hidden rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="shrink-0 text-5xl">🏁</div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              À proximité du Circuit Bugatti
            </h3>
            <p className="mt-1 text-sm text-secondary">
              Situé à seulement 4.7 km du mythique Circuit Bugatti, notre maison est le point de
              chute idéal pour les 24 Heures du Mans, le MotoGP, Le Mans Classic et tous les
              événements du circuit. Accès direct via le Tramway T1 depuis la gare TGV.
            </p>
          </div>
        </div>
      </div>

      {/* Points of interest grid */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {NEARBY.map((place) => (
          <div key={place.name} className="rounded-xl border border-border p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{place.icon}</span>
              <div>
                <h4 className="font-medium text-foreground">{place.name}</h4>
                <p className="text-sm font-medium text-primary">{place.distance}</p>
                <p className="mt-1 text-xs text-secondary">{place.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
