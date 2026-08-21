const BLOOD_TYPES = ["O−", "O+", "A−", "A+", "B−", "B+", "AB−", "AB+"];

export default function BloodTypes() {
  return (
    <div className="mx-auto flex max-w-6xl flex-wrap gap-3 px-6 pb-4">
      {BLOOD_TYPES.map((type) => (
        <span
          key={type}
          className="rounded-full border border-[color:var(--rc-line)] px-3 py-1 font-mono text-xs text-[color:var(--rc-bone)]/60"
        >
          {type}
        </span>
      ))}
    </div>
  );
}
