import React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Link } from 'react-router-dom'
import { api } from '../api/axios'
import ApiModal from '../components/ApiModal'
import MyRequestsSection from '../components/MyRequestsSection'
import BecomeDonorModal from '../components/BecomeDonorModal'
import { USER_KEY, useCurrentUser } from '../hooks/useCurrentUser'

const schema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  phone_number: z.string(),
  zip_code: z.string().optional(),
  division: z.string().optional(),
  district: z.string().optional(),
})

const inputClasses =
  'w-full rounded-lg border border-[color:var(--rc-line)] bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-[color:var(--rc-bone)]/20 focus:border-[color:var(--rc-blood)] focus:ring-2 focus:ring-[color:var(--rc-blood)]/10'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60">{label}</label>
      {children}
    </div>
  )
}

export default function Profile() {
  const { data: user } = useCurrentUser()
  const queryClient = useQueryClient()
  const [editing, setEditing] = React.useState(false)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [donorModalOpen, setDonorModalOpen] = React.useState(false)

  const { register, handleSubmit, reset } = useForm({ resolver: zodResolver(schema) })

  React.useEffect(() => {
    if (user) reset(user)
  }, [user, reset])

  const [apiState, setApiState] = React.useState<{ loading?: boolean; success?: boolean; error?: string }>({})

  const onSubmit = async (data: any) => {
    setApiState({ loading: true })
    try {
      await api.patch('/users/me', data)
      setApiState({ success: true })
      await queryClient.invalidateQueries({ queryKey: USER_KEY })
      setEditing(false)
    } catch (e: any) {
      setApiState({ error: e?.response?.data?.detail || 'Update failed' })
    }
  }

  if (!user) return null

  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()

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
        <div className="relative">
          <div
            className="mb-3 text-xs uppercase tracking-[0.25em] text-[color:var(--rc-blood)]"
            style={{ fontFamily: 'var(--rc-mono)' }}
          >
            Account
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ fontFamily: 'var(--rc-display)' }}>
            Manage profile.
          </h1>
          <p className="mt-2 text-sm leading-6 text-[color:var(--rc-bone)]/55">
            Keep your details current so donors and requests can find you.
          </p>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2">
          <section className="relative overflow-hidden rounded-2xl border border-[color:var(--rc-line)] bg-white/[0.02] p-6 shadow-xl shadow-black/20 sm:p-7">
            <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[color:var(--rc-blood)]/10 blur-3xl" />

            {/* Identity */}
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--rc-blood)] to-[color:var(--rc-blood-deep)] text-lg font-bold text-white shadow-lg shadow-[color:var(--rc-blood)]/25"
                  style={{ fontFamily: 'var(--rc-display)' }}
                >
                  {initials || '?'}
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'var(--rc-display)' }}>
                    {user.first_name} {user.last_name}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider ${
                        user.verified
                          ? 'border-[color:var(--rc-plasma)]/40 bg-[color:var(--rc-plasma)]/10 text-[color:var(--rc-plasma)]'
                          : 'border-[color:var(--rc-line)] bg-white/[0.04] text-[color:var(--rc-bone)]/45'
                      }`}
                      style={{ fontFamily: 'var(--rc-mono)' }}
                    >
                      {user.verified ? '✓ Verified' : 'Unverified'}
                    </span>
                    <span
                      className="inline-flex items-center rounded-full border border-[color:var(--rc-line)] px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-[color:var(--rc-bone)]/45"
                      style={{ fontFamily: 'var(--rc-mono)' }}
                    >
                      Member
                    </span>
                  </div>
                </div>
              </div>

              {!editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-[color:var(--rc-blood)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--rc-blood-deep)] hover:shadow-lg hover:shadow-[color:var(--rc-blood)]/20 active:scale-[0.99]"
                >
                  Edit profile
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </button>
              )}
            </div>

            {/* Details / Edit form */}
            {!editing ? (
              <dl className="relative mt-7 space-y-4 border-t border-[color:var(--rc-line)] pt-6">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-xs text-[color:var(--rc-bone)]/40">Phone</dt>
                  <dd className="truncate text-sm text-[color:var(--rc-bone)]/85" style={{ fontFamily: 'var(--rc-mono)' }}>
                    {user.phone_number}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="shrink-0 text-xs text-[color:var(--rc-bone)]/40">District</dt>
                  <dd className="truncate text-sm text-[color:var(--rc-bone)]/85">
                    {user.district || 'Not provided'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="shrink-0 text-xs text-[color:var(--rc-bone)]/40">Division</dt>
                  <dd className="truncate text-sm text-[color:var(--rc-bone)]/85">
                    {user.division || 'Not provided'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="shrink-0 text-xs text-[color:var(--rc-bone)]/40">ZIP code</dt>
                  <dd className="truncate text-sm text-[color:var(--rc-bone)]/85" style={{ fontFamily: 'var(--rc-mono)' }}>
                    {user.zip_code || '—'}
                  </dd>
                </div>
              </dl>
            ) : (
              <form className="relative mt-7 space-y-5 border-t border-[color:var(--rc-line)] pt-6" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="First name">
                    <input {...register('first_name')} placeholder="Fardin" autoComplete="given-name" className={inputClasses} />
                  </Field>
                  <Field label="Last name">
                    <input {...register('last_name')} placeholder="Dhrubo" autoComplete="family-name" className={inputClasses} />
                  </Field>
                </div>

                <Field label="Phone number">
                  <input
                    {...register('phone_number')}
                    type="tel"
                    placeholder="+8801712345678"
                    autoComplete="tel"
                    className={inputClasses}
                  />
                </Field>

                <div>
                  <div
                    className="mb-3 text-xs uppercase tracking-wider text-[color:var(--rc-bone)]/40"
                    style={{ fontFamily: 'var(--rc-mono)' }}
                  >
                    Location
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="ZIP code">
                      <input {...register('zip_code')} placeholder="1212" inputMode="numeric" maxLength={4} autoComplete="postal-code" className={inputClasses} />
                    </Field>
                    <Field label="Division">
                      <input {...register('division')} placeholder="Dhaka" autoComplete="address-level1" className={inputClasses} />
                    </Field>
                    <Field label="District">
                      <input {...register('district')} placeholder="Dhaka" autoComplete="address-level2" className={inputClasses} />
                    </Field>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      reset(user)
                      setEditing(false)
                    }}
                    className="rounded-lg border border-[color:var(--rc-line)] px-4 py-2.5 text-sm font-medium text-[color:var(--rc-bone)]/70 transition hover:border-[color:var(--rc-bone)]/30 hover:text-[color:var(--rc-bone)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!!apiState.loading}
                    className="group flex items-center gap-2 rounded-lg bg-[color:var(--rc-blood)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--rc-blood-deep)] hover:shadow-lg hover:shadow-[color:var(--rc-blood)]/20 active:scale-[0.99] disabled:opacity-60"
                  >
                    {apiState.loading ? (
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
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-[color:var(--rc-line)] bg-white/[0.02] p-6">
            <div
              className="mb-4 text-[10px] uppercase tracking-[0.2em] text-[color:var(--rc-bone)]/35"
              style={{ fontFamily: 'var(--rc-mono)' }}
            >
              Account status
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[color:var(--rc-bone)]/60">Verification</span>
                <span
                  className={`text-xs ${user.verified ? 'text-[color:var(--rc-plasma)]' : 'text-[color:var(--rc-bone)]/40'}`}
                  style={{ fontFamily: 'var(--rc-mono)' }}
                >
                  {user.verified ? 'VERIFIED' : 'PENDING'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[color:var(--rc-bone)]/60">Role</span>
                <span className="text-xs text-[color:var(--rc-bone)]/80" style={{ fontFamily: 'var(--rc-mono)' }}>
                  {user.is_donor ? 'DONOR' : 'MEMBER'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[color:var(--rc-bone)]/60">Profile ID</span>
                <span className="truncate text-xs text-[color:var(--rc-bone)]/50" style={{ fontFamily: 'var(--rc-mono)' }}>
                  #{String(user.user_id ?? '').padStart(4, '0')}
                </span>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[color:var(--rc-line)] bg-white/[0.02] p-6">
            {user.is_donor ? (
              <>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color:var(--rc-plasma)]/30 bg-[color:var(--rc-plasma)]/10 text-[color:var(--rc-plasma)]">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
                      <path d="M12 2.7s6.5 7.2 6.5 11.8a6.5 6.5 0 1 1-13 0C5.5 9.9 12 2.7 12 2.7z" opacity="0.9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--rc-display)' }}>
                      Donor
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-[color:var(--rc-bone)]/50">
                      Registered with blood type{' '}
                      <span className="font-semibold text-[color:var(--rc-bone)]/80">
                        {user.donor_blood_type || '—'}
                      </span>
                      {' · '}
                      <span style={{ fontFamily: 'var(--rc-mono)' }}>{user.donation_count ?? 0}</span>{' '}
                      donation{(user.donation_count ?? 0) === 1 ? '' : 's'}.
                      {user.accepted_request_id ? ' You are currently engaged with a request.' : ''}
                    </p>
                    <Link
                      to="/donor/requests"
                      className="group mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--rc-plasma)]/50 px-4 py-2 text-xs font-semibold text-[color:var(--rc-plasma)] transition hover:bg-[color:var(--rc-plasma)]/10 active:scale-[0.99]"
                    >
                      Nearby requests
                      <span className="transition-transform group-hover:translate-x-0.5">→</span>
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="pointer-events-none absolute -right-20 -top-20 h-36 w-36 rounded-full bg-[color:var(--rc-blood)]/10 blur-3xl" />
                <div className="relative flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color:var(--rc-line)] bg-black/20 text-[color:var(--rc-blood)]">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
                      <path d="M12 2.7s6.5 7.2 6.5 11.8a6.5 6.5 0 1 1-13 0C5.5 9.9 12 2.7 12 2.7z" opacity="0.9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--rc-display)' }}>
                      Become a donor
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-[color:var(--rc-bone)]/50">
                      Pick your blood type and start accepting nearby requests.
                    </p>
                    <button
                      type="button"
                      onClick={() => setDonorModalOpen(true)}
                      className="group mt-4 flex items-center gap-1.5 rounded-lg bg-[color:var(--rc-blood)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[color:var(--rc-blood-deep)] hover:shadow-lg hover:shadow-[color:var(--rc-blood)]/20 active:scale-[0.99]"
                    >
                      Become a donor
                      <span className="transition-transform group-hover:translate-x-0.5">→</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[color:var(--rc-line)] bg-white/[0.02] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color:var(--rc-line)] bg-black/20 text-[color:var(--rc-blood)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                  <rect x="4" y="10.5" width="16" height="9.5" rx="2" />
                  <path d="M8 10.5V7a4 4 0 1 1 8 0v3.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--rc-display)' }}>
                  Security
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[color:var(--rc-bone)]/50">
                  Use a strong password you don't reuse anywhere else.
                </p>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="group mt-4 flex items-center gap-1.5 rounded-lg border border-[color:var(--rc-blood)]/50 px-4 py-2 text-xs font-semibold text-[color:var(--rc-blood)] transition hover:bg-[color:var(--rc-blood)]/10 active:scale-[0.99]"
                >
                  Change password
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Requests created by this user */}
      <div className="mt-6">
        <MyRequestsSection />
      </div>

      <ApiModal
        open={!!apiState.loading || !!apiState.success || !!apiState.error}
        loading={!!apiState.loading}
        success={!!apiState.success}
        error={apiState.error || null}
        title="Update Profile"
        onClose={() => setApiState({})}
      />

      {donorModalOpen && <BecomeDonorModal onClose={() => setDonorModalOpen(false)} />}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

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
                  Security
                </div>
                <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--rc-display)' }}>
                  Change password.
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-[color:var(--rc-bone)]/40 transition hover:bg-white/5 hover:text-[color:var(--rc-bone)]"
              >
                ✕
              </button>
            </div>

            <div className="relative mt-6">
              <PasswordForm onClose={() => setModalOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PasswordForm({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit } = useForm({ defaultValues: { current_password: '', new_password: '', confirm: '' }})
  const [state, setState] = React.useState<any>({})

  const onSubmit = async (data: any) => {
    if (data.new_password !== data.confirm) { setState({ error: 'Passwords do not match' }); return }
    setState({ loading: true })
    try {
      await api.post('/users/me/password', { current_password: data.current_password, new_password: data.new_password })
      setState({ success: true })
      setTimeout(() => { onClose(); setState({}) }, 900)
    } catch (e: any) {
      setState({ error: e?.response?.data?.detail || 'Failed to change password' })
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <Field label="Current password">
        <input {...register('current_password')} type="password" placeholder="Enter your current password" autoComplete="current-password" className={inputClasses} />
      </Field>

      <Field label="New password">
        <input {...register('new_password')} type="password" placeholder="Create a secure password" autoComplete="new-password" className={inputClasses} />
        <p className="mt-2 text-xs text-[color:var(--rc-bone)]/30">Must be at least 8 characters.</p>
      </Field>

      <Field label="Confirm new password">
        <input {...register('confirm')} type="password" placeholder="Repeat your new password" autoComplete="new-password" className={inputClasses} />
      </Field>

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
          disabled={!!state.loading}
          className="group flex items-center gap-2 rounded-lg bg-[color:var(--rc-blood)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--rc-blood-deep)] hover:shadow-lg hover:shadow-[color:var(--rc-blood)]/20 active:scale-[0.99] disabled:opacity-60"
        >
          {state.loading ? (
            <>
              <svg className="rc-spinner h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeDasharray="20 36.5" />
              </svg>
              Updating...
            </>
          ) : (
            <>
              Update password
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </>
          )}
        </button>
      </div>

      <ApiModal
        open={!!state.loading || !!state.success || !!state.error}
        loading={!!state.loading}
        success={!!state.success}
        error={state.error || null}
        title="Change Password"
        onClose={() => setState({})}
      />
    </form>
  )
}
