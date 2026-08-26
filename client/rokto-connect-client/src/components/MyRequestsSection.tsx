import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BloodRequest } from '../api/requests'
import { MY_REQUESTS_KEY, deleteRequest, fetchMyRequests, releaseDonor } from '../api/requests'
import EditRequestModal from './EditRequestModal'
import ReviewModal from './ReviewModal'
import ApiModal from './ApiModal'
import { BloodTypeTag, StatusPill, UrgencyPill } from './requestPills'
import { Link } from 'react-router-dom'

function CardButton({
  onClick,
  disabled,
  tone = 'neutral',
  children,
}: {
  onClick: () => void
  disabled?: boolean
  tone?: 'neutral' | 'danger' | 'primary'
  children: React.ReactNode
}) {
  const tones = {
    neutral:
      'border border-[color:var(--rc-line)] text-[color:var(--rc-bone)]/70 hover:border-[color:var(--rc-bone)]/30 hover:text-[color:var(--rc-bone)]',
    danger:
      'border border-red-500/40 text-red-300 hover:bg-red-500/10 hover:border-red-500/60',
    primary:
      'border border-[color:var(--rc-plasma)]/50 text-[color:var(--rc-plasma)] hover:bg-[color:var(--rc-plasma)]/10',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  )
}

function MyRequestCard({
  request,
  busy,
  confirmingDelete,
  onEdit,
  onRemoveDonor,
  onComplete,
  onDeleteClick,
}: {
  request: BloodRequest
  busy: boolean
  confirmingDelete: boolean
  onEdit: () => void
  onRemoveDonor: () => void
  onComplete: () => void
  onDeleteClick: () => void
}) {
  const location =
    [request.district, request.division, request.zip_code].filter(Boolean).join(', ') ||
    'Location unknown'

  const donorName =
    [request.donor_first_name, request.donor_last_name].filter(Boolean).join(' ') || null

  const canEdit = request.status === 'PENDING' || request.status === 'DONOR_FOUND'

  return (
    <div className="relative overflow-hidden rounded-xl border border-[color:var(--rc-line)] bg-white/[0.02] p-5 transition duration-200 hover:border-[color:var(--rc-blood)]/25">
      <div className="flex items-start gap-4">
        <BloodTypeTag type={request.blood_type} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={request.status} />
            <UrgencyPill urgency={request.urgency} />
            <span
              className="text-[11px] uppercase tracking-wider text-[color:var(--rc-bone)]/35"
              style={{ fontFamily: 'var(--rc-mono)' }}
            >
              {new Date(request.created_at).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {request.message ? (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[color:var(--rc-bone)]/70">
              {request.message}
            </p>
          ) : (
            <p className="mt-2 text-sm italic leading-6 text-[color:var(--rc-bone)]/25">
              No message provided.
            </p>
          )}

          <div className="mt-2 flex items-center gap-1.5 text-xs text-[color:var(--rc-bone)]/45">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5 shrink-0">
              <path d="M12 21s-7-5.1-7-11a7 7 0 1 1 14 0c0 5.9-7 11-7 11z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <span className="truncate">{location}</span>
          </div>

          {/* accepted donor */}
          {request.status === 'DONOR_FOUND' && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-[color:var(--rc-plasma)]/25 bg-[color:var(--rc-plasma)]/[0.06] px-3.5 py-2.5">
              <span
                className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--rc-plasma)]"
                style={{ fontFamily: 'var(--rc-mono)' }}
              >
                Donor found
              </span>
              {donorName && <span className="text-sm font-medium">{donorName}</span>}
              {request.donor_phone_number && (
                <span
                  className="text-xs text-[color:var(--rc-bone)]/55"
                  style={{ fontFamily: 'var(--rc-mono)' }}
                >
                  {request.donor_phone_number}
                </span>
              )}
              <span className="text-xs text-[color:var(--rc-bone)]/55">
                Rating {Number(request.donor_rating || 0).toFixed(1)} · {request.donor_donation_count || 0} donations
              </span>
              {(request.donor_district || request.donor_division) && (
                <span className="text-xs text-[color:var(--rc-bone)]/55">
                  {[request.donor_district, request.donor_division].filter(Boolean).join(', ')}
                </span>
              )}
              {request.donor_verified && <span className="text-xs text-emerald-300/80">Verified</span>}
              {!donorName && !request.donor_phone_number && (
                <span className="text-xs text-[color:var(--rc-bone)]/45">Details unavailable</span>
              )}
            </div>
          )}


          {/* completed marker */}
          {request.status === 'COMPLETED' && (
            <p className="mt-3 text-xs leading-5 text-emerald-300/80">
              ✓ This request was fulfilled. The donor has been credited.
            </p>
          )}
        </div>
      </div>

      {/* actions */}
      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-[color:var(--rc-line)] pt-4">
        {canEdit && (
          <CardButton onClick={onEdit} disabled={busy}>
            ✎ Edit
          </CardButton>
        )}
        {request.status === 'DONOR_FOUND' && (
          <>
            <CardButton onClick={onRemoveDonor} disabled={busy}>
              Remove donor · reopen
            </CardButton>
            <CardButton tone="primary" onClick={onComplete} disabled={busy}>
              Mark completed
            </CardButton>
          </>
        )}
        {request.chat_id && (
          <Link to={`/chat/${request.request_id}`} className="rounded-lg border border-[color:var(--rc-plasma)]/50 px-3.5 py-2 text-xs font-semibold text-[color:var(--rc-plasma)] transition hover:bg-[color:var(--rc-plasma)]/10">
            Open chat
          </Link>
        )}
        <CardButton
          tone={confirmingDelete ? 'danger' : 'neutral'}
          onClick={onDeleteClick}
          disabled={busy}
        >
          {confirmingDelete ? 'Really delete?' : '🗑 Delete'}
        </CardButton>
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-[color:var(--rc-line)] bg-white/[0.02] p-5">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-white/[0.05]" />
        <div className="flex-1 space-y-2.5 py-0.5">
          <div className="h-3 w-32 rounded bg-white/[0.05]" />
          <div className="h-3 w-3/4 rounded bg-white/[0.04]" />
        </div>
      </div>
    </div>
  )
}

