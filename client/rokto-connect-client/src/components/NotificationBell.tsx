import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteAllNotifications,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from '../api/notifications'

export const NOTIFICATIONS_KEY = ['notifications'] as const

export function notificationText(n: Notification) {
  if (!n.request_id) return 'You have a new notification.'
  if (n.blood_type) return `New ${n.blood_type} blood request in ${n.district || n.division}.`
  return 'Your blood request has been accepted by a donor.'
}

// new-request alerts target donors who are not chat participants yet,
// so they go to the donor feed; accepted-request alerts go to the chat
export function notificationTarget(n: Notification) {
  if (n.blood_type) return '/donor/requests'
  if (n.request_id) return `/chat/${n.request_id}`
  return '/notifications'
}

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: fetchNotifications,
    refetchInterval: 30000,
  })
}

export function useNotificationsActions() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })

  const refresh = () => invalidate()

  const markRead = async (id: number) => {
    await markNotificationRead(id)
    queryClient.setQueryData(NOTIFICATIONS_KEY, (old: any) => {
      if (!old) return old
      return {
        ...old,
        unread_count: Math.max(0, old.unread_count - 1),
        notifications: old.notifications.map((n: Notification) =>
          n.notification_id === id ? { ...n, read_status: 'READ' } : n
        ),
      }
    })
  }

  const markAllRead = async () => {
    await markAllNotificationsRead()
    queryClient.setQueryData(NOTIFICATIONS_KEY, (old: any) => {
      if (!old) return old
      return {
        ...old,
        unread_count: 0,
        notifications: old.notifications.map((n: Notification) => ({ ...n, read_status: 'READ' })),
      }
    })
  }

  const clearAll = async () => {
    await deleteAllNotifications()
    queryClient.setQueryData(NOTIFICATIONS_KEY, {
      notifications: [],
      unread_count: 0,
    })
  }

  return { refresh, markRead, markAllRead, clearAll }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data } = useNotifications()
  const { refresh, markRead, markAllRead, clearAll } = useNotificationsActions()
  const unread = data?.unread_count ?? 0
  const recent = data?.notifications?.slice(0, 5) ?? []

  const handleClearAll = async () => {
    await clearAll()
    setOpen(false)
  }

  const toggle = () => {
    setOpen((o) => {
      const next = !o
      if (next) refresh()
      return next
    })
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--rc-line)] text-[color:var(--rc-bone)]/70 transition hover:border-[color:var(--rc-blood)]/50 hover:text-[color:var(--rc-bone)]"
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--rc-blood)] px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[color:var(--rc-line)] bg-[color:var(--rc-ink)]/95 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-[color:var(--rc-line)] px-4 py-3">
              <span className="text-sm font-semibold text-[color:var(--rc-bone)]">Notifications</span>
              {recent.length > 0 && (
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-[color:var(--rc-blood)] transition hover:text-[color:var(--rc-plasma)]">
                      Mark all read
                    </button>
                  )}
                  <button onClick={handleClearAll} className="text-xs text-[color:var(--rc-bone)]/50 transition hover:text-[color:var(--rc-blood)]">
                    Clear all
                  </button>
                </div>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {recent.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[color:var(--rc-bone)]/40">No notifications yet.</p>
              ) : (
                recent.map((n) => (
                  <Link
                    key={n.notification_id}
                    to={notificationTarget(n)}
                    onClick={() => {
                      if (n.read_status !== 'READ') markRead(n.notification_id)
                      setOpen(false)
                    }}
                    className={`flex items-start gap-3 border-b border-[color:var(--rc-line)] px-4 py-3 transition hover:bg-white/[0.03] ${
                      n.read_status === 'READ' ? 'opacity-60' : ''
                    }`}
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_status === 'READ' ? 'bg-[color:var(--rc-line)]' : 'bg-[color:var(--rc-blood)]'}`} />
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-sm text-[color:var(--rc-bone)]/80">
                        {notificationText(n)}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] text-[color:var(--rc-bone)]/35">
                        {new Date(n.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                  </Link>
                ))
              )}
            </div>

            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-[color:var(--rc-line)] px-4 py-3 text-center text-sm font-semibold text-[color:var(--rc-blood)] transition hover:bg-white/[0.03] hover:text-[color:var(--rc-plasma)]"
            >
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
