import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { becomeDonor } from '../api/donors'
import { BLOOD_TYPES } from './CreateRequestModal'
import ApiModal from './ApiModal'

export default function BecomeDonorModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [bloodType, setBloodType] = React.useState<string | null>(null)
  const [validationError, setValidationError] = React.useState<string | null>(null)

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

  // refreshing USER_KEY flips is_donor everywhere at once (nav, pages)
  const mutation: any = useMutation({
    mutationFn: () => becomeDonor({ blood_type: bloodType as string }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
      setTimeout(closeAll, 1200)
    },
  })

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!bloodType) {
      setValidationError('Please select your blood type.')
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
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[color:var(--rc-blood)]/10 blur-3xl" />

        <div className="relative flex items-start justify-between">
          <div>
            <div
              className="mb-2 text-xs uppercase tracking-[0.25em] text-[color:var(--rc-blood)]"
              style={{ fontFamily: 'var(--rc-mono)' }}
            >
              Donor registration
            </div>
            <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--rc-display)' }}>
              Become a donor.
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-[color:var(--rc-bone)]/45">
              Pick your blood type to start accepting nearby requests.
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
          {/* Blood type */}
          <div>
            <label className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60">
              Blood type <span className="text-[color:var(--rc-blood)]">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setBloodType(type)
                    setValidationError(null)
                  }}
                  className={`rounded-lg border py-3 text-sm font-semibold transition active:scale-[0.97] ${
                    bloodType === type
                      ? 'border-[color:var(--rc-blood)] bg-[color:var(--rc-blood)]/15 text-[color:var(--rc-blood)]'
                      : 'border-[color:var(--rc-line)] bg-black/20 text-[color:var(--rc-bone)]/60 hover:border-[color:var(--rc-blood)]/40 hover:text-[color:var(--rc-bone)]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {validationError && <p className="mt-1.5 text-xs text-red-400">{validationError}</p>}
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
                  Registering...
                </>
              ) : (
                <>
                  Start donating
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
            mutation.isError ? (mutation.error as any)?.response?.data?.detail || 'Failed to register as donor' : null
          }
          title="Become a Donor"
          onClose={dismissStatus}
        />
      </div>
    </div>
  )
}
