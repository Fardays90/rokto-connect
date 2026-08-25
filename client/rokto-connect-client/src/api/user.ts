import { api } from './axios'

export const getCurrentUser = async () => {
  const res = await api.get('/me')
  return res.data
}
