import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { User } from '@/api/types'

interface AuthState {
  token: string | null
  user: User | null
  rememberMe: boolean
  setSession: (token: string, user: User, rememberMe?: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      rememberMe: false,
      setSession: (token, user, rememberMe = true) => set({ token, user, rememberMe }),
      logout: () => {
        localStorage.removeItem('erp-bridge-auth')
        sessionStorage.removeItem('erp-bridge-auth')
        set({ token: null, user: null })
      },
    }),
    {
      name: 'erp-bridge-auth',
      storage: createJSONStorage((): StateStorage => ({
        getItem: (name) => localStorage.getItem(name) || sessionStorage.getItem(name),
        setItem: (name, value) => {
          const parsed = JSON.parse(value) as { state?: { rememberMe?: boolean } }
          const storage = parsed.state?.rememberMe === false ? sessionStorage : localStorage
          const otherStorage = storage === localStorage ? sessionStorage : localStorage
          otherStorage.removeItem(name)
          storage.setItem(name, value)
        },
        removeItem: (name) => { localStorage.removeItem(name); sessionStorage.removeItem(name) },
      })),
    }
  )
)
