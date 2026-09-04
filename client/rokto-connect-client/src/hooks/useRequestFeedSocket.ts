import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { API_ORIGIN } from '../api/axios'
import { getAccessToken } from '../stores/auth'
import { useCurrentUser } from './useCurrentUser'
import type { ToastNotification } from '../components/NotificationToast'
import { NOTIFICATIONS_KEY } from '../components/NotificationBell'

const MAX_BACKOFF_MS = 30000

// any of these means the feed data changed and queries should refetch
const FEED_EVENT_TYPES = new Set(['request_created', 'request_updated', 'request_deleted'])

interface FeedEvent {
  type?: string
  division?: string
}

interface NotificationEvent {
  type?: string
  notification_id?: number
  request_id?: number | null
  blood_type?: string | null
  message?: string
}

/**
 * Keeps a websocket open to /ws/requests; when the server broadcasts a
 * request event (created / updated / deleted) in the user's division, the
 * feed query is invalidated and TanStack Query refetches. Reconnects with
 * exponential backoff.
 */
export function useRequestFeedSocket() {
  const queryClient = useQueryClient()
  const { data: user } = useCurrentUser()
  const divisionRef = useRef<string | null>(null)

  useEffect(() => {
    divisionRef.current = (user?.division as string | undefined)?.toLowerCase() ?? null
  }, [user?.division])

  useEffect(() => {
    let socket: WebSocket | null = null
    let closedByCleanup = false
    let attempts = 0
    let reconnectTimer: number | undefined

    const connect = () => {
      if (closedByCleanup) return

      // Browsers cannot send Authorization headers during a WS handshake.
      const token = getAccessToken()
      const wsBase = API_ORIGIN.replace(/^http/, 'ws')
      const authQuery = token ? `?token=${encodeURIComponent(token)}` : ''
      socket = new WebSocket(`${wsBase}/api/v1/ws/requests${authQuery}`)

      socket.onopen = () => {
        attempts = 0
      }

      socket.onmessage = (event) => {
        try {
          const data: FeedEvent = JSON.parse(event.data)
          if (!data.type || !FEED_EVENT_TYPES.has(data.type)) return // ignore pings / unknown frames
          const incoming = (data.division || '').toLowerCase()
          if (!divisionRef.current || !incoming || incoming !== divisionRef.current) return
          queryClient.invalidateQueries({ queryKey: ['requests'] })
        } catch {
          // malformed frame — ignore
        }
      }

      socket.onclose = () => {
        if (closedByCleanup) return
        const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempts)
        attempts += 1
        reconnectTimer = window.setTimeout(connect, delay)
      }

      socket.onerror = () => {
        socket?.close()
      }
    }

    connect()

    return () => {
      closedByCleanup = true
      if (reconnectTimer) window.clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [queryClient])
}

/**
 * Keeps a websocket open to /ws/requests and listens for the live
 * `new_notification` frames dispatched to this user, showing a pop-up toast
 * and refreshing the notification badge in real time. Returns the active
 * toast (or null) so the caller can render it.
 */
export function useNotificationSocket(): { toast: ToastNotification | null; clearToast: () => void } {
  const queryClient = useQueryClient()
  const [toast, setToast] = useState<ToastNotification | null>(null)

  useEffect(() => {
    let socket: WebSocket | null = null
    let attempts = 0
    let reconnectTimer: number | undefined
    let closed = false

    const connect = () => {
      if (closed) return
      const token = getAccessToken()
      const wsBase = API_ORIGIN.replace(/^http/, 'ws')
      const authQuery = token ? `?token=${encodeURIComponent(token)}` : ''
      socket = new WebSocket(`${wsBase}/api/v1/ws/requests${authQuery}`)

      socket.onopen = () => {
        attempts = 0
      }

      socket.onmessage = (event) => {
        try {
          const data: NotificationEvent = JSON.parse(event.data)
          if (data.type !== 'new_notification') return
          queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
          setToast({
            notification_id: data.notification_id ?? 0,
            request_id: data.request_id ?? null,
            blood_type: data.blood_type ?? null,
            message: data.message || 'You have a new notification.',
          })
        } catch {
          // malformed frame — ignore
        }
      }

      socket.onclose = () => {
        if (closed) return
        const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempts)
        attempts += 1
        reconnectTimer = window.setTimeout(connect, delay)
      }

      socket.onerror = () => {
        socket?.close()
      }
    }

    connect()

    return () => {
      closed = true
      if (reconnectTimer) window.clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [queryClient])

  return { toast, clearToast: () => setToast(null) }
}
