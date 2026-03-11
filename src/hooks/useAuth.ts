import { create } from 'zustand'
import { signIn, logout as logoutApi, tokenStorage } from '@/lib/api'
import type { SignInDto } from '@/lib/types'

type User = {
  name?: string;
  email?: string;
  role?: string;
}

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: SignInDto) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  initializeAuth: () => {
    const accessToken = tokenStorage.getAccessToken()
    const refreshToken = tokenStorage.getRefreshToken()

    if (accessToken && refreshToken) {
      set({
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      })
    } else {
      set({ isLoading: false })
    }
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    tokenStorage.setAccessToken(accessToken)
    tokenStorage.setRefreshToken(refreshToken)
    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
    })
  },

  login: async (payload: SignInDto) => {
    try {
      const response = await signIn(payload)

      if ('access_token' in response) {
        const { access_token, refresh_token } = response
        tokenStorage.setAccessToken(access_token)
        tokenStorage.setRefreshToken(refresh_token)

        set({
          accessToken: access_token,
          refreshToken: refresh_token,
          isAuthenticated: true,
          user: { email: payload.email, name: payload.email },
        })

        return
      }

      // If verification required
      if ('verificationId' in response) {
        throw new Error(response.message || 'Email verification required')
      }

      throw new Error('Unexpected response from server')
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Login failed. Please check your credentials.')
    }
  },

  logout: async () => {
    try {
      const refreshToken = get().refreshToken || tokenStorage.getRefreshToken()
      if (refreshToken) {
        await logoutApi(refreshToken)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      tokenStorage.clearTokens()
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      })
    }
  },
}))

// Export hook alias for backward compatibility
export const useAuth = () => useAuthStore()
