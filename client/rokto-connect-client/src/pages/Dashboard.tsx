import React from 'react'
import CreateRequestModal from '../components/CreateRequestModal'
import { fetchRequestChat, fetchRequests, releaseDonor } from '../api/requests'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser, USER_KEY } from '../hooks/useCurrentUser'
import { useRequestFeedSocket } from '../hooks/useRequestFeedSocket'
import { Link } from 'react-router-dom'
import { BloodTypeTag, StatusPill, UrgencyPill } from '../components/requestPills'
import MyRequestsSection from '../components/MyRequestsSection'

function RequestCard({ r }: any) {
  const location = r.district || r.division || r.zip_code || 'Location unknown'
  return (
    <div className="group relative overflow-hidden rounded-xl border border-[color:var(--rc-line)] bg-white/[0.02] p-5 transition duration-200 hover:border-[color:var(--rc-blood)]/35 hover:bg-white/[0.035]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[color:var(--rc-blood)]/0 blur-2xl transition duration-300 group-hover:bg-[color:var(--rc-blood)]/10"
      />
      <div className="relative flex items-start gap-4">
        <BloodTypeTag type={r.blood_type} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={r.status} />
            <UrgencyPill urgency={r.urgency} />
            <span
              className="text-[11px] uppercase tracking-wider text-[color:var(--rc-bone)]/35"
              style={{ fontFamily: 'var(--rc-mono)' }}
            >
              {new Date(r.created_at).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {r.message ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[color:var(--rc-bone)]/70">{r.message}</p>
          ) : (
            <p className="mt-2 text-sm italic leading-6 text-[color:var(--rc-bone)]/25">No message provided.</p>
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-1.5 text-xs text-[color:var(--rc-bone)]/50 sm:flex">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
            <path d="M12 21s-7-5.1-7-11a7 7 0 1 1 14 0c0 5.9-7 11-7 11z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <span className="max-w-[9rem] truncate">{location}</span>
        </div>
      </div>
    </div>
  )
}

function RequestCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-[color:var(--rc-line)] bg-white/[0.02] p-5">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-white/[0.05]" />
        <div className="flex-1 space-y-2.5 py-0.5">
          <div className="h-3 w-28 rounded bg-white/[0.05]" />
          <div className="h-3 w-3/4 rounded bg-white/[0.04]" />
        </div>
      </div>
    </div>
  )
}

function QuickAction({
  title,
  description,
  to,
  onClick,
  actionLabel,
}: {
  title: string
  description: string
  to?: string
  onClick?: () => void
  actionLabel: string
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--rc-bone)]/35"
          style={{ fontFamily: 'var(--rc-mono)' }}
        >
          {actionLabel}
        </span>
        <span className="text-[color:var(--rc-bone)]/25 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[color:var(--rc-blood)]">
          →
        </span>
      </div>
      <div className="mt-4 text-base font-semibold" style={{ fontFamily: 'var(--rc-display)' }}>
        {title}
      </div>
      <p className="mt-1.5 text-sm leading-6 text-[color:var(--rc-bone)]/50">{description}</p>
    </>
  )

  const classes =
    'group block w-full rounded-xl border border-[color:var(--rc-line)] bg-white/[0.02] p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--rc-blood)]/35 hover:bg-white/[0.035] hover:shadow-lg hover:shadow-black/30'

  if (to) {
    return (
      <Link to={to} className={classes}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {inner}
    </button>
  )
}

function StatCard({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-[color:var(--rc-line)] bg-white/[0.02] p-4">
      <div
        className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--rc-bone)]/35"
        style={{ fontFamily: 'var(--rc-mono)' }}
      >
        {label}
      </div>
      <div
        className={`mt-2 text-3xl font-semibold tracking-tight ${accent ? 'text-[color:var(--rc-plasma)]' : ''}`}
        style={{ fontFamily: 'var(--rc-mono)' }}
      >
        {value}
      </div>
    </div>
  )
}

