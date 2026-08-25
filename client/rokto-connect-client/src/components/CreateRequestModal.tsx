import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { CreateRequestPayload } from '../api/requests'
import { createRequest } from '../api/requests'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ApiModal from './ApiModal'
import { useAuthStore } from '../stores/auth'

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const URGENCIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const schema = z.object({
  blood_type: z.string().min(1, 'Select blood type'),
  urgency: z.string().min(1, 'Select urgency'),
  message: z.string().optional(),
  zip_code: z.string().optional(),
  division: z.string().optional(),
  district: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const inputClasses =
  'w-full rounded-lg border border-[color:var(--rc-line)] bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-[color:var(--rc-bone)]/20 focus:border-[color:var(--rc-blood)] focus:ring-2 focus:ring-[color:var(--rc-blood)]/10'

export default function CreateRequestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useAuthStore((s: any) => s.user)
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      blood_type: '',
      urgency: 'medium',
      message: '',
      zip_code: user?.zip_code || '',
      division: user?.division || '',
      district: user?.district || '',
    },
  })

  const mutation: any = useMutation({
    mutationFn: (payload: CreateRequestPayload) => createRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      reset()
    },
  })

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[color:var(--rc-line)] bg-[color:var(--rc-ink-raised)] p-7 text-[color:var(--rc-bone)] shadow-2xl"
        style={{ fontFamily: 'var(--rc-body)' }}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[color:var(--rc-blood)]/10 blur-3xl" />

        <div className="relative flex items-start justify-between">
          <div>
            <div
              className="mb-2 text-xs uppercase tracking-[0.25em] text-[color:var(--rc-blood)]"
              style={{ fontFamily: 'var(--rc-mono)' }}
            >
              New request
            </div>
            <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--rc-display)' }}>
              Create blood request.
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-[color:var(--rc-bone)]/45">
              Nearby donors matching your criteria will be alerted.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[color:var(--rc-bone)]/40 transition hover:bg-white/5 hover:text-[color:var(--rc-bone)]"
          >
            ✕
          </button>
        </div>

        <form className="relative mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* Blood type */}
          <div>
            <label className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60">Blood type</label>
            <div className="relative">
              <select {...register('blood_type')} defaultValue="" className={`${inputClasses} appearance-none pr-10`}>
                <option value="" disabled>
                  Select blood type
                </option>
                {bloodTypes.map((bt) => (
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
          </div>

          {/* Urgency */}
          <div>
            <label className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60">Urgency</label>
            <div className="grid grid-cols-4 gap-2">
              {URGENCIES.map(({ value, label }) => (
                <label key={value} className="cursor-pointer">
                  <input type="radio" value={value} {...register('urgency')} className="peer sr-only" />
                  <span
                    className={`block rounded-lg border px-2 py-2.5 text-center text-xs font-medium uppercase tracking-wide transition peer-checked:border-transparent peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--rc-plasma)] ${
                      value === 'critical'
                        ? 'peer-checked:bg-[color:var(--rc-blood)]'
                        : 'peer-checked:bg-[color:var(--rc-blood-deep)]'
                    }`}
                    style={{ fontFamily: 'var(--rc-mono)' }}
                  >
                    {label}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[color:var(--rc-bone)]/30">
              Critical requests are pushed to donors first.
            </p>
          </div>

          {/* Message */}
          <div>
            <label className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60">
              Message <span className="font-normal text-[color:var(--rc-bone)]/30">(optional)</span>
            </label>
            <textarea
              {...register('message')}
              rows={3}
              placeholder="Hospital, ward, or any detail donors should know…"
              className={`${inputClasses} resize-none`}
            />
          </div>

          {/* Location */}
          <div>
            <div
              className="mb-2 text-xs uppercase tracking-wider text-[color:var(--rc-bone)]/40"
              style={{ fontFamily: 'var(--rc-mono)' }}
            >
              Location
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input placeholder="ZIP" {...register('zip_code')} className={inputClasses} />
              <input placeholder="Division" {...register('division')} className={inputClasses} />
              <input placeholder="District" {...register('district')} className={inputClasses} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
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
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.2" strokeWidth="4" />
                    <path d="M22 12a10 10 0 00-10-10" stroke="white" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  Create request
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
            mutation.isError ? (mutation.error as any)?.response?.data?.detail || 'Failed to create request' : null
          }
          title="Create Request"
          onClose={onClose}
        />
      </div>
    </div>
  )
}
