import { useEffect } from "react";
import DecorationBlood from "../components/decorationBlood.tsx";
import NavBar from "../components/NavBar.tsx"
import HowItWorks from "../components/HowItWorks.tsx"
import BloodTypes from "../components/BloodTypes.tsx"
import Features from "../components/Features.tsx"
import CTABanner from "../components/CTABanner.tsx"
import './App.css'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedLayout from './components/ProtectedLayout'
import Dashboard from './pages/Dashboard'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import DonorRequests from './pages/DonorRequests'
import { getCurrentUser } from './api/user'
import { useAuthStore } from './stores/auth'

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";

function useGoogleFonts(href: string): void {
  useEffect(() => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, [href]);
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 82% 20%, rgba(200,30,58,0.16) 0%, rgba(15,10,12,0) 60%)",
        }}
      />
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--rc-plasma)]">
            Blood donation network · Dhaka &amp; beyond
          </p>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-[color:var(--rc-bone)] sm:text-5xl lg:text-6xl">
            Every drop finds
            <br />
            someone waiting.
          </h1>
          <p className="mt-6 max-w-xl font-body text-base leading-relaxed text-[color:var(--rc-bone)]/70 sm:text-lg">
            RoktoConnect matches verified blood donors with patients in real time.
            Post a request, get matched by blood type and distance, and message
            your donor directly — no waiting rooms, no cold calls.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => { window.location.href = '/register' }}
              className="rounded-full bg-[color:var(--rc-blood)] px-6 py-3 font-body text-sm font-semibold text-[color:var(--rc-bone)] shadow-[0_8px_24px_-8px_rgba(200,30,58,0.6)] transition hover:bg-[color:var(--rc-blood-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--rc-plasma)]"
            >
              Become a donor
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = '/login' }}
              className="rounded-full border border-[color:var(--rc-line)] px-6 py-3 font-body text-sm font-semibold text-[color:var(--rc-bone)] transition hover:border-[color:var(--rc-bone)]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--rc-plasma)]"
            >
              Request blood
            </button>
          </div>
        </div>

        <div className="relative h-64 w-full md:h-80" aria-hidden="false">
          <DecorationBlood/>
        </div>
      </div>
    </section>
  );
}
function Footer() {
  return (
    <footer className="border-t border-[color:var(--rc-line)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-display text-base font-semibold text-[color:var(--rc-bone)]">
            Rokto<span className="text-[color:var(--rc-blood)]">Connect</span>
          </span>
          <p className="mt-1 font-body text-xs text-[color:var(--rc-bone)]/40">রক্তই জীবন — blood is life.</p>
        </div>
        <nav className="flex flex-wrap gap-6 font-body text-xs text-[color:var(--rc-bone)]/50">
          <a href="#how" className="transition hover:text-[color:var(--rc-bone)]/80">
            How it works
          </a>
          <a href="#features" className="transition hover:text-[color:var(--rc-bone)]/80">
            Platform
          </a>
          <a href="#hospitals" className="transition hover:text-[color:var(--rc-bone)]/80">
            For hospitals
          </a>
        </nav>
        <p className="font-mono text-[11px] text-[color:var(--rc-bone)]/30">© {new Date().getFullYear()} RoktoConnect</p>
      </div>
    </footer>
  );
}
export default function App() {
  useGoogleFonts(FONT_HREF);
  // hydrate auth on app start
  useEffect(() => {
    ;(async () => {
      try {
        const user = await getCurrentUser()
        useAuthStore.getState().setUser(user)
      } catch (e) {
        // not logged in
      }
    })()
  }, [])

  return (
    <div className="min-h-screen bg-[color:var(--rc-ink)] antialiased">
      <Routes>
          <Route path="/" element={
            <>
              <NavBar />
              <Hero />
              <HowItWorks />
              <BloodTypes />
              <Features />
              <CTABanner />
              <Footer/>
            </>
          } 
          />
          <Route path="/register" element={<><NavBar/><Register/></>} />
          <Route path="/login" element={<><NavBar/><Login/></>} />
          <Route element={<ProtectedLayout/>}>
            <Route path="/dashboard" element={<Dashboard/>} />
            <Route path="/leaderboard" element={<Leaderboard/>} />
            <Route path="/profile" element={<Profile/>} />
            <Route path="/donor/requests" element={<DonorRequests/>} />
          </Route>
      </Routes>
    </div>
  );
}
