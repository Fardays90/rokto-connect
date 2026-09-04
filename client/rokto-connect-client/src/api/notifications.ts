import { api } from './axios'

export interface Notification {
  notification_id: number
  request_id: number | null
  read_status: string
  created_at: string
  blood_type?: string | null
  division?: string | null
  district?: string | null
}

export interface NotificationsResponse {
  notifications: Notification[]
  unread_count: number
}

export const fetchNotifications = async (): Promise<NotificationsResponse> => {
  const res = await api.get('/notifications')
  return res.data
}

export const markNotificationRead = async (notificationId: number) => {
  const res = await api.patch(`/notifications/${notificationId}/read`)
  return res.data
}

export const markAllNotificationsRead = async () => {
  const res = await api.post('/notifications/read-all')
  return res.data
}

export const deleteAllNotifications = async () => {
  const res = await api.delete('/notifications')
  return res.data
}
