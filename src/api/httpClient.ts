import { emitSessionExpired } from '@/auth/sessionEvents'
import { tokenStorage } from '@/auth/tokenStorage'
import { readResponseBodyUnknown } from '@/api/body'
import { ApiError, normalizeErrorMessages } from '@/api/errors'
import { getApiBaseUrl } from '@/api/env'
import { refreshTokenPair } from '@/api/refreshMutex'

export type HttpRequestInit = Omit<RequestInit, 'body'> & {
  /** Skip access-token injection (public routes). */
  skipAuth?: boolean
  /** Skip automatic refresh + retry on 401 (e.g. login/refresh calls). */
  skipRefresh?: boolean
  /** How to interpret a successful response body. */
  parse?: 'json' | 'void' | 'text'
  body?: BodyInit | Record<string, unknown> | null
}

function isBodyInit(value: unknown): value is BodyInit {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return true
  if (value instanceof Blob) return true
  if (value instanceof FormData) return true
  if (value instanceof URLSearchParams) return true
  if (value instanceof ReadableStream) return true
  if (value instanceof ArrayBuffer) return true
  return false
}

function buildUrl(path: string): string {
  const base = getApiBaseUrl()
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

export const httpClient = {
  async request<T>(path: string, init: HttpRequestInit = {}): Promise<T> {
    const {
      skipAuth = false,
      skipRefresh = false,
      parse: parseMode,
      headers: initHeaders,
      body,
      ...rest
    } = init

    const headers = new Headers(initHeaders)
    const url = buildUrl(path)

    if (!skipAuth) {
      const access = tokenStorage.getAccessToken()
      if (access) headers.set('Authorization', `Bearer ${access}`)
    }

    let serializedBody: BodyInit | undefined
    if (body === null || body === undefined) {
      serializedBody = undefined
    } else if (isBodyInit(body)) {
      serializedBody = body
    } else {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
      serializedBody = JSON.stringify(body)
    }

    const doFetch = () =>
      fetch(url, {
        ...rest,
        headers,
        credentials: rest.credentials ?? 'include',
        body: serializedBody,
      })

    let res = await doFetch()

    const shouldTryRefresh =
      res.status === 401 &&
      !skipAuth &&
      !skipRefresh &&
      !url.includes('/auth/refresh') &&
      !url.includes('/auth/local/signin') &&
      !url.includes('/auth/verify')

    if (shouldTryRefresh) {
      try {
        const pair = await refreshTokenPair()
        headers.set('Authorization', `Bearer ${pair.access_token}`)
        res = await doFetch()
      } catch {
        emitSessionExpired()
        throw new ApiError('Session expired', 401, ['Please sign in again'])
      }
    }

    const mode = parseMode ?? (res.status === 204 ? 'void' : 'json')

    if (mode === 'void' || res.status === 204) {
      if (!res.ok) {
        const errBody = await readResponseBodyUnknown(res)
        const msgs = normalizeErrorMessages(errBody)
        throw new ApiError(msgs[0] ?? `HTTP ${res.status}`, res.status, msgs, errBody)
      }
      return undefined as T
    }

    if (mode === 'text') {
      const text = await res.text()
      if (!res.ok) {
        throw new ApiError(
          normalizeErrorMessages(text)[0] ?? `HTTP ${res.status}`,
          res.status,
          [text],
        )
      }
      return text as T
    }

    const json = await readResponseBodyUnknown(res)
    if (!res.ok) {
      const msgs = normalizeErrorMessages(json)
      throw new ApiError(msgs[0] ?? `HTTP ${res.status}`, res.status, msgs, json)
    }
    return json as T
  },
}
