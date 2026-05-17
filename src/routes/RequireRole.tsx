import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/auth/authStore'

type RequireRoleProps = {
  allow: readonly ('ADMIN' | 'SUPER_ADMIN')[]
  fallbackPath?: string
  children: ReactNode
}

export function RequireRole({ allow, fallbackPath = '/', children }: RequireRoleProps) {
  const role = useAuthStore((s) => s.role)
  if (!role || !allow.includes(role)) {
    return <Navigate to={fallbackPath} replace />
  }
  return <>{children}</>
}
