const STEPS: Array<{ index: string; title: string; body: string }> = [
  {
    index: "01",
    title: "Post a request",
    body: "Hospitals and patients submit blood type, units needed, and urgency in under a minute.",
  },
  {
    index: "02",
    title: "Get matched",
    body: "Verified, nearby donors with a compatible type see the request instantly and respond.",
  },
  {
    index: "03",
    title: "Confirm & connect",
    body: "Chat in-app to agree on a time and place, then track the donation through to completion.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-24">
      <div className="max-w-xl">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--rc-plasma)]">
          How it works
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[color:var(--rc-bone)] sm:text-4xl">
          From urgent to fulfilled, in three steps.
        </h2>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.index} className="relative">
            <span
              aria-hidden="true"
              className="font-display text-6xl font-semibold text-transparent [-webkit-text-stroke:1px_rgba(243,237,231,0.18)]"
            >
              {step.index}
            </span>
            <h3 className="mt-3 font-display text-xl font-semibold text-[color:var(--rc-bone)]">{step.title}</h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-[color:var(--rc-bone)]/65">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}