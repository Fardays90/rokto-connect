import { api } from './axios'

export interface CreateRequestPayload {
  blood_type: string
  urgency: string
  message?: string
  zip_code?: string
  division?: string
  district?: string
}

export const createRequest = async (payload: CreateRequestPayload) => {
  const res = await api.post('/requests', payload)
  return res.data
}

export const fetchRequests = async (params?: Record<string, any>) => {
  const res = await api.get('/requests', { params })
  return res.data
}
