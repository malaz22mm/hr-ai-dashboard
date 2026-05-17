export class ApiError extends Error {
  readonly status: number
  readonly messages: readonly string[]
  readonly body: unknown

  constructor(message: string, status: number, messages: readonly string[], body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.messages = messages
    this.body = body ?? null
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

/** Normalize NestJS ValidationPipe / HTTP exception bodies. */
export function normalizeErrorMessages(body: unknown): string[] {
  const o = asRecord(body)
  if (!o) return ['Request failed']
  const msg = o.message
  if (typeof msg === 'string') return [msg]
  if (Array.isArray(msg) && msg.every((m) => typeof m === 'string')) {
    return msg as string[]
  }
  const err = o.error
  if (typeof err === 'string') return [err]
  return ['Request failed']
}

export function toUserFacingMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (isApiError(error)) {
    return error.messages[0] ?? fallback
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}
