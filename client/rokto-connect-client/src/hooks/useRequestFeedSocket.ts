import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import endpoints from '../../endpoints.json'
import { useCurrentUser } from './useCurrentUser'

const MAX_BACKOFF_MS = 30000

// any of these means the feed data changed and queries should refetch
const FEED_EVENT_TYPES = new Set(['request_created', 'request_updated', 'request_deleted'])

interface FeedEvent {
  type?: string
  division?: string
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

      const base = endpoints.local.replace(/^http/, 'ws')
      socket = new WebSocket(`${base}/api/v1/ws/requests`)

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
