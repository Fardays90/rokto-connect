import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { BloodRequest } from '../api/requests'
import { MY_REQUESTS_KEY, completeRequest } from '../api/requests'
import ApiModal from './ApiModal'

export default function ReviewModal({
  request,
  onClose,
}: {
  request: BloodRequest
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [rating, setRating] = React.useState<number | null>(null)
  const [comment, setComment] = React.useState('')
  const [validationError, setValidationError] = React.useState<string | null>(null)

  const donorName =
    [request.donor_first_name, request.donor_last_name].filter(Boolean).join(' ') ||
    'your donor'

  const closeAll = () => {
    mutation.reset()
    onClose()
  }

  const dismissStatus = () => {
    if (mutation.isLoading) return
    if (mutation.isSuccess) {
      closeAll()
    } else {
      mutation.reset()
    }
  }

  const mutation: any = useMutation({
    mutationFn: () =>
      completeRequest(request.request_id, {
        rating: rating as number,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_REQUESTS_KEY })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      setTimeout(closeAll, 1200)
    },
  })

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!rating) {
      setValidationError('Please pick a rating first.')
      return
    }
    setValidationError(null)
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeAll} />

      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[color:var(--rc-line)] bg-[color:var(--rc-ink-raised)] p-7 text-[color:var(--rc-bone)] shadow-2xl"
        style={{ fontFamily: 'var(--rc-body)' }}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[color:var(--rc-plasma)]/10 blur-3xl" />

        <div className="relative flex items-start justify-between">
          <div>
            <div
              className="mb-2 text-xs uppercase tracking-[0.25em] text-[color:var(--rc-plasma)]"
              style={{ fontFamily: 'var(--rc-mono)' }}
            >
              Complete request
            </div>
            <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--rc-display)' }}>
              Review your donor.
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-[color:var(--rc-bone)]/45">
              This closes request #{String(request.request_id).padStart(4, '0')} and thanks{' '}
              {donorName} with a rating.
            </p>
          </div>

          <button
            type="button"
            onClick={closeAll}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[color:var(--rc-bone)]/40 transition hover:bg-white/5 hover:text-[color:var(--rc-bone)]"
          >
            ✕
          </button>
        </div>

        <form className="relative mt-6 space-y-5" onSubmit={onSubmit} noValidate>
          {/* Rating */}
          <div>
            <label className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60">
              Rating <span className="text-[color:var(--rc-blood)]">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setRating(value)
                    setValidationError(null)
                  }}
                  aria-label={`Rate ${value} out of 5`}
                  className={`rounded-lg p-1.5 transition active:scale-95 ${
                    rating && value <= rating
                      ? 'text-[color:var(--rc-plasma)]'
                      : 'text-[color:var(--rc-bone)]/20 hover:text-[color:var(--rc-bone)]/50'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
                  </svg>
                </button>
              ))}
              {rating ? (
                <span
                  className="ml-2 text-xs text-[color:var(--rc-bone)]/60"
                  style={{ fontFamily: 'var(--rc-mono)' }}
                >
                  {rating}/5
                </span>
              ) : null}
            </div>
            {validationError && <p className="mt-1.5 text-xs text-red-400">{validationError}</p>}
          </div>

          {/* Comment */}
          <div>
            <label className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60">
              Comment <span className="text-[color:var(--rc-bone)]/30">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              maxLength={255}
              placeholder={`How was ${donorName}?`}
              className="w-full resize-none rounded-lg border border-[color:var(--rc-line)] bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-[color:var(--rc-bone)]/20 focus:border-[color:var(--rc-plasma)] focus:ring-2 focus:ring-[color:var(--rc-plasma)]/10"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={closeAll}
              className="rounded-lg border border-[color:var(--rc-line)] px-4 py-2.5 text-sm font-medium text-[color:var(--rc-bone)]/70 transition hover:border-[color:var(--rc-bone)]/30 hover:text-[color:var(--rc-bone)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="group flex items-center gap-2 rounded-lg bg-[color:var(--rc-blood)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--rc-blood-deep)] hover:shadow-lg hover:shadow-[color:var(--rc-blood)]/20 active:scale-[0.99] disabled:opacity-60"
            >
              {mutation.isLoading ? (
                <>
                  <svg className="rc-spinner h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                    <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeDasharray="20 36.5" />
                  </svg>
                  Completing...
                </>
              ) : (
                <>
                  Complete & rate
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </>
              )}
            </button>
          </div>
        </form>

        <ApiModal
          open={mutation.isLoading || mutation.isError || mutation.isSuccess}
          loading={mutation.isLoading}
          success={mutation.isSuccess}
          error={
            mutation.isError ? (mutation.error as any)?.response?.data?.detail || 'Failed to complete request' : null
          }
          title="Complete Request"
          onClose={dismissStatus}
        />
      </div>
    </div>
  )
}
