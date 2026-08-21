import { Link } from 'react-router-dom'

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--rc-line)] bg-[color:var(--rc-ink)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full bg-[color:var(--rc-blood)] shadow-[0_0_0_4px_rgba(200,30,58,0.18)]"
          />
          <span className="font-display text-lg font-semibold tracking-tight text-[color:var(--rc-bone)]">
            Rokto<span className="text-[color:var(--rc-blood)]">Connect</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="/#how" className="font-body text-sm text-[color:var(--rc-bone)]/70 transition hover:text-[color:var(--rc-bone)]">
            How it works
          </a>
          <a href="/#features" className="font-body text-sm text-[color:var(--rc-bone)]/70 transition hover:text-[color:var(--rc-bone)]">
            Platform
          </a>
          <a href="/#hospitals" className="font-body text-sm text-[color:var(--rc-bone)]/70 transition hover:text-[color:var(--rc-bone)]">
            For hospitals
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="font-body text-sm font-medium text-[color:var(--rc-bone)]/80 transition hover:text-[color:var(--rc-bone)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--rc-plasma)]">Log in</Link>
          <Link to="/register" className="rounded-full bg-[color:var(--rc-blood)] px-4 py-2 font-body text-sm font-semibold text-[color:var(--rc-bone)] transition hover:bg-[color:var(--rc-blood-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--rc-plasma)]">Register</Link>
        </div>
      </div>
    </header>
  );
}
