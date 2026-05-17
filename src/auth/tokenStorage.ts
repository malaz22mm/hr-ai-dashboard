export type TokenPair = {
  access_token: string
  refresh_token: string
}

const ACCESS_KEY = 'hr_access_token'
const REFRESH_KEY = 'hr_refresh_token'

function getStorage(): Storage {
  return import.meta.env.VITE_AUTH_STORAGE === 'session' ? sessionStorage : localStorage
}

/** Unified token persistence (defaults to localStorage for backward compatibility with existing installs). */
export const tokenStorage = {
  getAccessToken(): string | null {
    return getStorage().getItem(ACCESS_KEY)
  },

  getRefreshToken(): string | null {
    return getStorage().getItem(REFRESH_KEY)
  },

  setAccessToken(token: string): void {
    getStorage().setItem(ACCESS_KEY, token)
  },

  setRefreshToken(token: string): void {
    getStorage().setItem(REFRESH_KEY, token)
  },

  setTokens(pair: TokenPair): void {
    getStorage().setItem(ACCESS_KEY, pair.access_token)
    getStorage().setItem(REFRESH_KEY, pair.refresh_token)
  },

  clearTokens(): void {
    getStorage().removeItem(ACCESS_KEY)
    getStorage().removeItem(REFRESH_KEY)
  },
}
