import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  accessToken: string | null
  setAccessToken: (accessToken: string) => void
  clearAccessToken: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      setAccessToken: (accessToken) => set({ accessToken }),
      clearAccessToken: () => set({ accessToken: null }),
    }),
    { name: 'rokto-auth' },
  ),
)

export const getAccessToken = () => useAuthStore.getState().accessToken
export const setAccessToken = (token: string) => useAuthStore.getState().setAccessToken(token)
export const clearAccessToken = () => useAuthStore.getState().clearAccessToken()
