import React from 'react'
import { Link } from 'react-router-dom'
import { useCurrentUser, USER_KEY } from '../hooks/useCurrentUser'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { acceptRequest, fetchRequests, releaseDonor } from '../api/requests'
import ApiModal from '../components/ApiModal'

export default function DonorRequests() {
  const { data: user } = useCurrentUser()
  const queryClient = useQueryClient()

  const params = { zip_code: user?.zip_code, division: user?.division }
  const { data, isLoading } = useQuery({ queryKey: ['requests', params], queryFn: () => fetchRequests(params) })

  // the request this donor is currently engaged with (if any)
  const engagedRequestId = user?.accepted_request_id ?? null

  const [feedback, setFeedback] = React.useState<{ loading?: boolean; success?: boolean; error?: string }>({})

  const refreshAfterEngagementChange = () => {
    // engagement changes both the donor's own state and request statuses
    queryClient.invalidateQueries({ queryKey: USER_KEY })
    queryClient.invalidateQueries({ queryKey: ['requests'] })
  }

  const acceptMutation = useMutation({
    mutationFn: (requestId: number) => acceptRequest(requestId),
      onSuccess: () => {
      setFeedback({ success: true })
      refreshAfterEngagementChange()
    },
      onError: (error: any) => setFeedback({ error: error?.response?.data?.detail || 'Failed to accept request' }),
  })

  const releaseMutation = useMutation({
    mutationFn: (requestId: number) => releaseDonor(requestId),
      onSuccess: () => {
      setFeedback({ success: true })
      refreshAfterEngagementChange()
    },
    onError: (error: any) => setFeedback({ error: error?.response?.data?.detail || 'Failed to let go of request' }),
  })

  const busy = acceptMutation.isPending || releaseMutation.isPending

  if (!user?.is_donor) return <div>You are not registered as a donor.</div>

  return (
    <div className="space-y-4" style={{ fontFamily: 'var(--rc-body)' }}>
      <header>
        <div
          className="mb-2 text-xs uppercase tracking-[0.25em] text-[color:var(--rc-plasma)]"
          style={{ fontFamily: 'var(--rc-mono)' }}
        >
          Donor
        </div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--rc-display)' }}>
          Nearby requests.
        </h1>
        <p className="mt-2 text-sm leading-6 text-[color:var(--rc-bone)]/55">
          {engagedRequestId
            ? 'You are engaged with a request. Let go of it before accepting another.'
            : 'Accept a request to engage with it — one at a time.'}
        </p>
      </header>

      {isLoading && <div className="text-sm text-[color:var(--rc-bone)]/50">Loading...</div>}

      <div className="grid gap-3">
        {(data as any[])?.map((r: any) => {
          const mine = engagedRequestId === r.request_id
          const engagedElsewhere = engagedRequestId !== null && !mine
          // feed shows PENDING + DONOR_FOUND; only open ones can be accepted
          const isPending = (r.status || 'PENDING') === 'PENDING'

          return (
            <div
              key={r.request_id}
              className={`rounded-xl border p-5 transition ${
                mine
                  ? 'border-[color:var(--rc-plasma)]/40 bg-[color:var(--rc-plasma)]/[0.06]'
                  : 'border-[color:var(--rc-line)] bg-white/[0.02] hover:border-[color:var(--rc-blood)]/30'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    <span
                      className="mr-2 text-[color:var(--rc-blood)]"
                      style={{ fontFamily: 'var(--rc-mono)' }}
                    >
                      {r.blood_type}
                    </span>
                    · {(r.urgency || '').toLowerCase()} urgency
                  </div>
                  <div className="mt-0.5 text-xs text-[color:var(--rc-bone)]/50">
                    {new Date(r.created_at).toLocaleString()} ·{' '}
                    {r.district || r.division || r.zip_code || 'Location unknown'}
                  </div>
                </div>

                <div className="shrink-0">
                  {mine ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => releaseMutation.mutate(r.request_id)}
                      className="rounded-lg border border-[color:var(--rc-plasma)]/50 px-4 py-2 text-xs font-semibold text-[color:var(--rc-plasma)] transition hover:bg-[color:var(--rc-plasma)]/10 active:scale-[0.98] disabled:opacity-50"
                    >
                      You accepted this · Let go
                    </button>
                  ) : r.user_id === user.user_id ? (
                    // your own request — never acceptable, even though it
                    // shows up in the division feed (server blocks it too)
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--rc-line)] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-[color:var(--rc-bone)]/50"
                      style={{ fontFamily: 'var(--rc-mono)' }}
                    >
                      Your request
                    </span>
                  ) : !isPending ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--rc-plasma)]/40 bg-[color:var(--rc-plasma)]/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-[color:var(--rc-plasma)]"
                      style={{ fontFamily: 'var(--rc-mono)' }}
                    >
                      Donor found
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={busy || !!engagedElsewhere}
                        title={engagedElsewhere ? 'Let go of your current request first' : undefined}
                        onClick={() => acceptMutation.mutate(r.request_id)}
                        className="rounded-lg bg-[color:var(--rc-blood)] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[color:var(--rc-blood-deep)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Accept
                      </button>
                      {engagedElsewhere && (
                        <p className="mt-1 max-w-[12rem] text-right text-[11px] leading-4 text-[color:var(--rc-bone)]/35">
                          Engaged with another request
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {r.message && (
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[color:var(--rc-bone)]/70">
                  {r.message}
                </p>
              )}
              {mine && r.chat_id && (
                <Link to={`/chat/${r.request_id}`} className="mt-3 inline-block rounded-lg border border-[color:var(--rc-plasma)]/50 px-3.5 py-2 text-xs font-semibold text-[color:var(--rc-plasma)] hover:bg-[color:var(--rc-plasma)]/10">
                  Open chat
                </Link>
              )}
            </div>
          )
        })}
        {!isLoading && !(data as any[])?.length && (
          <div className="text-sm text-[color:var(--rc-bone)]/50">No nearby requests</div>
        )}
      </div>

      <ApiModal
        open={!!feedback.loading || !!feedback.success || !!feedback.error}
        loading={!!feedback.loading}
        success={!!feedback.success}
        error={feedback.error || null}
        title={releaseMutation.isPending || releaseMutation.isSuccess ? 'Let Go' : 'Accept Request'}
        onClose={() => setFeedback({})}
      />
    </div>
  )
}
