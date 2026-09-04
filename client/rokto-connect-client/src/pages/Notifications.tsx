import { useState } from 'react'
import { Link } from 'react-router-dom'
import { notificationTarget, notificationText, useNotifications, useNotificationsActions } from '../components/NotificationBell'

type Filter = 'all' | 'unread'

export default function Notifications() {
  const [filter, setFilter] = useState<Filter>('all')
  const { data, isLoading } = useNotifications()
  const { refresh, markRead, markAllRead, clearAll } = useNotificationsActions()

  const list = (data?.notifications ?? []).filter((n) => filter === 'all' || n.read_status !== 'READ')
  const unread = data?.unread_count ?? 0

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <svg className="rc-spinner h-8 w-8" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="rgba(243,237,231,0.15)" strokeWidth="3" />
          <circle cx="12" cy="12" r="9" stroke="var(--rc-blood)" strokeWidth="3" strokeLinecap="round" strokeDasharray="16 40.5" />
        </svg>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'var(--rc-display)' }}>
            Notifications
          </h1>
          <p className="mt-1 text-sm text-[color:var(--rc-bone)]/50">
            {unread > 0 ? `${unread} unread` : 'You are all caught up'}
          </p>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button
              onClick={() => markAllRead()}
              className="rounded-lg border border-[color:var(--rc-line)] px-3.5 py-1.5 text-sm text-[color:var(--rc-bone)]/70 transition hover:border-[color:var(--rc-blood)]/50 hover:text-[color:var(--rc-bone)]"
            >
              Mark all read
            </button>
          )}
          {list.length > 0 && (
            <button
              onClick={() => clearAll()}
              className="rounded-lg border border-[color:var(--rc-line)] px-3.5 py-1.5 text-sm text-[color:var(--rc-bone)]/70 transition hover:border-[color:var(--rc-blood)]/50 hover:text-[color:var(--rc-bone)]"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-1 border-b border-[color:var(--rc-line)]">
        {(['all', 'unread'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm transition ${
              filter === f
                ? 'border-b-2 border-[color:var(--rc-blood)] font-medium text-[color:var(--rc-bone)]'
                : 'text-[color:var(--rc-bone)]/50 hover:text-[color:var(--rc-bone)]'
            }`}
          >
            {f === 'all' ? 'All' : 'Unread'}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="py-16 text-center text-sm text-[color:var(--rc-bone)]/40">No notifications here.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((n) => (
            <li
              key={n.notification_id}
              className={`rounded-xl border border-[color:var(--rc-line)] bg-white/[0.02] p-4 transition hover:bg-white/[0.035] ${
                n.read_status === 'READ' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_status === 'READ' ? 'bg-[color:var(--rc-line)]' : 'bg-[color:var(--rc-blood)]'}`} />
                  <div>
                    <p className="text-sm leading-6 text-[color:var(--rc-bone)]/85">{notificationText(n)}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[color:var(--rc-bone)]/35">
                      {new Date(n.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {n.request_id && (
                    <Link
                      to={notificationTarget(n)}
                      onClick={() => n.read_status !== 'READ' && markRead(n.notification_id)}
                      className="text-xs font-semibold text-[color:var(--rc-blood)] transition hover:text-[color:var(--rc-plasma)]"
                    >
                      {n.blood_type ? 'View requests' : 'View request'}
                    </Link>
                  )}
                  {n.read_status !== 'READ' && (
                    <button
                      onClick={() => markRead(n.notification_id)}
                      className="text-xs text-[color:var(--rc-bone)]/40 transition hover:text-[color:var(--rc-bone)]"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 text-center">
        <button onClick={() => refresh()} className="text-xs text-[color:var(--rc-bone)]/40 transition hover:text-[color:var(--rc-bone)]">
          Refresh
        </button>
      </div>
    </div>
  )
}
