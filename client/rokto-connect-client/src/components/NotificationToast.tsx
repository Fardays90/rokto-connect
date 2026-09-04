import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export interface ToastNotification {
  notification_id: number
  request_id: number | null
  blood_type?: string | null
  message: string
}
export default function NotificationToast({ notification, onClose }: { notification: ToastNotification; onClose: () => void }) {
  const [remaining, setRemaining] = useState(100)
  const DURATION_MS = 5500

  useEffect(() => {
    const start = performance.now()
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - start
      const pct = Math.max(0, 100 - (elapsed / DURATION_MS) * 100)
      setRemaining(pct)
      if (pct <= 0) onClose()
    }, 50)
    const timeout = window.setTimeout(onClose, DURATION_MS)

    return () => {
      window.clearInterval(timer)
      window.clearTimeout(timeout)
    }
  }, [onClose])

  // new-request alerts go to donors who are not chat participants yet,
  // so send them to the donor feed instead of a chat they cannot open
  const viewTarget = notification.blood_type
    ? '/donor/requests'
    : notification.request_id
      ? `/chat/${notification.request_id}`
      : '/notifications'

  return (
    <div className="pointer-events-auto fixed right-4 top-20 z-50 w-80 overflow-hidden rounded-xl border border-[color:var(--rc-line)] bg-[color:var(--rc-ink)]/95 shadow-2xl backdrop-blur-md rc-toast-in">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--rc-blood)]/15 text-[color:var(--rc-blood)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[color:var(--rc-bone)]">New notification</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[color:var(--rc-bone)]/60">{notification.message}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-[color:var(--rc-bone)]/40 transition hover:text-[color:var(--rc-bone)]"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex items-center justify-between px-4 pb-3">
        <Link
          to={viewTarget}
          onClick={onClose}
          className="text-xs font-semibold text-[color:var(--rc-blood)] transition hover:text-[color:var(--rc-plasma)]"
        >
          View
        </Link>
        <span className="font-mono text-[10px] text-[color:var(--rc-bone)]/30">auto-dismiss</span>
      </div>
      <div className="h-0.5 w-full bg-white/[0.06]">
        <div className="h-full bg-[color:var(--rc-blood)] transition-[width] duration-100 ease-linear" style={{ width: `${remaining}%` }} />
      </div>
    </div>
  )
}
