export default function HostSection() {
  return (
    <div className="mx-auto max-w-6xl border-b border-border px-6 py-8">
      <h2 className="text-xl font-semibold text-foreground">Votre hôte : Alexandre</h2>
      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        {/* Host card */}
        <div className="flex shrink-0 flex-col items-center rounded-xl border border-border p-6 md:w-64">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-3xl font-bold text-white">
            A
          </div>
          <h3 className="mt-3 text-lg font-semibold text-foreground">Alexandre</h3>
          <p className="text-sm text-secondary">Superhôte</p>
          <div className="mt-4 flex gap-4 text-center text-xs text-secondary">
            <div>
              <p className="text-lg font-semibold text-foreground">⭐</p>
              <p>Superhôte</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">1+</p>
              <p>an d&apos;expérience</p>
            </div>
          </div>
        </div>

        {/* Host description */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-medium text-foreground">À propos d&apos;Alexandre</h3>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              Passionné d&apos;immobilier et d&apos;hospitalité, Alexandre a entièrement rénové cette maison
              de 240 m² pour en faire un lieu de vie unique au Mans. Le concept de coliving
              premium permet d&apos;accueillir aussi bien des voyageurs individuels que des grands
              groupes, avec le confort d&apos;un hôtel et la convivialité d&apos;une maison.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-foreground">Langues</h3>
            <p className="mt-1 text-sm text-secondary">Français, English</p>
          </div>

          <div>
            <h3 className="font-medium text-foreground">Taux de réponse</h3>
            <p className="mt-1 text-sm text-secondary">
              Réponse rapide — généralement en moins d&apos;une heure
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <a
              href="mailto:coliving.lemans@gmail.com"
              className="rounded-lg border border-foreground px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-light-bg"
            >
              Contacter Alexandre
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
