import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCurrentUser } from '../api/user'

export const USER_KEY = ['users', 'me'] as const

const STALE_TIME_MS = 5 * 60 * 1000

export function useCurrentUser() {
  return useQuery({
    queryKey: USER_KEY,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: STALE_TIME_MS,
  })
}

export function useSetCurrentUser() {
  const queryClient = useQueryClient()
  return (user: any) => queryClient.setQueryData(USER_KEY, user)
}

export function useClearCurrentUser() {
  const queryClient = useQueryClient()
  return () => queryClient.removeQueries({ queryKey: USER_KEY })
}
