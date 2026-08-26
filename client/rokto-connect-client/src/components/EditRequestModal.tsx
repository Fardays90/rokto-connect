import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { BloodRequest, UpdateRequestPayload, UpdateRequestResponse } from '../api/requests'
import { updateRequest } from '../api/requests'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ApiModal from './ApiModal'
import { MY_REQUESTS_KEY } from '../api/requests'
import { BLOOD_TYPES, URGENCIES } from './CreateRequestModal'

const schema = z.object({
  blood_type: z.string().min(1, 'Select blood type'),
  urgency: z.string().min(1, 'Select urgency'),
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(500, 'Message must be under 500 characters'),
})

type FormValues = z.infer<typeof schema>

function getInputClasses(hasError: boolean) {
  return `w-full min-w-0 rounded-lg bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-[color:var(--rc-bone)]/20 focus:ring-2 ${
    hasError
      ? 'border border-red-500 focus:border-red-500 focus:ring-red-500/10'
      : 'border border-[color:var(--rc-line)] focus:border-[color:var(--rc-blood)] focus:ring-[color:var(--rc-blood)]/10'
  }`
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
}

function locationLine(request: BloodRequest) {
  const parts = [request.district, request.division, request.zip_code].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : 'Location unknown'
}

export default function EditRequestModal({
  request,
  onClose,
}: {
  request: BloodRequest
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      blood_type: request.blood_type,
      urgency: (request.urgency || '').toLowerCase(),
      message: request.message || '',
    },
  })

  // pre-fill from the latest request data every time the modal opens
  useEffect(() => {
    reset({
      blood_type: request.blood_type,
      urgency: (request.urgency || '').toLowerCase(),
      message: request.message || '',
    })
  }, [request, reset])

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
    mutationFn: (payload: UpdateRequestPayload) => updateRequest(request.request_id, payload),
    onSuccess: (data: UpdateRequestResponse) => {
      const updated = data.request

      // seed caches with the fresh row first — the UI shows the new values
      // instantly, and the invalidations below are just a safety net
      queryClient.setQueryData(MY_REQUESTS_KEY, (old: any) =>
        Array.isArray(old)
          ? old.map((r: BloodRequest) => (r.request_id === updated.request_id ? updated : r))
          : old
      )
      queryClient.invalidateQueries({ queryKey: MY_REQUESTS_KEY })
      queryClient.invalidateQueries({ queryKey: ['requests'] })

      // keep the form in sync with what was actually saved
      reset({
        blood_type: updated.blood_type,
        urgency: (updated.urgency || '').toLowerCase(),
        message: updated.message || '',
      })
      setTimeout(closeAll, 1200)
    },
  })

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeAll} />

      <div
        className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-2xl border border-[color:var(--rc-line)] bg-[color:var(--rc-ink-raised)] p-7 text-[color:var(--rc-bone)] shadow-2xl"
        style={{ fontFamily: 'var(--rc-body)' }}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[color:var(--rc-blood)]/10 blur-3xl" />

        <div className="relative flex items-start justify-between">
          <div>
            <div
              className="mb-2 text-xs uppercase tracking-[0.25em] text-[color:var(--rc-blood)]"
              style={{ fontFamily: 'var(--rc-mono)' }}
            >
              Edit request
            </div>
            <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--rc-display)' }}>
              Update blood request.
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-[color:var(--rc-bone)]/45">
              Request #{String(request.request_id).padStart(4, '0')}
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

        <form className="relative mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Blood type */}
          <Field label="Blood type" error={errors.blood_type?.message}>
            <div className="relative">
              <select
                {...register('blood_type')}
                aria-label="Blood type"
                className={`${getInputClasses(!!errors.blood_type)} appearance-none pr-10`}
              >
                {BLOOD_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--rc-bone)]/35"
              >
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Field>

          {/* Urgency */}
          <Field label="Urgency" error={errors.urgency?.message}>
            <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-[color:var(--rc-line)] bg-black/20 p-1.5">
              {URGENCIES.map(({ value, label, dot, active }) => (
                <label key={value} className="cursor-pointer">
                  <input type="radio" value={value} {...register('urgency')} className="peer sr-only" />
                  <span
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-[11px] font-medium uppercase tracking-wide text-[color:var(--rc-bone)]/45 transition peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--rc-plasma)] ${active}`}
                    style={{ fontFamily: 'var(--rc-mono)' }}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </Field>

          {/* Message */}
          <Field label="Message" error={errors.message?.message}>
            <textarea
              {...register('message')}
              rows={3}
              placeholder="Hospital, ward, or any detail donors should know…"
              className={`${getInputClasses(!!errors.message)} resize-none`}
            />
          </Field>

          {/* Location is locked — deleting and recreating is the only way to move a request */}
          <div className="rounded-lg border border-[color:var(--rc-line)] bg-black/20 px-4 py-3">
            <div
              className="text-[10px] uppercase tracking-wider text-[color:var(--rc-bone)]/40"
              style={{ fontFamily: 'var(--rc-mono)' }}
            >
              Location · locked
            </div>
            <p className="mt-1 truncate text-sm text-[color:var(--rc-bone)]/70">
              {locationLine(request)}
            </p>
            <p className="mt-1.5 text-xs leading-5 text-[color:var(--rc-bone)]/35">
              To change the location, delete this request and create a new one.
            </p>
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
                  Saving...
                </>
              ) : (
                <>
                  Save changes
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
            mutation.isError ? (mutation.error as any)?.response?.data?.detail || 'Failed to update request' : null
          }
          title="Edit Request"
          onClose={dismissStatus}
        />
      </div>
    </div>
  )
}
