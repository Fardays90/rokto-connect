const FEATURES: Array<{ title: string; body: string }> = [
  {
    title: "Verified donor profiles",
    body: "Donors build a track record through ratings and reviews from past donations, so requesters know who they're messaging.",
  },
  {
    title: "Live urgency levels",
    body: "Every request shows blood type, units needed, and how urgent it is — sorted so the most critical cases surface first.",
  },
  {
    title: "Direct in-app chat",
    body: "Coordinate time, place, and logistics with a donor or requester without leaving RoktoConnect.",
  },
  {
    title: "Availability tracking",
    body: "Donors mark their next-eligible date automatically, so requests only reach people who can actually give.",
  },
];

export default function Features() {
  return (
    <section id="features" className="border-t border-[color:var(--rc-line)] bg-[color:var(--rc-ink-raised)]">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-xl">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--rc-plasma)]">
            Platform
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[color:var(--rc-bone)] sm:text-4xl">
            Built for the moment it matters.
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[color:var(--rc-line)] bg-[color:var(--rc-line)] sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="bg-[color:var(--rc-ink-raised)] p-8">
              <h3 className="font-display text-lg font-semibold text-[color:var(--rc-bone)]">{feature.title}</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-[color:var(--rc-bone)]/65">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}