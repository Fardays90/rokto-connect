import { api } from './axios'

export const fetchLeaderboard = async (sort: 'rating' | 'donation_count' = 'donation_count') => {
  const res = await api.get('/donors/leaderboard', { params: { sort } })
  return res.data
}
