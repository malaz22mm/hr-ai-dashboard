/**
 * Prefer VITE_API_URL (integration spec); fall back to legacy VITE_API_BASE_URL then production default.
 */
export function getApiBaseUrl(): string {
  const raw =
    import.meta.env.VITE_API_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    'https://hr-back-iza2.vercel.app'
  return raw.replace(/\/$/, '')
}

export const API_BASE = getApiBaseUrl()
