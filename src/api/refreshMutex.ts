import { tokenStorage, type TokenPair } from '@/auth/tokenStorage'
import { readResponseBodyUnknown } from '@/api/body'
import { ApiError, normalizeErrorMessages } from '@/api/errors'
import { getApiBaseUrl } from '@/api/env'

let refreshInFlight: Promise<TokenPair> | null = null

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v !== null && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
  return null
}

function parseTokens(body: unknown): TokenPair {
  const o = asRecord(body)
  const access = o && typeof o.access_token === 'string' ? o.access_token : null
  const refresh = o && typeof o.refresh_token === 'string' ? o.refresh_token : null
  if (!access || !refresh) {
    throw new ApiError('Invalid token response', 200, ['Refresh response missing tokens'], body)
  }
  return { access_token: access, refresh_token: refresh }
}

/**
 * Single-flight refresh — MUST be used by both fetch and axios layers to avoid
 * invalidating a just-rotated refresh token.
 */
export async function refreshTokenPair(signal?: AbortSignal): Promise<TokenPair> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const rt = tokenStorage.getRefreshToken()
      if (!rt) {
        throw new ApiError('Missing refresh token', 401, ['Session expired'])
      }

      const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${rt}` },
        credentials: 'include',
        signal: signal ?? AbortSignal.timeout(45_000),
      })

      if (res.status === 204) {
        throw new ApiError('Unexpected empty refresh response', res.status, ['Session expired'])
      }

      const body = await readResponseBodyUnknown(res)
      if (!res.ok) {
        throw new ApiError(
          normalizeErrorMessages(body)[0] ?? 'Refresh failed',
          res.status,
          normalizeErrorMessages(body),
          body,
        )
      }

      const pair = parseTokens(body)
      tokenStorage.setTokens(pair)
      return pair
    })().finally(() => {
      refreshInFlight = null
    })
  }

  return refreshInFlight
}
