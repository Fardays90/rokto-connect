import { api } from './axios'
import { clearAccessToken, setAccessToken } from '../stores/auth'

export interface RegisterRequest {
  first_name: string
  last_name: string
  phone_number: string
  zip_code: string
  division: string
  district: string
  password: string
  is_donor?: boolean
  blood_type?: string
}

export const registerUser = async (payload: RegisterRequest) => {
  const response = await api.post('/register', payload)
  if (response.data?.access_token) setAccessToken(response.data.access_token)
  return response.data
}

export interface LoginRequest {
  phone_number: string
  password: string
}

export const loginUser = async (payload: LoginRequest) => {
  const response = await api.post('/login', payload)
  if (response.data?.access_token) setAccessToken(response.data.access_token)
  return response.data
}

export const logoutUser = () => {
  clearAccessToken()
  return { message: 'Logged out' }
}
