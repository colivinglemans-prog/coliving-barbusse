const HIGHLIGHTS = [
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
    title: "Arrivée autonome",
    description: "Accédez au logement grâce à une serrure connectée. Arrivée à partir de 17h.",
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    title: "Calme et paisible",
    description: "Quartier résidentiel calme, proche du Parc Gué de Maulny. Idéal pour se ressourcer.",
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: "Alexandre est Superhôte sur Airbnb depuis avril 2024",
    description: "Les Superhôtes sont des hôtes expérimentés, très bien notés, qui s'engagent à offrir d'excellents séjours.",
  },
];

export default function Highlights() {
  return (
    <div className="mx-auto max-w-6xl border-b border-border px-6 py-8">
      <div className="space-y-6">
        {HIGHLIGHTS.map((h) => (
          <div key={h.title} className="flex gap-4">
            <div className="shrink-0 text-foreground">{h.icon}</div>
            <div>
              <h3 className="font-medium text-foreground">{h.title}</h3>
              <p className="mt-0.5 text-sm text-secondary">{h.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
