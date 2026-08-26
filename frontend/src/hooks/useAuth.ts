import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import type { LoginResponse, User } from '@/api/types'

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)
  return useMutation({
    mutationFn: async (payload: { identifier: string; password: string; rememberMe: boolean }) => {
      const { data } = await api.post<LoginResponse>('/auth/login', payload)
      return data
    },
    onSuccess: (data, variables) => setSession(data.token, data.user, variables.rememberMe),
  })
}

export function useMe() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get<User>('/auth/me')
      return data
    },
    enabled: !!token,
    retry: false,
  })
}
