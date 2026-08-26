import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchRequestChat, releaseDonor } from '../api/requests'
import { useCurrentUser, USER_KEY } from '../hooks/useCurrentUser'
import { useChatSocket } from '../hooks/useChatSocket'

export default function Chat() {
  const { requestId } = useParams()
  const id = Number(requestId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: user } = useCurrentUser()
  const { data: request, isLoading, isError } = useQuery({
    queryKey: ['request-chat', id],
    queryFn: () => fetchRequestChat(id),
    enabled: Number.isInteger(id) && id > 0,
    retry: false,
  })
  const { messages, connected, onlineCount, status, sendMessage } = useChatSocket(
    request?.request_id || null,
    !!request,
  )
  const [draft, setDraft] = React.useState('')
  const [profileOpen, setProfileOpen] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const releaseMutation = useMutation({
    mutationFn: () => releaseDonor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEY })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      queryClient.removeQueries({ queryKey: ['request-chat', id] })
      navigate('/dashboard')
    },
  })

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isRequester = user?.user_id === request?.requester_id
  const otherName = isRequester
    ? [request?.donor_first_name, request?.donor_last_name].filter(Boolean).join(' ')
    : [request?.requester_first_name, request?.requester_last_name].filter(Boolean).join(' ')

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.trim() || !connected) return
    sendMessage(draft)
    setDraft('')
  }

  if (isLoading) {
    return <div className="py-20 text-center text-sm text-[color:var(--rc-bone)]/50">Loading chat...</div>
  }
  if (isError || !request) {
    return <div className="py-20 text-center text-sm text-[color:var(--rc-bone)]/50">This chat is unavailable.</div>
  }

  const displayName = otherName || 'Donation partner'
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const presenceText = onlineCount > 1 ? 'Both of you are here' : `Waiting for ${displayName}`
  const connectionText = status === 'error' ? 'Connection unavailable' : connected ? presenceText : 'Connecting securely...'
  const reviews = request.other_party_reviews || []
  const hasDonorHistory = request.other_party_donation_count !== null && request.other_party_donation_count !== undefined

  return (
    <div
      className="mx-auto flex h-full min-h-0 max-w-5xl flex-col overflow-hidden rounded-2xl border border-[color:var(--rc-line)] bg-white/[0.02] shadow-2xl shadow-black/30"
      style={{ fontFamily: 'var(--rc-body)' }}
    >
      <header className="relative z-20 flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--rc-line)] bg-[color:var(--rc-ink-raised)] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/dashboard"
            aria-label="Back to dashboard"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:var(--rc-bone)]/55 transition hover:bg-white/[0.06] hover:text-[color:var(--rc-bone)]"
          >
            ←
          </Link>

          <button
            type="button"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((open) => !open)}
            className="flex min-w-0 items-center gap-3 rounded-xl p-1 text-left transition hover:bg-white/[0.04]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--rc-blood)] to-[color:var(--rc-blood-deep)] text-sm font-semibold text-white">
              {initials || '?'}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-bold sm:text-lg" style={{ fontFamily: 'var(--rc-display)' }}>
                {displayName}
              </span>
              <span className={`mt-0.5 block truncate text-xs ${status === 'error' ? 'text-red-300' : onlineCount > 1 ? 'text-emerald-300' : 'text-[color:var(--rc-bone)]/45'}`}>
                <span className="mr-1.5">●</span>{connectionText}
              </span>
            </span>
          </button>

          {profileOpen && (
            <div className="absolute left-14 top-[4.75rem] w-[min(22rem,calc(100vw-3rem))] rounded-2xl border border-[color:var(--rc-line)] bg-[color:var(--rc-ink-raised)] p-5 shadow-2xl shadow-black/50 sm:left-20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold" style={{ fontFamily: 'var(--rc-display)' }}>{displayName}</p>
                  <p className="mt-1 text-xs text-[color:var(--rc-bone)]/40">Donor history</p>
                </div>
                <button type="button" onClick={() => setProfileOpen(false)} className="text-sm text-[color:var(--rc-bone)]/40 hover:text-[color:var(--rc-bone)]">✕</button>
              </div>

              {hasDonorHistory ? (
                <>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                      <div className="text-lg font-semibold text-[color:var(--rc-plasma)]">{Number(request.other_party_rating || 0).toFixed(1)}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-[color:var(--rc-bone)]/35">Rating</div>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                      <div className="text-lg font-semibold">{request.other_party_review_count || 0}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-[color:var(--rc-bone)]/35">Reviews</div>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                      <div className="text-lg font-semibold">{request.other_party_donation_count || 0}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-[color:var(--rc-bone)]/35">Donations</div>
                    </div>
                  </div>

                  <div className="mt-4 max-h-52 space-y-2 overflow-y-auto">
                    {reviews.length ? reviews.map((review, index) => (
                      <div key={`${index}-${review.comment || review.rating}`} className="rounded-xl border border-[color:var(--rc-line)] p-3">
                        <div className="text-xs font-semibold text-[color:var(--rc-plasma)]">★ {Number(review.rating).toFixed(1)}</div>
                        {review.comment && <p className="mt-1.5 text-xs leading-5 text-[color:var(--rc-bone)]/60">{review.comment}</p>}
                      </div>
                    )) : <p className="py-3 text-center text-xs text-[color:var(--rc-bone)]/35">No written reviews yet.</p>}
                  </div>
                </>
              ) : (
                <p className="mt-5 rounded-xl bg-white/[0.04] px-4 py-5 text-center text-xs text-[color:var(--rc-bone)]/45">
                  No donor history available.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!isRequester && (
            <button
              type="button"
              onClick={() => releaseMutation.mutate()}
              disabled={releaseMutation.isPending}
              className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-300 transition hover:border-red-500/60 hover:bg-red-500/10 disabled:opacity-50"
            >
              {releaseMutation.isPending ? 'Leaving...' : 'Let go'}
            </button>
          )}
          <div className="hidden rounded-lg border border-[color:var(--rc-line)] px-3 py-2 text-right sm:block">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--rc-bone)]/35" style={{ fontFamily: 'var(--rc-mono)' }}>Request</div>
            <div className="mt-1 text-sm font-semibold text-[color:var(--rc-blood)]">{request.blood_type} · {request.urgency}</div>
          </div>
        </div>
      </header>

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--rc-line)] bg-black/10 px-4 py-2.5 text-xs sm:px-6">
        <span className={`truncate ${releaseMutation.isError ? 'text-red-300' : 'text-[color:var(--rc-bone)]/45'}`}>
          {releaseMutation.isError ? 'Unable to leave this request. Please try again.' : request.message || 'No additional request message.'}
        </span>
        <span className="shrink-0 rounded-full border border-[color:var(--rc-plasma)]/30 px-2.5 py-1 text-[color:var(--rc-plasma)]">{request.status}</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-5 sm:px-7">
        {!messages.length && (
          <div className="m-auto text-center">
            <div className="text-2xl">♡</div>
            <p className="mt-2 text-sm text-[color:var(--rc-bone)]/50">No messages yet</p>
            <p className="mt-1 text-xs text-[color:var(--rc-bone)]/30">Say hello and coordinate the donation.</p>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={`${index}-${message.text}`}
            className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${message.sender === 'self' ? 'self-end rounded-br-sm bg-[color:var(--rc-blood)] text-white' : 'self-start rounded-bl-sm bg-white/[0.08] text-[color:var(--rc-bone)]/85'}`}
          >
            {message.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={submit} className="flex shrink-0 gap-3 border-t border-[color:var(--rc-line)] bg-[color:var(--rc-ink-raised)] p-3 sm:p-4">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={!connected}
          placeholder={connected ? 'Type a message...' : 'Waiting for secure connection...'}
          className="min-w-0 flex-1 rounded-xl border border-[color:var(--rc-line)] bg-white/[0.04] px-4 py-3 text-sm outline-none transition focus:border-[color:var(--rc-blood)] disabled:opacity-50"
        />
        <button type="submit" disabled={!connected || !draft.trim()} className="rounded-xl bg-[color:var(--rc-blood)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--rc-blood-deep)] disabled:cursor-not-allowed disabled:opacity-40">
          Send
        </button>
      </form>
    </div>
  )
}
