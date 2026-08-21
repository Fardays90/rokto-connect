const STATS: Array<{ label: string; value: string }> = [
  { label: "Registered donors", value: "12,400+" },
  { label: "Requests fulfilled", value: "3,180" },
  { label: "Avg. response time", value: "11 min" },
  { label: "Cities covered", value: "14" },
];
export default function StatsStrip() {
  return (
    <section className="border-y border-[color:var(--rc-line)] bg-[color:var(--rc-ink)]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-[color:var(--rc-line)] px-6 sm:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="px-4 py-8 text-center first:pl-0 sm:text-left sm:first:px-4">
            <div className="font-mono text-2xl font-medium text-[color:var(--rc-bone)] sm:text-3xl">{stat.value}</div>
            <div className="mt-1 font-body text-xs uppercase tracking-wide text-[color:var(--rc-bone)]/45">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}