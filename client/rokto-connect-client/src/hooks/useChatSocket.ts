import { useEffect, useRef, useState } from 'react'
import { API_ORIGIN } from '../api/axios'
import { getAccessToken } from '../stores/auth'

export interface ChatMessage {
  text: string
  sender: 'self' | 'other'
}

export type ChatStatus = 'connecting' | 'connected' | 'waiting' | 'error'

export function useChatSocket(requestId: number | null, enabled: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connected, setConnected] = useState(false)
  const [status, setStatus] = useState<ChatStatus>('connecting')
  const [onlineCount, setOnlineCount] = useState(0)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!enabled || !requestId) {
      return
    }

    const socketUrl = API_ORIGIN.replace(/^http/, 'ws')
    const token = getAccessToken()
    const authQuery = token ? `?token=${encodeURIComponent(token)}` : ''
    const socket = new WebSocket(`${socketUrl}/api/v1/ws/requests/${requestId}/chat${authQuery}`)
    socketRef.current = socket

    socket.onopen = () => {
      setConnected(true)
      setStatus('connected')
    }
    socket.onclose = () => {
      setConnected(false)
      setStatus('error')
    }
    socket.onerror = () => setStatus('error')
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'message') {
        setMessages((current) => [...current, { text: data.message, sender: data.sender }])
      }
      if (data.type === 'presence') {
        setOnlineCount(data.online_count)
        setStatus('connected')
      }
    }

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [requestId, enabled])

  const sendMessage = (text: string) => {
    const value = text.trim()
    if (value && connected) {
      socketRef.current?.send(value)
    }
  }

  return { messages, connected, status, onlineCount, sendMessage }
}
