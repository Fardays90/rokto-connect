import { create } from 'zustand'
import { getCurrentUser } from '../api/user'

interface AuthState {
  user: any | null
  isAuthenticated: boolean
  setUser: (u: any) => void
  clearUser: () => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set: any) => ({
  user: null,
  isAuthenticated: false,
  setUser: (u: any) => set({ user: u, isAuthenticated: !!u }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
  fetchUser: async () => {
    try {
      const data = await getCurrentUser()
      set({ user: data, isAuthenticated: true })
    } catch (e) {
      set({ user: null, isAuthenticated: false })
    }
  },
}))
