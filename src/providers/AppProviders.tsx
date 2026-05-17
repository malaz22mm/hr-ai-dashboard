import type { PropsWithChildren } from 'react'
import { QueryProvider } from '@/providers/QueryProvider'

export function AppProviders({ children }: PropsWithChildren) {
  return <QueryProvider>{children}</QueryProvider>
}