interface FeedbackState {
  loading?: boolean
  success?: boolean
  error?: string
  title?: string
}

export default function MyRequestsSection() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: MY_REQUESTS_KEY,
    queryFn: fetchMyRequests,
    retry: false,
  })
  const requests: BloodRequest[] = Array.isArray(data) ? data : []

  const [editingRequest, setEditingRequest] = React.useState<BloodRequest | null>(null)
  const [completingRequest, setCompletingRequest] = React.useState<BloodRequest | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = React.useState<number | null>(null)
  const [feedback, setFeedback] = React.useState<FeedbackState>({})

  const refreshFeeds = () => {
    queryClient.invalidateQueries({ queryKey: MY_REQUESTS_KEY })
    queryClient.invalidateQueries({ queryKey: ['requests'] })
  }

  const releaseMutation = useMutation({
    mutationFn: (requestId: number) => releaseDonor(requestId),
    onSuccess: () => {
      setFeedback({ success: true, title: 'Remove Donor' })
      refreshFeeds()
    },
    onError: (error: any) =>
      setFeedback({ error: error?.response?.data?.detail || 'Failed to remove donor', title: 'Remove Donor' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (requestId: number) => deleteRequest(requestId),
    onSuccess: () => {
      setFeedback({ success: true, title: 'Delete Request' })
      setConfirmingDeleteId(null)
      refreshFeeds()
    },
    onError: (error: any) =>
      setFeedback({ error: error?.response?.data?.detail || 'Failed to delete request', title: 'Delete Request' }),
  })

  // any in-flight mutation disables the card buttons
  const busy = releaseMutation.isPending || deleteMutation.isPending

  return (
    <section className="rounded-2xl border border-[color:var(--rc-line)] bg-white/[0.02] p-6 shadow-xl shadow-black/20 sm:p-7">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--rc-display)' }}>
            My blood requests.
          </h2>
          <p className="mt-1 text-sm leading-6 text-[color:var(--rc-bone)]/50">
            Track each request from pending to completed and update it along the way.
          </p>
        </div>
        <span
          className="shrink-0 rounded-full border border-[color:var(--rc-line)] px-3 py-1 text-[11px] uppercase tracking-wider text-[color:var(--rc-bone)]/45"
          style={{ fontFamily: 'var(--rc-mono)' }}
        >
          {isLoading ? '…' : requests.length}
        </span>
      </header>

      <div className="mt-6 grid gap-3">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : requests.length > 0 ? (
          requests.map((request) => (
            <MyRequestCard
              key={request.request_id}
              request={request}
              busy={busy}
              confirmingDelete={confirmingDeleteId === request.request_id}
              onEdit={() => setEditingRequest(request)}
               onRemoveDonor={() => releaseMutation.mutate(request.request_id)}
              onComplete={() => setCompletingRequest(request)}
               onDeleteClick={() => {
                if (confirmingDeleteId === request.request_id) {
                  deleteMutation.mutate(request.request_id)
                } else {
                  setConfirmingDeleteId(request.request_id)
                }
               }}
             />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-[color:var(--rc-line)] p-10 text-center">
            <p className="text-sm font-medium">No requests yet</p>
            <p className="mt-1 text-sm text-[color:var(--rc-bone)]/45">
              Post one from the dashboard and it will show up here.
            </p>
          </div>
        )}
      </div>

      {editingRequest && <EditRequestModal request={editingRequest} onClose={() => setEditingRequest(null)} />}

      {completingRequest && (
        <ReviewModal request={completingRequest} onClose={() => setCompletingRequest(null)} />
      )}

      <ApiModal
        open={!!feedback.loading || !!feedback.success || !!feedback.error}
        loading={!!feedback.loading}
        success={!!feedback.success}
        error={feedback.error || null}
        title={feedback.title || 'Update Request'}
        onClose={() => setFeedback({})}
      />
    </section>
  )
}
