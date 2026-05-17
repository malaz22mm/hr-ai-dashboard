import { isApiError, toUserFacingMessage } from '@/api/errors'
import type { AxiosError } from 'axios'

export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (isApiError(error)) {
    return toUserFacingMessage(error, fallback)
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  const axiosError = error as AxiosError<{ message?: string | string[] }>
  const data = axiosError.response?.data
  if (typeof data?.message === 'string') return data.message
  if (Array.isArray(data?.message)) return data.message.join(', ')
  if (axiosError.response?.status === 403) return 'Access denied. SUPER_ADMIN role may be required.'
  return fallback
}