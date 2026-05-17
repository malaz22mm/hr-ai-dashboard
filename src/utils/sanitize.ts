import type { UserResponseDto, UserRole } from '@/types/dto'

/** User row safe for UI — strips known sensitive keys and coerces weakly typed fields. */
export type SafeUser = {
  id: string
  name: string
  role: UserRole
  approvalState: 'VERIFIED' | 'NOT_VERIFIED'
  email: string
  phone: string | null
  createdAt: string
  updatedAt: string
}

const SENSITIVE_KEYS = new Set([
  'hashedPassword',
  'password',
  'hashedRefreshToken',
])

export function sanitizeUserResponse(raw: UserResponseDto | Record<string, unknown>): SafeUser {
  const row: Record<string, unknown> = { ...(raw as Record<string, unknown>) }
  for (const key of SENSITIVE_KEYS) {
    if (key in row) delete row[key]
  }

  const role = (typeof row.role === 'string' ? row.role : 'ADMIN') as UserRole
  const approvalState = (typeof row.approvalState === 'string' ? row.approvalState : 'NOT_VERIFIED') as
    | 'VERIFIED'
    | 'NOT_VERIFIED'

  const phoneRaw = row.phone
  const phone =
    typeof phoneRaw === 'string'
      ? phoneRaw
      : phoneRaw === null || phoneRaw === undefined
        ? null
        : String(phoneRaw)

  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    role,
    approvalState,
    email: String(row.email ?? ''),
    phone,
    createdAt: String(row.createdAt ?? ''),
    updatedAt: String(row.updatedAt ?? ''),
  }
}

export function sanitizeUsersResponse(rows: unknown): SafeUser[] {
  if (!Array.isArray(rows)) return []
  return rows
    .map((r) => sanitizeUserResponse((r ?? {}) as UserResponseDto))
    .filter((u) => u.id.length > 0)
}
