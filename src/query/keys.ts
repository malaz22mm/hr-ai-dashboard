export const queryKeys = {
  auth: {
    root: ['auth'] as const,
  },
  employees: {
    root: ['employees'] as const,
    list: (query: Record<string, unknown>) => ['employees', 'list', query] as const,
    stats: (groupBy: string) => ['employees', 'stats', groupBy] as const,
    attritionPrediction: (employeeId: number) =>
      ['employees', 'attrition-prediction', employeeId] as const,
  },
  users: {
    root: ['users'] as const,
    list: (search?: string) => ['users', 'list', search ?? ''] as const,
  },
  lookups: {
    root: ['lookups'] as const,
    bundle: ['lookups', 'bundle'] as const,
  },
  attendance: {
    root: ['attendance'] as const,
    presence: ['attendance', 'presence'] as const,
    history: (employeeId: number, query: Record<string, unknown>) =>
      ['attendance', 'history', employeeId, query] as const,
  },
  vacations: {
    root: ['vacations'] as const,
    list: (status?: number) => ['vacations', 'list', status ?? 'all'] as const,
    employee: (empId: number) => ['vacations', 'employee', empId] as const,
  },
} as const
