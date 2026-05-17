import { create } from 'zustand'
import { setSessionExpiredHandler } from '@/auth/sessionEvents'
import { decodeJwtPayload } from '@/auth/jwt'
import { tokenStorage } from '@/auth/tokenStorage'
import { authApi, narrowSignInResult } from '@/api/resources/authApi'
import { toUserFacingMessage } from '@/api/errors'
import { setStoredVerificationUserId } from '@/app/auth/VerifyEmail'
import type { SignInDto } from '@/types/dto'

type AuthRole = 'ADMIN' | 'SUPER_ADMIN' | null

export type AuthClaims = {
  userId: string | null
  email: string | null
  role: AuthRole
}

type AuthState = AuthClaims & {
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: SignInDto) => Promise<void>
  /** Sets session from OTP verification tokens. */
  setSessionFromTokens: (access: string, refresh: string) => void
  logout: () => Promise<void>
  initializeAuth: () => void
  clearSession: () => void
}

function applyClaimsFromAccessToken(accessToken: string | null): Pick<AuthState, 'userId' | 'email' | 'role'> {
  if (!accessToken) {
    return { userId: null, email: null, role: null }
  }
  const claims = decodeJwtPayload(accessToken)
  const roleRaw = claims?.role
  const role: AuthRole = roleRaw === 'SUPER_ADMIN' || roleRaw === 'ADMIN' ? roleRaw : null
  return {
    userId: typeof claims?.sub === 'string' ? claims.sub : null,
    email: typeof claims?.email === 'string' ? claims.email : null,
    role,
  }
}

let sessionHandlerRegistered = false

export const useAuthStore = create<AuthState>((set, get) => {
  if (!sessionHandlerRegistered) {
    sessionHandlerRegistered = true
    setSessionExpiredHandler(() => {
      get().clearSession()
    })
  }

  return {
    accessToken: null,
    refreshToken: null,
    userId: null,
    email: null,
    role: null,
    isAuthenticated: false,
    isLoading: true,

    clearSession: () => {
      tokenStorage.clearTokens()
      set({
        accessToken: null,
        refreshToken: null,
        userId: null,
        email: null,
        role: null,
        isAuthenticated: false,
      })
    },

    initializeAuth: () => {
      const accessToken = tokenStorage.getAccessToken()
      const refreshToken = tokenStorage.getRefreshToken()
      if (accessToken && refreshToken) {
        const claims = applyClaimsFromAccessToken(accessToken)
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          ...claims,
        })
      } else {
        set({ isLoading: false })
      }
    },

    setSessionFromTokens: (access, refresh) => {
      tokenStorage.setTokens({ access_token: access, refresh_token: refresh })
      const claims = applyClaimsFromAccessToken(access)
      set({
        accessToken: access,
        refreshToken: refresh,
        isAuthenticated: true,
        ...claims,
      })
    },

    login: async (payload) => {
      try {
        const raw = await authApi.signIn(payload)
        const result = narrowSignInResult(raw)
        if ('verificationId' in result) {
          setStoredVerificationUserId(result.verificationId)
          window.location.href = '/verify'
          return
        }
        get().setSessionFromTokens(result.access_token, result.refresh_token)
      } catch (error) {
        throw new Error(toUserFacingMessage(error, 'Login failed. Please check your credentials.'))
      }
    },

    logout: async () => {
      try {
        const access = get().accessToken ?? tokenStorage.getAccessToken()
        if (access) {
          await authApi.logout()
        }
      } catch {
        // Ignore network failures — still clear locally.
      } finally {
        get().clearSession()
      }
    },
  }
})

export const useAuth = () => useAuthStore()
