import React, { useState } from 'react'

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function Register() {
  const [isDonor, setIsDonor] = useState(false)

  return (
    <main
      className="min-h-screen bg-[color:var(--rc-ink)] px-6 py-16 text-[color:var(--rc-bone)]"
      style={{
        fontFamily: 'var(--rc-body)',
      }}
    >
      <div className="mx-auto w-full max-w-lg">
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
            Create your account.
          </h1>

          <p className="mt-3 max-w-md text-sm leading-6 text-[color:var(--rc-bone)]/55">
            Join RoktoConnect and help connect people with the blood they need.
          </p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-[color:var(--rc-line)] bg-white/[0.025] p-7 shadow-2xl">
          <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[color:var(--rc-blood)]/10 blur-3xl" />

          <form className="relative space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60">
                  First name
                </label>
                <input
                  type="text"
                  name="first_name"
                  placeholder="Fardin"
                  className="w-full rounded-lg border border-[color:var(--rc-line)] bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-[color:var(--rc-bone)]/20 focus:border-[color:var(--rc-blood)] focus:ring-2 focus:ring-[color:var(--rc-blood)]/10"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60">
                  Last name
                </label>
                <input
                  type="text"
                  name="last_name"
                  placeholder="Dhrubo"
                  className="w-full rounded-lg border border-[color:var(--rc-line)] bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-[color:var(--rc-bone)]/20 focus:border-[color:var(--rc-blood)] focus:ring-2 focus:ring-[color:var(--rc-blood)]/10"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60">
                Phone number
              </label>
              <input
                type="tel"
                name="phone_number"
                placeholder="+880 1XXX XXXXXX"
                className="w-full rounded-lg border border-[color:var(--rc-line)] bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-[color:var(--rc-bone)]/20 focus:border-[color:var(--rc-blood)] focus:ring-2 focus:ring-[color:var(--rc-blood)]/10"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Create a secure password"
                className="w-full rounded-lg border border-[color:var(--rc-line)] bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-[color:var(--rc-bone)]/20 focus:border-[color:var(--rc-blood)] focus:ring-2 focus:ring-[color:var(--rc-blood)]/10"
              />
            </div>
            <div className="rounded-xl border border-[color:var(--rc-line)] bg-white/[0.025] p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={isDonor}
                  onChange={(e) => setIsDonor(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[color:var(--rc-blood)]"
                />

                <div>
                  <div className="text-sm font-medium">
                    I want to become a donor
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--rc-bone)]/45">
                    Make yourself available to people who need your blood type.
                  </p>
                </div>
              </label>
              {isDonor && (
                <div className="mt-5 border-t border-[color:var(--rc-line)] pt-5">
                  <label
                    className="mb-2 block text-xs uppercase tracking-wider text-[color:var(--rc-bone)]/50"
                    style={{ fontFamily: 'var(--rc-mono)' }}
                  >
                    Blood type
                  </label>

                  <select
                    name="blood_type"
                    required
                    className="w-full appearance-none rounded-lg border border-[color:var(--rc-line)] bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--rc-blood)] focus:ring-2 focus:ring-[color:var(--rc-blood)]/10"
                  >
                    <option value="" className="bg-[color:var(--rc-ink)]">
                      Select your blood type
                    </option>

                    {bloodTypes.map((type) => (
                      <option
                        key={type}
                        value={type}
                        className="bg-[color:var(--rc-ink)]"
                      >
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--rc-blood)] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[color:var(--rc-blood-deep)] hover:shadow-lg hover:shadow-[color:var(--rc-blood)]/20 active:scale-[0.99]"
            >
              Create account
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-[color:var(--rc-bone)]/40">
          Already have an account?{' '}
          <a
            href="/login"
            className="font-medium text-[color:var(--rc-bone)] transition hover:text-[color:var(--rc-blood)]"
          >
            Log in
          </a>
        </p>
      </div>
    </main>
  )
}