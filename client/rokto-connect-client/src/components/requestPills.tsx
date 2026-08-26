// Small shared badges used across the dashboard feed, donor pages and profile.

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  DONOR_FOUND:
    'border-[color:var(--rc-plasma)]/40 bg-[color:var(--rc-plasma)]/10 text-[color:var(--rc-plasma)]',
  COMPLETED: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
}

export function StatusPill({ status }: { status?: string }) {
  const key = (status || 'PENDING').toUpperCase()
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider ${STATUS_STYLES[key] || STATUS_STYLES.PENDING}`}
      style={{ fontFamily: 'var(--rc-mono)' }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {key.replace('_', ' ')}
    </span>
  )
}

const URGENCY_STYLES: Record<string, string> = {
  critical: 'border-[color:var(--rc-blood)]/50 bg-[color:var(--rc-blood)]/15 text-[color:var(--rc-blood)]',
  high: 'border-[color:var(--rc-plasma)]/40 bg-[color:var(--rc-plasma)]/10 text-[color:var(--rc-plasma)]',
  medium: 'border-[color:var(--rc-line)] bg-white/[0.04] text-[color:var(--rc-bone)]/70',
  low: 'border-[color:var(--rc-line)] bg-transparent text-[color:var(--rc-bone)]/45',
}

export function UrgencyPill({ urgency }: { urgency?: string }) {
  const key = (urgency || '').toLowerCase()
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider ${URGENCY_STYLES[key] || URGENCY_STYLES.medium}`}
      style={{ fontFamily: 'var(--rc-mono)' }}
    >
      {key === 'critical' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      {urgency || 'unknown'}
    </span>
  )
}

export function BloodTypeTag({ type }: { type?: string }) {
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[color:var(--rc-blood)]/30 bg-[color:var(--rc-blood)]/10 text-sm font-semibold text-[color:var(--rc-blood)]"
      style={{ fontFamily: 'var(--rc-mono)' }}
    >
      {type || '—'}
    </div>
  )
}
