// React import not required with the new JSX transform
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { logoutUser } from '../api/auth'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm transition ${
    isActive
      ? 'bg-white/[0.06] font-medium text-[color:var(--rc-bone)]'
      : 'text-[color:var(--rc-bone)]/55 hover:bg-white/[0.03] hover:text-[color:var(--rc-bone)]'
  }`

export default function ProtectedLayout() {
  const user = useAuthStore((s: any) => s.user)
  const clearUser = useAuthStore((s: any) => s.clearUser)
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (e) {
      // ignore
    }
    clearUser()
    navigate('/login')
  }

  if (!user) {
    // simple guard: render a fallback until router redirects
    return (
      <div className="min-h-screen flex items-center justify-center">Not authenticated</div>
    )
  }

  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()

  const links = (
    <>
      <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
      <NavLink to="/leaderboard" className={navLinkClass}>Leaderboard</NavLink>
      <NavLink to="/profile" className={navLinkClass}>Profile</NavLink>
      {user?.is_donor && <NavLink to="/donor/requests" className={navLinkClass}>Nearby Requests</NavLink>}
    </>
  )

  return (
    <div className="min-h-screen bg-[color:var(--rc-ink)] text-[color:var(--rc-bone)]" style={{ fontFamily: 'var(--rc-body)' }}>
      <header className="sticky top-0 z-40 border-b border-[color:var(--rc-line)] bg-[color:var(--rc-ink)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--rc-display)' }}>
              Rokto<span className="text-[color:var(--rc-blood)]">Connect</span>
            </Link>
            <nav className="hidden items-center gap-1 text-sm md:flex">{links}</nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--rc-blood)] to-[color:var(--rc-blood-deep)] text-[11px] font-bold text-white"
                style={{ fontFamily: 'var(--rc-display)' }}
              >
                {initials || '?'}
              </div>
              <span className="max-w-[10rem] truncate text-sm text-[color:var(--rc-bone)]/80">
                {user.first_name} {user.last_name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-[color:var(--rc-line)] px-3.5 py-1.5 text-sm text-[color:var(--rc-bone)]/70 transition hover:border-[color:var(--rc-blood)]/50 hover:text-[color:var(--rc-bone)]"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-3 text-sm md:hidden">{links}</nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-[color:var(--rc-line)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[color:var(--rc-bone)]/40">রক্তই জীবন — blood is life.</p>
          <p className="font-mono text-[11px] tracking-wide text-[color:var(--rc-bone)]/25" style={{ fontFamily: 'var(--rc-mono)' }}>
            © {new Date().getFullYear()} RoktoConnect
          </p>
        </div>
      </footer>
    </div>
  )
}
