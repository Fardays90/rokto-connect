
import { Link } from 'react-router-dom'

export default function CTABanner() {
  return (
    <section id="hospitals" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(120deg, rgba(122,17,40,0.35) 0%, rgba(15,10,12,0) 55%)",
        }}
      />
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 py-20 sm:flex-row sm:items-center">
        <div className="max-w-lg">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-[color:var(--rc-bone)] sm:text-4xl">
            Someone nearby needs your type.
          </h2>
          <p className="mt-3 font-body text-sm text-[color:var(--rc-bone)]/65 sm:text-base">
            Join as a donor in under two minutes, or post a request if you're
            sourcing blood for a patient right now.
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap gap-4">
          <Link to="/register" className="rounded-full bg-[color:var(--rc-blood)] px-6 py-3 font-body text-sm font-semibold text-[color:var(--rc-bone)] transition hover:bg-[color:var(--rc-blood-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--rc-plasma)]">Become a donor</Link>
          <Link to="/register" className="rounded-full border border-[color:var(--rc-line)] px-6 py-3 font-body text-sm font-semibold text-[color:var(--rc-bone)] transition hover:border-[color:var(--rc-bone)]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--rc-plasma)]">Request blood</Link>
        </div>
      </div>
    </section>
  );
}