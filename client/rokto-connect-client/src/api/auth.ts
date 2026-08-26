import { api } from './axios'
import { clearSessionToken, setSessionToken } from './session'

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
  // the server returns the JWT alongside setting its session cookie;
  // storing it lets cross-site deployments keep the session via header
  if (response.data?.access_token) setSessionToken(response.data.access_token)
  return response.data
}

export interface LoginRequest {
  phone_number: string
  password: string
}

export const loginUser = async (payload: LoginRequest) => {
  const response = await api.post('/login', payload, { withCredentials: true })
  if (response.data?.access_token) setSessionToken(response.data.access_token)
  return response.data
}

export const logoutUser = async () => {
  const res = await api.post('/logout')
  clearSessionToken()
  return res.data
}