function ActiveDonationCard({ requestId }: { requestId: number }) {
  const queryClient = useQueryClient()
  const { data: request, isLoading } = useQuery({
    queryKey: ['request-chat', requestId],
    queryFn: () => fetchRequestChat(requestId),
    retry: false,
  })
  const releaseMutation = useMutation({
    mutationFn: () => releaseDonor(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEY })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      queryClient.removeQueries({ queryKey: ['request-chat', requestId] })
    },
  })

  if (isLoading) return <div className="mt-8 h-32 animate-pulse rounded-2xl border border-[color:var(--rc-line)] bg-white/[0.02]" />
  if (!request) return null

  return (
    <section className="mt-8 rounded-2xl border border-[color:var(--rc-plasma)]/30 bg-[color:var(--rc-plasma)]/[0.05] p-6 shadow-xl shadow-black/20 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--rc-plasma)]" style={{ fontFamily: 'var(--rc-mono)' }}>Your active donation</div>
          <h2 className="mt-2 text-xl font-bold" style={{ fontFamily: 'var(--rc-display)' }}>You are helping {request.requester_first_name}.</h2>
          <p className="mt-1 text-sm text-[color:var(--rc-bone)]/55">{request.blood_type} · {request.urgency} urgency · {request.status}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => releaseMutation.mutate()}
            disabled={releaseMutation.isPending}
            className="rounded-lg border border-red-500/40 px-4 py-3 text-sm font-semibold text-red-300 transition hover:border-red-500/60 hover:bg-red-500/10 disabled:opacity-50"
          >
            {releaseMutation.isPending ? 'Leaving...' : 'Let go'}
          </button>
          <Link to={`/chat/${request.request_id}`} className="rounded-lg bg-[color:var(--rc-plasma)] px-5 py-3 text-sm font-semibold text-[#0F0A0C] transition hover:brightness-110">
            Open chat →
          </Link>
        </div>
      </div>
      {releaseMutation.isError && (
        <p className="mt-3 text-xs text-red-300">Unable to leave this request. Please try again.</p>
      )}
    </section>
  )
}

