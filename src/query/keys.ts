export const queryKeys = {
  auth: {
    root: ['auth'] as const,
  },
  employees: {
    root: ['employees'] as const,
    list: (query: Record<string, unknown>) => ['employees', 'list', query] as const,
    stats: (groupBy: string) => ['employees', 'stats', groupBy] as const,
  },
  users: {
    root: ['users'] as const,
    list: (search?: string) => ['users', 'list', search ?? ''] as const,
  },
  lookups: {
    root: ['lookups'] as const,
    bundle: ['lookups', 'bundle'] as const,
  },
} as const
