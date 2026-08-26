import { api } from './axios'

export type RequestStatus = 'PENDING' | 'DONOR_FOUND' | 'COMPLETED'

export interface CreateRequestPayload {
  blood_type: string
  urgency: string
  message?: string
  zip_code?: string
  division?: string
  district?: string
}

// a request row as returned by GET /requests/mine (donor fields are null
// unless the request is in the DONOR_FOUND state)
export interface BloodRequest {
  request_id: number
  blood_type: string
  urgency: string
  status: RequestStatus
  created_at: string
  message?: string | null
  zip_code?: string | null
  district?: string | null
  division?: string | null
  chat_id?: number | null
  requester_id?: number | null
  requester_first_name?: string | null
  requester_last_name?: string | null
  donor_id?: number | null
  donor_first_name?: string | null
  donor_last_name?: string | null
  donor_phone_number?: string | null
  donor_district?: string | null
  donor_division?: string | null
  donor_verified?: boolean | null
  donor_blood_type?: string | null
  donor_donation_count?: number | null
  donor_rating?: number | null
  donor_review_count?: number | null
  donor_reviews?: Array<{ rating: string; comment?: string | null }>
  other_party_donation_count?: number | null
  other_party_rating?: number | null
  other_party_review_count?: number | null
  other_party_reviews?: Array<{ rating: string; comment?: string | null }>
}

// location is intentionally missing: requests can't be moved after creation
export interface UpdateRequestPayload {
  blood_type?: string
  urgency?: string
  message?: string
}

export interface CompleteRequestPayload {
  rating: number
  comment?: string
}

export const MY_REQUESTS_KEY = ['requests', 'mine'] as const

export const createRequest = async (payload: CreateRequestPayload) => {
  const res = await api.post('/requests', payload)
  return res.data
}

export const fetchRequests = async (params?: Record<string, any>) => {
  const res = await api.get('/requests', { params })
  return res.data
}

export const fetchMyRequests = async (): Promise<BloodRequest[]> => {
  const res = await api.get('/requests/mine')
  return res.data
}

export const fetchRequestChat = async (requestId: number): Promise<BloodRequest> => {
  const res = await api.get(`/requests/${requestId}/chat`)
  return res.data
}

// the server echoes back the full updated row so the client can refresh
// its caches immediately without waiting for a refetch
export interface UpdateRequestResponse {
  message: string
  request: BloodRequest
}

export const updateRequest = async (
  requestId: number,
  payload: UpdateRequestPayload
): Promise<UpdateRequestResponse> => {
  const res = await api.patch(`/requests/${requestId}`, payload)
  return res.data
}

export const deleteRequest = async (requestId: number) => {
  const res = await api.delete(`/requests/${requestId}`)
  return res.data
}

export const acceptRequest = async (requestId: number) => {
  const res = await api.post(`/requests/${requestId}/accept`)
  return res.data
}

// requester removes the donor, or the donor lets go — either way the
// server reopens the request as PENDING
export const releaseDonor = async (requestId: number) => {
  const res = await api.delete(`/requests/${requestId}/donor`)
  return res.data
}

export const completeRequest = async (requestId: number, payload: CompleteRequestPayload) => {
  const res = await api.post(`/requests/${requestId}/complete`, payload)
  return res.data
}
