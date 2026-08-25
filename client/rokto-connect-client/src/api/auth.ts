import { api } from './axios'

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
  return response.data
}

export interface LoginRequest {
  phone_number: string
  password: string
}

export const loginUser = async (payload: LoginRequest) => {
  // server should set HttpOnly cookie on successful login
  const response = await api.post('/login', payload, { withCredentials: true })
  return response.data
}

export const logoutUser = async () => {
  const res = await api.post('/logout')
  return res.data
}
