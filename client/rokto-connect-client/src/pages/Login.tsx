import { useState } from "react"
import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { loginUser } from '../api/auth'
import ApiModal from '../components/ApiModal'
import React from 'react'
import { useAuthStore } from '../stores/auth'
import { getCurrentUser } from '../api/user'
import { useNavigate } from 'react-router-dom'
export default function Login() {
  const [phone, setPhone] = useState<string>("")
  const [password, setPassword] = useState<string>("")

  const { mutate, isLoading, isError, isSuccess, error } = useMutation({
    mutationFn: (payload: { phone_number: string; password: string }) =>
      loginUser(payload),
    onSuccess: (data: any) => {
      console.log('Login successful', data)
      // TODO: redirect or set auth state
    },
    onError: (err: AxiosError) => {
      console.error('Login error', err.response?.data || err.message)
    },
  }) as any

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    mutate({ phone_number: phone, password })
  }

  const [modalOpen, setModalOpen] = useState(false)

  // open modal whenever mutation state changes
  React.useEffect(() => {
    if (isLoading || isError || isSuccess) setModalOpen(true)
  }, [isLoading, isError, isSuccess])

  const setAuth = useAuthStore.getState().setUser

  const navigate = useNavigate()

  // when login succeeds, fetch current user which should be authenticated via cookie and then redirect
  React.useEffect(() => {
    if (isSuccess) {
      ;(async () => {
        try {
          const user = await getCurrentUser()
          setAuth(user)
          navigate('/dashboard')
        } catch (e) {
          // ignore
        }
      })()
    }
  }, [isSuccess, setAuth, navigate])

  return (
    <main
      className="min-h-screen bg-[color:var(--rc-ink)] px-6 py-16 text-[color:var(--rc-bone)]"
      style={{
        fontFamily: 'var(--rc-body)',
      }}
    >
      <div className="mx-auto w-full max-w-lg">
        {/* Header */}
        <div className="mb-10">
          <div
            className="mb-5 text-xs uppercase tracking-[0.25em] text-[color:var(--rc-blood)]"
            style={{ fontFamily: 'var(--rc-mono)' }}
          >
            RoktoConnect
          </div>

          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--rc-display)' }}
          >
            Welcome back.
          </h1>

          <p className="mt-3 text-sm leading-6 text-[color:var(--rc-bone)]/55">
            Log in to manage requests, donations, and connections.
          </p>
        </div>

        {/* Form card */}
        <div className="relative overflow-hidden rounded-2xl border border-[color:var(--rc-line)] bg-white/[0.025] p-7 shadow-2xl">
          <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[color:var(--rc-blood)]/10 blur-3xl" />

          <form className="relative space-y-5" onSubmit={handleSubmit}>
            {/* Phone */}
            <div>
              <label className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60">
                Phone number
              </label>

              <input
                type="tel"
                name="phone_number"
                value={phone}
                placeholder="+880 1XXX XXXXXX"
                autoComplete="tel"
                className="w-full rounded-lg border border-[color:var(--rc-line)] bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-[color:var(--rc-bone)]/20 focus:border-[color:var(--rc-blood)] focus:ring-2 focus:ring-[color:var(--rc-blood)]/10"
                onChange={(e) => setPhone(e.currentTarget.value)}
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-[color:var(--rc-bone)]/60">
                  Password
                </label>

                <a
                  href="/forgot-password"
                  className="text-xs text-[color:var(--rc-bone)]/35 transition hover:text-[color:var(--rc-blood)]"
                >
                  Forgot password?
                </a>
              </div>

              <input
                type="password"
                name="password"
                value={password}
                placeholder="Enter your password"
                autoComplete="current-password"
                onChange={e => setPassword(e.currentTarget.value)}
                className="w-full rounded-lg border border-[color:var(--rc-line)] bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-[color:var(--rc-bone)]/20 focus:border-[color:var(--rc-blood)] focus:ring-2 focus:ring-[color:var(--rc-blood)]/10"
              />
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--rc-blood)] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[color:var(--rc-blood-deep)] hover:shadow-lg hover:shadow-[color:var(--rc-blood)]/20 active:scale-[0.99] disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.2" strokeWidth="4" />
                      <path d="M22 12a10 10 0 00-10-10" stroke="white" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    Log in
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </>
                )}
              </button>

              {isError && (
                <div className="mt-3 text-sm text-red-400">
                  {(error as AxiosError<any>)?.response?.data?.message || 'Login failed. Please check your credentials.'}
                </div>
              )}

              {isSuccess && (
                <div className="mt-3 text-sm text-[color:var(--rc-plasma)]">Logged in successfully.</div>
              )}
            </div>
            <ApiModal
              open={modalOpen}
              loading={isLoading}
              success={isSuccess}
              error={isError ? ((error as AxiosError<any>)?.response?.data?.message || 'Login failed') : null}
              title="Login"
              onClose={() => setModalOpen(false)}
            />
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-[color:var(--rc-bone)]/40">
          Don't have an account?{' '}
          <a
            href="/register"
            className="font-medium text-[color:var(--rc-bone)] transition hover:text-[color:var(--rc-blood)]"
          >
            Create one
          </a>
        </p>
      </div>
    </main>
  )
}