export default function Dashboard() {
  const { data: user } = useCurrentUser()
  const [open, setOpen] = React.useState(false)
  useRequestFeedSocket()

  const { data: recent, isLoading } = useQuery({
    queryKey: ['requests', { limit: 5 }],
    queryFn: () => fetchRequests({ limit: 5 }),
    retry: false,
  })

  const requests: any[] = Array.isArray(recent) ? recent : []
  const criticalCount = requests.filter((r) => (r.urgency || '').toLowerCase() === 'critical').length
  const highCount = requests.filter((r) => ['high', 'critical'].includes((r.urgency || '').toLowerCase())).length

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase()
  const locationLine =
    user?.district || user?.division || user?.zip_code
      ? `${user.district || ''}${user.district && user.division ? ', ' : ''}${user.division || ''}${
          (user.district || user.division) && user.zip_code ? ' · ' : ''
        }${user.zip_code || ''}`.trim()
      : 'Location not provided'

  if (!user) return null

  return (
    <div style={{ fontFamily: 'var(--rc-body)' }}>
      {/* Page header */}
      <header className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(55% 90% at 85% 0%, rgba(200,30,58,0.13) 0%, rgba(15,10,12,0) 65%)',
          }}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div
              className="mb-3 text-xs uppercase tracking-[0.25em] text-[color:var(--rc-blood)]"
              style={{ fontFamily: 'var(--rc-mono)' }}
            >
              Dashboard
            </div>
            <h1
              className="text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ fontFamily: 'var(--rc-display)' }}
            >
              Welcome back, {user.first_name}.
            </h1>
            <p className="mt-2 text-sm leading-6 text-[color:var(--rc-bone)]/55">
              Track requests, reach donors, and keep the lifeline moving.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-[color:var(--rc-blood)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--rc-blood-deep)] hover:shadow-lg hover:shadow-[color:var(--rc-blood)]/20 active:scale-[0.99]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            New request
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Requests in feed" value={isLoading ? '—' : requests.length} />
        <StatCard label="Critical now" value={isLoading ? '—' : criticalCount} accent={criticalCount > 0} />
        <StatCard label="Urgent + critical" value={isLoading ? '—' : highCount} />
      </div>

      <div className="mt-8">
        <MyRequestsSection />
      </div>

      {user.is_donor && user.accepted_request_id && <ActiveDonationCard requestId={user.accepted_request_id} />}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--rc-display)' }}>
                Recent requests
              </h2>
              <span
                className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--rc-bone)]/30"
                style={{ fontFamily: 'var(--rc-mono)' }}
              >
                Live feed
              </span>
            </div>

            <div className="grid gap-3">
              {isLoading ? (
                <>
                  <RequestCardSkeleton />
                  <RequestCardSkeleton />
                  <RequestCardSkeleton />
                </>
              ) : requests.length > 0 ? (
                requests.map((r) => <RequestCard key={r.request_id} r={r} />)
              ) : (
                <div className="rounded-xl border border-dashed border-[color:var(--rc-line)] p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--rc-line)] bg-white/[0.02] text-xl text-[color:var(--rc-blood)]">
                    ♦
                  </div>
                  <p className="mt-4 text-sm font-medium">No recent requests</p>
                  <p className="mt-1 text-sm text-[color:var(--rc-bone)]/45">
                    When someone posts a blood request, it shows up here first.
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="mt-5 rounded-lg border border-[color:var(--rc-blood)]/50 px-4 py-2 text-sm font-medium text-[color:var(--rc-blood)] transition hover:bg-[color:var(--rc-blood)]/10"
                  >
                    Post the first one
                  </button>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold" style={{ fontFamily: 'var(--rc-display)' }}>
              Quick actions
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <QuickAction
                title="Create request"
                description="Post a new blood request and alert nearby donors."
                actionLabel="Post"
                onClick={() => setOpen(true)}
              />
              <QuickAction
                title="Leaderboard"
                description="See top donors ranked by donations and rating."
                actionLabel="Rankings"
                to="/leaderboard"
              />
              <QuickAction
                title="Profile"
                description="View or update your details and donor status."
                actionLabel="Account"
                to="/profile"
              />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-[color:var(--rc-line)] bg-white/[0.02] p-6 shadow-xl shadow-black/20">
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[color:var(--rc-blood)]/10 blur-3xl" />

            <div className="relative">
              <div
                className="mb-4 text-[10px] uppercase tracking-[0.2em] text-[color:var(--rc-bone)]/35"
                style={{ fontFamily: 'var(--rc-mono)' }}
              >
                Your info
              </div>

              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--rc-blood)] to-[color:var(--rc-blood-deep)] text-sm font-bold text-white shadow-lg shadow-[color:var(--rc-blood)]/25"
                  style={{ fontFamily: 'var(--rc-display)' }}
                >
                  {initials || '?'}
                </div>
                <div>
                  <div className="font-semibold" style={{ fontFamily: 'var(--rc-display)' }}>
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="mt-0.5 text-xs text-[color:var(--rc-bone)]/50">
                    {user.is_donor ? 'Registered donor' : 'Member'}
                  </div>
                </div>
              </div>

              <dl className="mt-5 space-y-3 border-t border-[color:var(--rc-line)] pt-5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-xs text-[color:var(--rc-bone)]/40">Phone</dt>
                  <dd
                    className="truncate text-xs text-[color:var(--rc-bone)]/80"
                    style={{ fontFamily: 'var(--rc-mono)' }}
                  >
                    {user.phone_number || 'Not provided'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="shrink-0 text-xs text-[color:var(--rc-bone)]/40">Location</dt>
                  <dd className="truncate text-xs text-[color:var(--rc-bone)]/80">{locationLine}</dd>
                </div>
              </dl>

              <Link
                to="/profile"
                className="group mt-5 flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--rc-line)] py-2.5 text-xs font-medium text-[color:var(--rc-bone)]/70 transition hover:border-[color:var(--rc-bone)]/30 hover:text-[color:var(--rc-bone)]"
              >
                Manage profile
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>

          {user?.is_donor && (
            <div className="relative overflow-hidden rounded-2xl border border-[color:var(--rc-plasma)]/25 bg-gradient-to-b from-[color:var(--rc-plasma)]/[0.06] to-transparent p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[color:var(--rc-plasma)]/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-2.5">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[color:var(--rc-plasma)]">
                    <path d="M12 2.7s6.5 7.2 6.5 11.8a6.5 6.5 0 1 1-13 0C5.5 9.9 12 2.7 12 2.7z" opacity="0.9" />
                  </svg>
                  <div
                    className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--rc-plasma)]"
                    style={{ fontFamily: 'var(--rc-mono)' }}
                  >
                    Donor active
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-[color:var(--rc-bone)]/70">
                  You're listed as a donor. Someone nearby may need you today.
                </p>

                <Link
                  to="/donor/requests"
                  className="group mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-[color:var(--rc-plasma)] px-4 py-2.5 text-xs font-semibold text-[#0F0A0C] transition hover:brightness-110 active:scale-[0.99]"
                >
                  View nearby requests
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>

      <CreateRequestModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
