export type JwtClaims = {
  sub?: string
  email?: string
  role?: string
  exp?: number
  iat?: number
}

/** Decode JWT payload without verifying signature (client-side UX only). */
export function decodeJwtPayload(token: string): JwtClaims | null {
  try {
    const parts = token.split('.')
    const payload = parts[1]
    if (!payload) return null
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(b64)
    return JSON.parse(json) as JwtClaims
  } catch {
    return null
  }
}

export function isJwtLikelyExpired(token: string, skewSeconds = 30): boolean {
  const claims = decodeJwtPayload(token)
  if (!claims?.exp) return false
  const now = Math.floor(Date.now() / 1000)
  return claims.exp <= now + skewSeconds
}
