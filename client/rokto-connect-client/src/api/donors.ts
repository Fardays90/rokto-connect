import { api } from './axios'

export const fetchLeaderboard = async (sort: 'rating' | 'donation_count' = 'donation_count') => {
  const res = await api.get('/donors/leaderboard', { params: { sort } })
  return res.data
}

export interface BecomeDonorPayload {
  blood_type: string
}

// registers the logged-in user as a donor; a blood type is required
export const becomeDonor = async (payload: BecomeDonorPayload) => {
  const res = await api.post('/donors/become', payload)
  return res.data
}
