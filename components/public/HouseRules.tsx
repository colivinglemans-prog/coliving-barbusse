const RULES = [
  {
    title: "Règlement intérieur",
    items: [
      "Arrivée : 15h00 — 23h00",
      "Départ : avant 11h00",
      "18 voyageurs maximum",
      "Non-fumeur (intérieur)",
      "Animaux non admis",
      "Pas de fête ni d'événement bruyant",
    ],
  },
  {
    title: "Sécurité et logement",
    items: [
      "Détecteur de fumée",
      "Extincteur",
      "Serrure sur chaque chambre",
      "Entrée privée avec boîte à clés sécurisée",
      "Chauffage dans toutes les pièces",
    ],
  },
  {
    title: "Conditions d'annulation",
    items: [
      "Annulation gratuite jusqu'à 5 jours avant l'arrivée",
      "Acompte de 10% à la réservation",
      "Solde intégral avant le check-in",
      "Paiement sécurisé par carte (Visa, Mastercard)",
    ],
  },
];

export default function HouseRules() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h2 className="text-xl font-semibold text-foreground">À savoir</h2>
      <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {RULES.map((section) => (
          <div key={section.title}>
            <h3 className="font-medium text-foreground">{section.title}</h3>
            <ul className="mt-3 space-y-2">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
