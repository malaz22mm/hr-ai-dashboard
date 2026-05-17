import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/api/errors'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        if (isApiError(error)) {
          if (error.status >= 400 && error.status < 500) return false
          if (error.status >= 500 && error.status < 600 && failureCount < 2) return true
        }
        return failureCount < 1
      },
    },
    mutations: { retry: false },
  },
})
