import { create } from 'zustand'
import { apiFetch, getAdminToken, setAdminToken } from '../lib/api'

export type AdminUser = {
  displayName: string
  email: string
  id: string
  role: 'admin' | 'editor'
}

type LoginResponse = {
  accessToken: string
  expiresAt: number
  refreshToken: string
  user: AdminUser
}

type AdminAuthState = {
  checkSession: () => Promise<boolean>
  error: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  user: AdminUser | null
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  checkSession: async () => {
    if (!getAdminToken()) {
      set({ isAuthenticated: false, user: null })
      return false
    }

    try {
      const user = await apiFetch<AdminUser>('/auth/me', {}, true)
      set({ isAuthenticated: true, user })
      return true
    } catch {
      setAdminToken(null)
      set({ isAuthenticated: false, user: null })
      return false
    }
  },
  error: null,
  isAuthenticated: Boolean(
    typeof window !== 'undefined' && getAdminToken(),
  ),
  isLoading: false,
  login: async (email, password) => {
    set({ error: null, isLoading: true })

    try {
      const session = await apiFetch<LoginResponse>('/auth/login', {
        body: JSON.stringify({ email, password }),
        method: 'POST',
      })
      setAdminToken(session.accessToken)
      set({
        isAuthenticated: true,
        isLoading: false,
        user: session.user,
      })
      return true
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo ingresar.',
        isAuthenticated: false,
        isLoading: false,
        user: null,
      })
      return false
    }
  },
  logout: () => {
    setAdminToken(null)
    set({ error: null, isAuthenticated: false, user: null })
  },
  user: null,
}))
